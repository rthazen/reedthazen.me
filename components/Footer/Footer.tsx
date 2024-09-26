import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';
import Wrapper from '../Wrapper';
import SocialIcons from '../SocialIcons';

const Footer = ({ home }) => {
    return (
        <footer className="text-center flex flex-col justify-center items-center w-full mt-8">
            <Wrapper direction="col">
                {/* <Image src="/sunset.png" alt="Reed Hazen" className={styles.logo} width={200} height={200} /> */}
                <SocialIcons />
                {!home && (
                    <>
                        <a href="https://app.netlify.com/sites/reedthazen-test/deploys">
                            <img src="https://api.netlify.com/api/v1/badges/de38faac-ff43-4250-a70a-4cdd92db7340/deploy-status" alt="Netlify Status" />
                        </a>
                        <p className={styles.note}>Built with next.js and tailwind.css</p>
                    </>
                )}
            </Wrapper>
        </footer>
    );
};

export default Footer;
