import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import Wrapper from '../Wrapper';

const Footer = () => {
    return (
        <footer className="text-center flex flex-col justify-center items-center">
            <p>Built with next.js and tailwind.css</p>
            <Image src="/sunset.png" alt="Reed Hazen" className="logo" width={200} height={200} />
            <div className="flex-row">
                <a href="https://github.com/rthazen" target="_blank">
                    <GitHubIcon fontSize="inherit" className={styles.socialIcon} color="primary" />
                </a>
                <a href="https://www.linkedin.com/in/reed-hazen/" target="_blank">
                    <LinkedInIcon fontSize="inherit" className={styles.socialIcon} color="primary" />
                </a>
                <a href="mailto:reedthazen@gmail.com">
                    <EmailIcon fontSize="inherit" className={styles.socialIcon} color="primary" />
                </a>
                <a href="https://s3.us-west-2.amazonaws.com/reedthazen.me/resume/Reed+Hazen+Resume.pdf" color="primary" target="_blank">
                    CV
                </a>
            </div>
            <a href="https://app.netlify.com/sites/reedthazen-test/deploys">
                <img src="https://api.netlify.com/api/v1/badges/de38faac-ff43-4250-a70a-4cdd92db7340/deploy-status" alt="Netlify Status" />
            </a>
        </footer>
    );
};

export default Footer;
