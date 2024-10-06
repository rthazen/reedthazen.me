import Head from 'next/head';
import Layout from '../components/Layout';
import { siteTitle } from '../constants/CONST';
import AboutMe from '../components/AboutMe';

const AboutPage = () => {
    return (
        <Layout>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <AboutMe />
        </Layout>
    );
};

export default AboutPage;
