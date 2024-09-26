import { useEffect, useState } from 'react';
import styles from './Cursor.module.css';

const Cursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Use pageX and pageY to account for scrolling
            setPosition({ x: e.pageX, y: e.pageY });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return <div className={styles.cursor} style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }} />;
};

export default Cursor;
