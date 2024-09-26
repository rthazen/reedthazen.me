import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import styles from './WaveNavigation.module.css';

const WaveNavigation = () => {
    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    const handleNavigation = (e, href) => {
        e.preventDefault();
        if (router.pathname === href) {
            return; // Do nothing if already on the same page
        }

        setIsAnimating(true);

        // Prefetch the next page so it loads in the background
        router.prefetch(href);

        // Run the animation while page is loading
        setTimeout(() => {
            router.push(href);
        }, 1300); // Trigger the navigation after part of the animation

        // Keep the animation running for 2 seconds
        setTimeout(() => {
            setIsAnimating(false);
        }, 2000); // Duration of the wave animation
    };

    return (
        <div className={`mb-8 lg:mb-0 w-full lg:w-3/4 ${styles.navContainer}`}>
            <nav className={styles.navButtons}>
                <button onClick={(e) => handleNavigation(e, '/')} className={router.pathname === '/' ? styles.active : ''}>
                    Home
                </button>
                <button onClick={(e) => handleNavigation(e, '/about')} className={router.pathname === '/about' ? styles.active : ''}>
                    About
                </button>
                {/* <button onClick={(e) => handleNavigation(e, '/projects')} className={router.pathname === '/projects' ? styles.active : ''}>
                    Projects
                </button> */}
                <button onClick={(e) => handleNavigation(e, '/blog')} className={router.pathname === '/blog' ? styles.active : ''}>
                    Blog
                </button>
            </nav>

            {/* Wave animation div */}
            {isAnimating && (
                <motion.div className={styles.wave} animate={{ x: ['calc(0vw - 100%)', 'calc(120vw - 120%)', 'calc(0vw - 100%)'] }} transition={{ duration: 2, ease: 'easeInOut' }}></motion.div>
            )}
        </div>
    );
};

export default WaveNavigation;
