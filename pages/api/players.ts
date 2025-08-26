// pages/api/players.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlayers } from '../../lib/playersCache';

export const config = { runtime: 'nodejs' };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const forceRefresh = 'refresh' in req.query;
        const { data, ts, source } = await getPlayers({ forceRefresh });

        // Count is handy; Sleeper returns an object keyed by player_id
        const count = typeof data === 'object' && data !== null ? Object.keys(data).length : 0;

        // CDN/cache hints: serve quickly, allow background staleness
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');

        res.status(200).json({
            updatedAt: new Date(ts).toISOString(),
            count,
            source,
            data // full payload here; your UI can fetch this endpoint as needed
        });
    } catch (e: any) {
        res.status(500).json({ error: e?.message || 'Unknown error' });
    }
}
