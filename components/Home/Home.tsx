import Image from 'next/image';
import Link from 'next/link';
import styles from './Home.module.css';
import utilStyles from '../../styles/utils.module.css';
import Wrapper from '../Wrapper';
import WaveNavigation from '../WaveNavigation';
import SocialIcons from '../SocialIcons';
import { name } from '../../constants/CONST';

const Home = ({ home }) => {
    return (
        <div className={styles.header}>
            <Wrapper direction="col">
                <div className="flex justify-between items-center w-full">
                    <div className={styles.leftSide}>
                        <Image priority src="/images/profile.jpg" className={`${utilStyles.borderCircle} ${styles.headerImage}`} height={144} width={144} alt={name} />
                        <h1 className={utilStyles.heading2Xl}>{name}</h1>
                    </div>

                    <WaveNavigation />
                </div>
                <div className="flex justify-end w-full">
                    <SocialIcons />
                </div>
            </Wrapper>
        </div>
    );
};

export default Home;
