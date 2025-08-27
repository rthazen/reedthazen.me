// pages/api/draft-data.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlayers } from '../../lib/playersCache';

type SlimPlayer = {
    id: string;
    name: string;
    team: string;
    pos: string; // joined positions e.g. "RB/WR"
    primary: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
    rank: number; // skills: >0 rank; DEF can be 0
    age: number | null;
};

type Payload = {
    updatedAt: string;
    skillsTop200: SlimPlayer[]; // QB/RB/WR/TE/K only
    defenses: SlimPlayer[]; // all team DEF
};

const ALLOWED = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);

function getPrimary(fantasy_positions?: string[] | null, position?: string | null): SlimPlayer['primary'] | '' {
    const arr = (Array.isArray(fantasy_positions) ? fantasy_positions : []).map((s) => String(s).toUpperCase());
    const pick = (...opts: string[]) => arr.find((v) => opts.includes(v));
    const p = pick('QB', 'RB', 'WR', 'TE', 'K', 'DEF') || (position && ALLOWED.has(position.toUpperCase()) ? position.toUpperCase() : '');
    return (p as any) || '';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Payload | { error: string }>) {
    try {
        const { data, ts } = await getPlayers(); // cached in memory/disk; no big network here
        const arr: any[] = Object.values(data || {});

        const skills: SlimPlayer[] = [];
        const defs: SlimPlayer[] = [];

        for (const p of arr) {
            if (!p || p.player_id == null) continue;

            const primary = getPrimary(p.fantasy_positions, p.position);
            if (!primary || !ALLOWED.has(primary)) continue; // drop IDP etc.

            const id = String(p.player_id);
            const team = p.team ?? '';
            const rankNum = typeof p.search_rank === 'number' ? p.search_rank : Number(p.search_rank);

            // friendly name
            let first = (p.first_name ?? '').trim();
            let last = (p.last_name ?? '').trim();
            let name = `${first} ${last}`.trim();
            if (!name) {
                if (primary === 'DEF') name = `${team || 'Team'} DEF`;
                else if (primary === 'K') name = `${team || 'Team'} K`;
                else name = id;
            }

            const joined = Array.isArray(p.fantasy_positions) && p.fantasy_positions.length > 0 ? p.fantasy_positions.join('/') : p.position ?? primary;

            if (primary === 'DEF') {
                defs.push({
                    id,
                    name,
                    team,
                    pos: joined,
                    primary,
                    rank: Number.isFinite(rankNum) ? rankNum : 0,
                    age: p.age ?? null
                });
            } else {
                // keep only positively ranked skill players
                if (!Number.isFinite(rankNum) || rankNum <= 0) continue;
                skills.push({
                    id,
                    name,
                    team,
                    pos: joined,
                    primary,
                    rank: rankNum,
                    age: p.age ?? null
                });
            }
        }

        skills.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
        const skillsTop200 = skills.slice(0, 200);

        defs.sort((a, b) => a.name.localeCompare(b.name));

        // cache headers (CDN can keep this fresh for an hour)
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
        return res.status(200).json({
            updatedAt: new Date(ts).toISOString(),
            skillsTop200,
            defenses: defs
        });
    } catch (e: any) {
        return res.status(500).json({ error: e?.message || 'failed' });
    }
}

// Keep this API tiny; if you ever bump it, you can cap it here explicitly:
export const config = {
    api: {
        responseLimit: '1mb' // well under the 4MB warning
    }
};
