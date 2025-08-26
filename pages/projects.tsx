// pages/projects.tsx
import Head from 'next/head';
import Layout from '../components/Layout';
import { siteTitle } from '../constants/CONST';
import Projects from '../components/Projects';

const ProjectsPage = () => {
    return (
        <Layout>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <Projects />
        </Layout>
    );
};

export default ProjectsPage;
