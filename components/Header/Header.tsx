import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';
import utilStyles from '../../styles/utils.module.css';
import Wrapper from '../Wrapper';
import WaveNavigation from '../WaveNavigation';
import { name } from '../../constants/CONST';

const Header = ({ home }) => {
    return (
        <header className={styles.header}>
            <Wrapper>
                <div className="flex justify-start items-center w-full">
                    <Link href="/">
                        <Image priority src="/sunset.png" className={`${utilStyles.borderCircle} ${styles.headerImage}`} height={108} width={108} alt={name} />
                    </Link>
                    {/* <h2 className={utilStyles.headingLg}>
                                <Link href="/" className={utilStyles.colorInherit}>
                                    {name}
                                </Link>
                            </h2> */}
                </div>
                <WaveNavigation />
            </Wrapper>
        </header>
    );
};

export default Header;
