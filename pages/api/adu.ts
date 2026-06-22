// pages/api/adu.ts
// Shared persistence for the ADU Client Selections checklist.
// GET  → open read of the current document
// PUT  → password-gated write; merges with the stored doc so concurrent
//        async edits (you + your PM) converge instead of clobbering.
import type { NextApiRequest, NextApiResponse } from 'next';
import { getStore, type Store } from '@netlify/blobs';
import { promises as fs } from 'fs';
import path from 'path';
import { buildStructureFromLegacy, type ChecklistSection } from '../../constants/aduChecklist';

const STORE_NAME = 'adu';
const DOC_KEY = 'selections';

// ── Shared document shape (mirrors the client) ──────────────────────────────────
// `structure` is the editable checklist (sections → groups → items, with labels
// and notes). `entries` is keyed by item id for the chosen selection, and by
// `${itemId}::due` for that item's due date — both carry blame and merge per-field.
type BlameEntry = { value: string; editedBy: string; editedAt: string };
type OptionDef = { id: string; label: string; addedBy: string; addedAt: string };
type AduState = {
    structure: ChecklistSection[];
    structureUpdatedAt: string; // ISO; structure merges last-write-wins on this
    entries: Record<string, BlameEntry>;
    options: Record<string, OptionDef[]>;
    deleted: string[]; // tombstones for permanently deleted option ids
};

const EPOCH = new Date(0).toISOString();

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
        const doc = await store.get(DOC_KEY, { type: 'json' });
        return normalize(doc);
    } catch {
        // Dev fallback
        try {
            const raw = await fs.readFile(DEV_FILE, 'utf8');
            return normalize(JSON.parse(raw));
        } catch {
            return normalize(null);
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

// Accept anything that at least looks like a doc with selection data.
function isValidState(x: any): boolean {
    return !!x && typeof x === 'object' && typeof x.entries === 'object';
}

// Normalize any stored/incoming doc (including the older shape that had
// `customItems`/`removedItems` but no editable structure) to the current shape.
function normalize(x: any): AduState {
    const hasStructure = Array.isArray(x?.structure);
    const structure: ChecklistSection[] = hasStructure
        ? x.structure
        : buildStructureFromLegacy(x?.customItems, x?.removedItems);
    return {
        structure,
        // Migrated-from-legacy structures get EPOCH so any real edit wins on merge.
        structureUpdatedAt: x?.structureUpdatedAt ?? EPOCH,
        entries: x?.entries ?? {},
        options: x?.options ?? {},
        deleted: x?.deleted ?? []
    };
}

// Merge two docs so async collaborators converge:
//  - structure: last-write-wins on `structureUpdatedAt` (rare, usually one editor)
//  - entries: keep the edit with the later timestamp per field (covers due dates)
//  - options: union by id per item, later-touched (addedAt) wins, minus tombstones
//  - deleted: union of option tombstones (grows only)
function mergeState(storedRaw: AduState, incomingRaw: AduState): AduState {
    const stored = normalize(storedRaw);
    const incoming = normalize(incomingRaw);

    const sTime = (d: AduState) => Date.parse(d.structureUpdatedAt) || 0;
    const useIncoming = sTime(incoming) >= sTime(stored);
    const structure = useIncoming ? incoming.structure : stored.structure;
    const structureUpdatedAt = useIncoming ? incoming.structureUpdatedAt : stored.structureUpdatedAt;

    const deleted = Array.from(new Set(stored.deleted.concat(incoming.deleted)));
    const isDeleted = new Set(deleted);

    const entries: Record<string, BlameEntry> = { ...stored.entries };
    for (const [id, inc] of Object.entries(incoming.entries)) {
        const cur = entries[id];
        if (!cur || new Date(inc.editedAt).getTime() >= new Date(cur.editedAt).getTime()) {
            entries[id] = inc;
        }
    }

    const options: Record<string, OptionDef[]> = {};
    const optItemIds = Array.from(new Set(Object.keys(stored.options).concat(Object.keys(incoming.options))));
    for (const itemId of optItemIds) {
        const byId = new Map<string, OptionDef>();
        for (const o of stored.options[itemId] ?? []) byId.set(o.id, o);
        for (const o of incoming.options[itemId] ?? []) {
            const cur = byId.get(o.id);
            if (!cur || new Date(o.addedAt).getTime() >= new Date(cur.addedAt).getTime()) {
                byId.set(o.id, o);
            }
        }
        const kept = Array.from(byId.values()).filter((o) => !isDeleted.has(o.id));
        if (kept.length) options[itemId] = kept;
    }

    return { structure, structureUpdatedAt, entries, options, deleted };
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
