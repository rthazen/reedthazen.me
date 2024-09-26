import styles from './AboutMe.module.css';
import utilStyles from '../../styles/utils.module.css';
import Wrapper from '../Wrapper';
import JobCard from '../JobCard';
import { jobData } from '../../constants/CONST';

const AboutMe = () => {
    return (
        <section className={`${utilStyles.headingMd} ${styles.section}`}>
            <Wrapper>
                <div className={styles.content}>
                    <div className={styles.leftSide}>
                        <p className={styles.copy}>
                            Hello, my name is Reed Hazen, thank you for visiting and learning more about me. I am a frontend engineer that has a passion about all things thought-provoking. This
                            curiosity initially led me to start frontend design and development over 10 years ago. Although I began with a focus on design, I soon gravitated toward the architectural
                            aspects of development. After gaining experience working for creative agencies, I learned various methods of building websites. Over the last 7 years, I've primarily
                            focused on building web applications using React and mobile apps with React Native. As I grew more comfortable with frontend development, I expanded into full-stack
                            development using Node.js and delved into AWS Cloud technologies, among others.
                        </p>
                        <p className={styles.copy}>
                            I am driven by the desire to create impactful products and continuously improve at what I do. I'm excited by the opportunity to learn and work with emerging technologies
                            like AI, blockchain, cybersecurity, and cloud computing, while also deepening my expertise in the technologies I'm already proficient in.
                        </p>
                    </div>
                    <div className={styles.rightSide}>
                        <div className={styles.jobs}>
                            {jobData.map((job) => (
                                <JobCard job={job} />
                            ))}
                        </div>
                    </div>
                </div>
            </Wrapper>
        </section>
    );
};

export default AboutMe;
