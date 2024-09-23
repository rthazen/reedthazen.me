import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';
import Wrapper from '../Wrapper';

const Footer = () => {
    return (
        <footer className="text-center flex flex-col justify-center items-center w-full">
            <Wrapper direction="col">
                <Image src="/sunset.png" alt="Reed Hazen" className={styles.logo} width={200} height={200} />
                <div className={`flex-row ${styles.icons}`}>
                    <a href="https://github.com/rthazen" target="_blank">
                        <GitHubIcon fontSize="inherit" className={styles.socialIcon} color="primary" />
                    </a>
                    <a href="https://www.linkedin.com/in/reed-hazen/" target="_blank">
                        <LinkedInIcon fontSize="inherit" className={styles.socialIcon} color="primary" />
                    </a>
                    <a href="mailto:reedthazen@gmail.com">
                        <EmailIcon fontSize="inherit" className={styles.socialIcon} color="primary" />
                    </a>
                    <a href="https://s3.us-west-2.amazonaws.com/reedthazen.me/resume/Reed+Hazen+Resume.pdf" target="_blank">
                        <ArticleIcon fontSize="inherit" className={styles.socialIcon} color="primary" />
                    </a>
                </div>
                <a href="https://app.netlify.com/sites/reedthazen-test/deploys">
                    <img src="https://api.netlify.com/api/v1/badges/de38faac-ff43-4250-a70a-4cdd92db7340/deploy-status" alt="Netlify Status" />
                </a>
                <p className={styles.note}>Built with next.js and tailwind.css</p>
            </Wrapper>
        </footer>
    );
};

export default Footer;
