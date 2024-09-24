// components/WaveNavigation.js
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styles from './WaveNavigation.module.css';

const WaveNavigation = () => {
    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    // useEffect(() => {}, [router.query.slug]);

    // const waveVariants = {
    //     hidden: { x: '-100%' },
    //     visible: { x: '100%', transition: { duration: 1.5, ease: 'easeInOut' } },
    //     exit: { x: '-100%', transition: { duration: 1.5, ease: 'easeInOut' } }
    // };

    const handleNavigation = (href) => {
        if (router.pathname === href) {
            return; // Do nothing if already on the same page
        }

        setIsAnimating(true);

        // setTimeout(() => {
        //     router.push(href);
        // }, 1000); // Duration of the wave animation

        setTimeout(() => {
            router.push(href);
            setIsAnimating(false);
        }, 2000); // Duration of the wave animation
    };

    return (
        <div className={styles.navContainer}>
            <nav className={styles.navButtons}>
                <button onClick={() => handleNavigation('/')} className={router.pathname === '/' ? styles.active : ''}>
                    Home
                </button>
                <button onClick={() => handleNavigation('/about')} className={router.pathname === '/about' ? styles.active : ''}>
                    About
                </button>
                <button onClick={() => handleNavigation('/projects')} className={router.pathname === '/projects' ? styles.active : ''}>
                    Projects
                </button>
                <button onClick={() => handleNavigation('/blog')} className={router.pathname === '/blog' ? styles.active : ''}>
                    Blog
                </button>
            </nav>

            {/* Wave animation div */}
            {isAnimating && (
                <motion.div className={styles.wave} animate={{ x: ['calc(0vw - 100%)', 'calc(120vw - 120%', 'calc(0vw - 100%)'] }} transition={{ duration: 2, ease: 'easeInOut' }}></motion.div>
            )}
        </div>
    );
};

export default WaveNavigation;
