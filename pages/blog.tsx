// pages/blog.tsx
import Head from 'next/head';
import Layout from '../components/Layout';
import { siteTitle } from '../constants/CONST';
import { getSortedPostsData } from '../lib/posts';
import Blog from '../components/Blog';
import { GetStaticProps } from 'next';

export default function BlogPage({
    allPostsData
}: {
    allPostsData: {
        date: string;
        title: string;
        id: string;
    }[];
}) {
    return (
        <Layout>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <Blog allPostsData={allPostsData} />
        </Layout>
    );
}

// This runs server-side and can use 'fs'
export const getStaticProps: GetStaticProps = async () => {
    const allPostsData = getSortedPostsData();
    return {
        props: {
            allPostsData
        }
    };
};
