import styles from './TestimonialSlider.module.css';
import { testimonialData } from '../../constants/CONST';
import TestimonialCard from './TestimonialCard';

const TestimonialSlider = () => {
    return (
        <div className={styles.TestimonialSlider}>
            {testimonialData.map((item, index) => {
                return <TestimonialCard key={index} data={item} />;
            })}
        </div>
    );
};

export default TestimonialSlider;
