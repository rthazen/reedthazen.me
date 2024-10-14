import styles from './TestimonialCard.module.css';
import { testimonialData } from '../../../constants/CONST';

const TestimonialCard = ({ data }) => {
    return (
        <div className={styles.TestimonialCard}>
            <div className={styles.TestimonialCard__content}>
                <p className={styles.TestimonialCard__content__text}>{data.testimonial}</p>
                <p className={styles.TestimonialCard__content__name}>{data.name}</p>
                <p className={styles.TestimonialCard__content__position}>{data.position}</p>
                <p className={styles.TestimonialCard__content__connection}>{data.connection}</p>
            </div>
        </div>
    );
};

export default TestimonialCard;
