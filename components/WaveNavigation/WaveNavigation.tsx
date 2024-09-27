import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import styles from './WaveNavigation.module.css';

const WaveNavigation = () => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const router = useRouter();
    const mobileMenuRef = useRef(null); // Create a ref for the mobile menu

    const handleNavigation = (e, href) => {
        e.preventDefault();
        if (router.pathname === href) {
            return; // Do nothing if already on the same page
        }

        setIsAnimating(true);
        setIsMobileMenuOpen(false); // Close mobile menu after navigation

        router.prefetch(href);

        setTimeout(() => {
            router.push(href);
        }, 1300);

        setTimeout(() => {
            setIsAnimating(false);
        }, 2000);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Close the menu when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        };

        // Add event listener to the document
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup the event listener on component unmount
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={`w-full lg:w-3/4 ${styles.navContainer}`}>
            {/* Hamburger Icon for Mobile */}
            <button className={styles.hamburger} onClick={toggleMobileMenu} aria-expanded={isMobileMenuOpen} aria-label="Toggle navigation menu">
                <span className={isMobileMenuOpen ? styles.hamburgerOpen : ''}></span>
                <span className={isMobileMenuOpen ? styles.hamburgerOpen : ''}></span>
                <span className={isMobileMenuOpen ? styles.hamburgerOpen : ''}></span>
            </button>

            {/* Regular Navigation */}
            <nav
                ref={mobileMenuRef} // Attach the ref to the mobile menu
                className={`${styles.navButtons} ${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
            >
                <button onClick={(e) => handleNavigation(e, '/')} className={router.pathname === '/' ? styles.active : ''}>
                    Home
                </button>
                <button onClick={(e) => handleNavigation(e, '/about')} className={router.pathname === '/about' ? styles.active : ''}>
                    About
                </button>
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
