// components/Cursor.js
import { useEffect, useState } from 'react';
import styles from './Cursor.module.css';

const Cursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return <div className={styles.cursor} style={{ transform: `translate3d(${position.x - 25}px, ${position.y - 25}px, 0)` }} />;
};

export default Cursor;
