// constants/projectsConst.ts
export type Project = {
    slug: string;
    title: string; // what shows in UI
    summary: string;
    tags?: string[];
};

export const projects: Project[] = [
    {
        slug: 'fantasy-football',
        title: 'Fantasy Football Draft Assistant', // 👈 spaced title for UI
        summary: 'Next.js app that fetches and caches ~5MB of NFL player data from the Sleeper API for fast lookups.',
        tags: ['Next.js', 'TypeScript', 'API', 'Caching']
    },
    {
        slug: 'adu-collaborator',
        title: 'ADU Selections Tracker',
        summary: 'Interactive checklist for tracking and sharing ADU construction selections with the project manager.',
        tags: ['Construction', 'ADU', 'Los Angeles']
    }
];
