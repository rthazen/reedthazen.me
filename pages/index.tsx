import Head from 'next/head';
import Layout from '../components/Layout';
import { siteTitle } from '../constants/CONST';
import Home from '../components/Home';

export default function HomePage() {
    return (
        <Layout home>
            <Head>
                <title>{siteTitle}</title>
            </Head>
            <Home home />
        </Layout>
    );
}
