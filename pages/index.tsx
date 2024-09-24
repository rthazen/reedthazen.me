import Head from 'next/head';
import Layout from '../components/Layout';
import { siteTitle } from '../constants/CONST';

export default function Home() {
    return (
        <Layout home>
            <Head>
                <title>{siteTitle}</title>
            </Head>
        </Layout>
    );
}
