import React from 'react';
import styles from './Wrapper.module.css';

interface WrapperProps {
    direction?: 'row' | 'col'; // You can extend this with 'row-reverse' | 'col-reverse' if needed
    children: React.ReactNode;
}

const Wrapper: React.FC<WrapperProps> = ({ direction = 'row', children }) => {
    const flexDirectionClass = direction === 'row' ? 'flex-row' : 'flex-col';
    return <div className={`w-9/10 md:w-8/10 ${flexDirectionClass} ${styles.wrapper}`}>{children}</div>;
};

export default Wrapper;
