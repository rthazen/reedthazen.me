// lib/playersCache.ts
import path from 'path';

const ENDPOINT = 'https://api.sleeper.app/v1/players/nfl';
const TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK_DIR = process.env.PLAYERS_CACHE_DIR || '/tmp';
const CACHE_FILE = path.join(FALLBACK_DIR, 'players-nfl.json');

let memData: any | null = null;
let memTimestamp = 0;

function isFresh(ts: number) {
    return Date.now() - ts < TTL_MS;
}

async function readFromDisk() {
    try {
        const fs = await import('fs');
        const buf = await fs.promises.readFile(CACHE_FILE, 'utf8');
        const parsed = JSON.parse(buf);
        if (parsed && parsed.ts && parsed.data) return parsed;
        return null;
    } catch {
        return null;
    }
}

async function writeToDisk(data: any) {
    try {
        const fs = await import('fs');
        await fs.promises.mkdir(path.dirname(CACHE_FILE), { recursive: true });
        await fs.promises.writeFile(CACHE_FILE, JSON.stringify({ ts: Date.now(), data }), 'utf8');
    } catch {
        /* ignore in read-only/edge */
    }
}

async function fetchRemote() {
    const res = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    return res.json();
}

export async function getPlayers(opts?: { forceRefresh?: boolean }) {
    const forceRefresh = opts?.forceRefresh ?? false;

    if (!forceRefresh && memData && isFresh(memTimestamp)) {
        return { data: memData, ts: memTimestamp, source: 'memory' as const };
    }

    const disk = await readFromDisk();
    if (!forceRefresh && disk && isFresh(disk.ts)) {
        memData = disk.data;
        memTimestamp = disk.ts;
        return { data: memData, ts: memTimestamp, source: 'disk' as const };
    }

    const data = await fetchRemote();
    memData = data;
    memTimestamp = Date.now();
    await writeToDisk(data);

    return { data: memData, ts: memTimestamp, source: 'remote' as const };
}
