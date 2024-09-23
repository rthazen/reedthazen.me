import styles from './AboutMe.module.css';
import utilStyles from '../../styles/utils.module.css';
import Wrapper from '../Wrapper';

const AboutMe = () => {
    return (
        <section className={`${utilStyles.headingMd} ${styles.section}`}>
            <Wrapper direction="col">
                <p className="text-3xl font-bold underline text-center">This is a WIP</p>
                <p>
                    Interested in technologically progressive industries that support creativity, where I can contribute my education, professional experience and talents to drive the industry
                    forward.
                </p>
            </Wrapper>
        </section>
    );
};

export default AboutMe;
