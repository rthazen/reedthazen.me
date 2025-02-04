import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import '../styles/global.css';
import { AppProps } from 'next/app';
import WaveNavigation from '../components/WaveNavigation';
import Cursor from '../components/Cursor';

function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={router.route} // ensures animation on page change
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
            >
                <Cursor />
                <Component key={router.asPath} {...pageProps} />
            </motion.div>
        </AnimatePresence>
    );
}

export default App;
