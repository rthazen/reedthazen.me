import Layout from '../../components/Layout';
import { getAllPostIds, getPostData } from '../../lib/posts';
import Head from 'next/head';
import Date from '../../components/date';
import utilStyles from '../../styles/utils.module.css';
import layoutStyles from '../../components/Layout/Layout.module.css';
import styles from './Posts.module.css';
import Link from 'next/link';
import { GetStaticProps, GetStaticPaths } from 'next';
import Wrapper from '../../components/Wrapper';

export default function Post({
    postData
}: {
    postData: {
        title: string;
        date: string;
        contentHtml: string;
    };
}) {
    return (
        <Layout>
            <Head>
                <title>{postData.title}</title>
            </Head>
            <section className={`${utilStyles.headingMd} ${utilStyles.section}`}>
                <Wrapper direction="col">
                    <article className="w-full">
                        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
                        <div className={utilStyles.lightText}>
                            <Date dateString={postData.date} />
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} className={styles.contentHTML} />
                    </article>
                    <div className={layoutStyles.backToHome}>
                        <Link href="/">← Back to home</Link>
                    </div>
                </Wrapper>
            </section>
        </Layout>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const paths = getAllPostIds();
    return {
        paths,
        fallback: false
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const postData = await getPostData(params.id as string);
    return {
        props: {
            postData
        }
    };
};
