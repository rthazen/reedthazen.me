// pages/api/adu.ts
// Shared persistence for the ADU Client Selections checklist.
// GET  → open read of the current document
// PUT  → password-gated write; merges with the stored doc so concurrent
//        async edits (you + your PM) converge instead of clobbering.
import type { NextApiRequest, NextApiResponse } from 'next';
import { getStore, type Store } from '@netlify/blobs';
import { promises as fs } from 'fs';
import path from 'path';

const STORE_NAME = 'adu';
const DOC_KEY = 'selections';

// ── Shared document shape (mirrors the client) ──────────────────────────────────
// `entries` is keyed by item id for the chosen selection, and by `${itemId}::due`
// for that item's due date — both carry blame and merge identically.
type BlameEntry = { value: string; editedBy: string; editedAt: string };
type CustomItemDef = { id: string; label: string; type?: 'text' | 'yes_no' };
type OptionDef = { id: string; label: string; addedBy: string; addedAt: string };
type AduState = {
    entries: Record<string, BlameEntry>;
    options: Record<string, OptionDef[]>;
    customItems: Record<string, CustomItemDef[]>;
    removedItems: string[];
};

const EMPTY: AduState = { entries: {}, options: {}, customItems: {}, removedItems: [] };

// ── Storage: Netlify Blobs in production, local file fallback for `next dev` ──────
// Plain `next dev` has no Netlify Blobs runtime context, so getStore() throws.
// We fall back to a gitignored JSON file in the project root so local edits
// persist stably. In production (or under `netlify dev`) real Blobs are used.
const DEV_FILE = path.join(process.cwd(), '.adu-dev-store.json');

function resolveStore(): Store {
    const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;
    if (siteID && token) {
        return getStore({ name: STORE_NAME, siteID, token });
    }
    return getStore(STORE_NAME);
}

async function readDoc(): Promise<AduState> {
    try {
        const store = resolveStore();
        const doc = (await store.get(DOC_KEY, { type: 'json' })) as AduState | null;
        return normalize(doc);
    } catch {
        // Dev fallback
        try {
            const raw = await fs.readFile(DEV_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            return isValidState(parsed) ? normalize(parsed) : EMPTY;
        } catch {
            return EMPTY;
        }
    }
}

async function writeDoc(state: AduState): Promise<void> {
    try {
        const store = resolveStore();
        await store.setJSON(DOC_KEY, state);
    } catch {
        // Dev fallback
        await fs.writeFile(DEV_FILE, JSON.stringify(state), 'utf8');
    }
}

function isValidState(x: any): x is AduState {
    return (
        x &&
        typeof x === 'object' &&
        typeof x.entries === 'object' &&
        typeof x.customItems === 'object' &&
        Array.isArray(x.removedItems)
    );
}

// Normalize older/looser docs so every field exists before merging.
function normalize(x: Partial<AduState> | null | undefined): AduState {
    return {
        entries: x?.entries ?? {},
        options: x?.options ?? {},
        customItems: x?.customItems ?? {},
        removedItems: x?.removedItems ?? []
    };
}

// Merge two docs so async collaborators converge:
//  - entries: keep the edit with the later timestamp per field (covers due dates)
//  - options: union by id per item, keeping the later-touched version (addedAt)
//  - customItems: union by id per subsection (incoming label wins on conflict)
//  - removedItems: union
function mergeState(storedRaw: AduState, incomingRaw: AduState): AduState {
    const stored = normalize(storedRaw);
    const incoming = normalize(incomingRaw);

    const entries: Record<string, BlameEntry> = { ...stored.entries };
    for (const [id, inc] of Object.entries(incoming.entries)) {
        const cur = entries[id];
        if (!cur || new Date(inc.editedAt).getTime() >= new Date(cur.editedAt).getTime()) {
            entries[id] = inc;
        }
    }

    const options: Record<string, OptionDef[]> = {};
    const optItemIds = Array.from(
        new Set(Object.keys(stored.options).concat(Object.keys(incoming.options)))
    );
    for (const itemId of optItemIds) {
        const byId = new Map<string, OptionDef>();
        for (const o of stored.options[itemId] ?? []) byId.set(o.id, o);
        for (const o of incoming.options[itemId] ?? []) {
            const cur = byId.get(o.id);
            if (!cur || new Date(o.addedAt).getTime() >= new Date(cur.addedAt).getTime()) {
                byId.set(o.id, o);
            }
        }
        options[itemId] = Array.from(byId.values());
    }

    const customItems: Record<string, CustomItemDef[]> = {};
    const subIds = Array.from(
        new Set(Object.keys(stored.customItems).concat(Object.keys(incoming.customItems)))
    );
    for (const subId of subIds) {
        const byId = new Map<string, CustomItemDef>();
        for (const it of stored.customItems[subId] ?? []) byId.set(it.id, it);
        for (const it of incoming.customItems[subId] ?? []) byId.set(it.id, it); // incoming wins
        customItems[subId] = Array.from(byId.values());
    }

    const removedItems = Array.from(
        new Set(stored.removedItems.concat(incoming.removedItems))
    );

    return { entries, options, customItems, removedItems };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // ── Read (open) ──
    if (req.method === 'GET') {
        try {
            const doc = await readDoc();
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json(doc);
        } catch (e: any) {
            return res.status(500).json({ error: e?.message || 'read failed' });
        }
    }

    // ── Write (password-gated) ──
    if (req.method === 'PUT' || req.method === 'POST') {
        const expected = process.env.ADU_EDIT_PASSWORD;
        if (!expected) {
            return res.status(503).json({
                error: 'Editing is not configured. Set ADU_EDIT_PASSWORD in the environment.'
            });
        }
        const provided = (req.headers['x-adu-edit-password'] as string | undefined) ?? '';
        if (provided !== expected) {
            return res.status(401).json({ error: 'Incorrect edit password.' });
        }

        const incoming = req.body;
        if (!isValidState(incoming)) {
            return res.status(400).json({ error: 'Invalid payload.' });
        }

        try {
            const stored = await readDoc();
            const merged = mergeState(stored, incoming);
            await writeDoc(merged);
            res.setHeader('Cache-Control', 'no-store');
            return res.status(200).json(merged);
        } catch (e: any) {
            return res.status(500).json({ error: e?.message || 'write failed' });
        }
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
}
