import dynamic from 'next/dynamic';

// Map slugs to components (client-safe)
export const projectComponents: Record<string, React.ComponentType<any>> = {
    'fantasy-football': dynamic(() => import('../Projects/FantasyFootball/FantasyFootball').then((m) => m.default))
};
