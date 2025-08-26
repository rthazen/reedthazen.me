import Head from 'next/head';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Layout from '../../components/Layout';
import { siteTitle } from '../../constants/CONST';
import { projects } from '../../constants/projectsConst';
import { projectComponents } from '../../components/Projects/registry.client';

type Props = {
    slug: string;
    title: string;
    summary: string;
    componentProps?: any;
};

export default function ProjectDetailPage({ slug, title, summary, componentProps }: Props) {
    const Cmp = projectComponents[slug];

    return (
        <Layout>
            <Head>
                <title>
                    {title} | {siteTitle}
                </title>
                <meta name="description" content={summary} />
            </Head>

            {Cmp ? (
                <Cmp {...(componentProps ?? {})} />
            ) : (
                <main style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>
                    <h1 style={{ margin: 0 }}>{title}</h1>
                    <p style={{ color: '#4b5563' }}>{summary}</p>
                    <p>Details coming soon.</p>
                </main>
            )}
        </Layout>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const paths = projects.map((p) => ({ params: { slug: p.slug } }));
    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
    const slug = ctx.params?.slug as string;
    const meta = projects.find((p) => p.slug === slug);
    if (!meta) return { notFound: true };

    // Import server builders ONLY here (server side)
    const { projectBuilders } = await import('../../lib/projectBuilders');
    const builder = projectBuilders[slug];

    if (builder) {
        const built = await builder();
        if ('notFound' in built) return { notFound: true };

        return {
            props: {
                slug,
                title: meta.title,
                summary: meta.summary,
                componentProps: built.props
            },
            revalidate: built.revalidate
        };
    }

    // No special builder — just metadata
    return {
        props: { slug, title: meta.title, summary: meta.summary },
        revalidate: 60 * 60
    };
};
