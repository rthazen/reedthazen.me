import Image from 'next/image';
import Link from 'next/link';
import styles from './Home.module.css';
import utilStyles from '../../styles/utils.module.css';
import Wrapper from '../Wrapper';
import WaveNavigation from '../WaveNavigation';
import SocialIcons from '../SocialIcons';
import { name, jobTitle, blurb } from '../../constants/CONST';

const Home = ({ home }) => {
    return (
        <div className={styles.header}>
            <Wrapper direction="col">
                <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center w-full">
                    <div className={`flex flex-col w-full mb-8 lg:mb-0 lg:flex-row items-center justify-center lg:justify-start ${styles.leftSide}`}>
                        {/* <Image priority src="/images/profile.jpg" className={`${utilStyles.borderCircle} ${styles.headerImage}`} height={144} width={144} alt={name} /> */}
                        <Image priority src="/sunset.png" className={`mr-0 mb-8 lg:mr-8 lg:mb-0 ${utilStyles.borderCircle} ${styles.headerImage}`} height={144} width={144} alt={name} />
                        <div className={`justify-center items-center lg:justify-start lg:items-start ${styles.personalInfo}`}>
                            <h1 className={`${utilStyles.heading2Xl} ${styles.name}`}>{name}</h1>
                            <p className={styles.jobTitle}>{jobTitle}</p>
                            {/* <p className={styles.blurb}>{blurb}</p> */}
                        </div>
                    </div>

                    <WaveNavigation />
                </div>
                <div className="flex justify-between lg:justify-end md:justify-center sm:justify-between w-full">
                    <SocialIcons />
                </div>
                {/* <div className="flex justify-end w-full">
                    <Image src="/sunset.png" alt="Reed Hazen" className={styles.logo} width={200} height={200} />
                </div> */}
            </Wrapper>
        </div>
    );
};

export default Home;
