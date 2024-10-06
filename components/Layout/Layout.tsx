import Head from 'next/head';
import styles from './Layout.module.css';
import Header from '../Header';
import Footer from '../Footer';
import { siteTitle } from '../../constants/CONST';

const Layout = ({ children, home, showProfile }: { children: React.ReactNode; home?: boolean; showProfile?: boolean }) => {
    return (
        <div className={styles.container}>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"></link>
                <meta name="description" content={siteTitle} />
                <meta property="og:image" content="/palm-sunrise-color.svg" />
                <meta name="og:title" content={siteTitle} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
            </Head>
            {!home && <Header home={home} showProfile={showProfile} />}
            <main className={styles.main}>{children}</main>

            {!home && <Footer home={home} />}
        </div>
    );
};

export default Layout;
