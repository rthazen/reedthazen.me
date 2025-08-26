// lib/projectBuilders.ts
// Server-only logic: can call getPlayers, touch fs via playersCache, etc.

export const projectBuilders: Record<string, () => Promise<{ props: any; revalidate?: number } | { notFound: true }>> = {
    'fantasy-football': async () => {
        const { getPlayers } = await import('./playersCache'); // stays server-side
        try {
            const { ts, source, data } = await getPlayers();
            const count = data ? Object.keys(data).length : 0;
            return {
                props: {
                    updatedAt: new Date(ts).toISOString(),
                    count,
                    data,
                    source
                },
                revalidate: 60 * 60 // 1h
            };
        } catch {
            return {
                props: { updatedAt: null, count: null, source: null },
                revalidate: 10 * 60
            };
        }
    }
};
// Add more projects here as needed
// e.g. 'another-project': async () => { ... }
