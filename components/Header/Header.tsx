import Image from 'next/image';
import Link from 'next/link';
import styles from './Header.module.css';
import utilStyles from '../../styles/utils.module.css';
import Wrapper from '../Wrapper';
import WaveNavigation from '../WaveNavigation';
import { name } from '../../constants/CONST';

const Header = ({ home, showProfile }) => {
    return (
        <header className={`mb-0 py-8 lg:mb-4 ${styles.header}`}>
            <Wrapper>
                <div className="flex flex-col items-center lg:flex-row w-full">
                    <div className="flex justify-center lg:justify-start items-center w-full mb-8 lg:mb-0">
                        <Link href="/">
                            {showProfile ? (
                                <Image priority src="/images/profile.jpg" className={`mr-0 lg:mr-8 ${utilStyles.borderCircle} ${styles.headerImage}`} height={108} width={108} alt={name} />
                            ) : (
                                <Image priority src="/sunset.png" className={`${utilStyles.borderCircle} ${styles.headerImage}`} height={108} width={108} alt={name} />
                            )}
                        </Link>
                        {/* <h2 className={utilStyles.headingLg}>
                                <Link href="/" className={utilStyles.colorInherit}>
                                    {name}
                                </Link>
                            </h2> */}
                    </div>
                    <WaveNavigation />
                </div>
            </Wrapper>
        </header>
    );
};

export default Header;
