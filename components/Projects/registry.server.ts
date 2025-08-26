// components/projects/registry.server.ts
import 'server-only';
export const builders = {
    'fantasy-football': async () => {
        const { getPlayers } = await import('../../lib/playersCache');
        const { ts, source, data } = await getPlayers();
        const count = data ? Object.keys(data).length : 0;
        return {
            props: { updatedAt: new Date(ts).toISOString(), count, source },
            revalidate: 3600
        };
    }
};
