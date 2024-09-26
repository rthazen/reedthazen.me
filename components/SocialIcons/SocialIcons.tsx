import styles from './SocialIcons.module.css';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';

const SocialIcons = () => {
    return (
        <div className={`flex flex-row justify-between w-full 2xl:basis-1/3 xl:basis-1/3 lg:basis-1/2 md:basis-1/2 ${styles.icons}`}>
            <a href="https://github.com/rthazen" target="_blank">
                <GitHubIcon fontSize="inherit" className={`fill-pink ${styles.socialIcon}`} />
            </a>
            <a href="https://www.linkedin.com/in/reed-hazen/" target="_blank">
                <LinkedInIcon fontSize="inherit" className={`fill-pink ${styles.socialIcon}`} />
            </a>
            <a href="mailto:reedthazen@gmail.com">
                <EmailIcon fontSize="inherit" className={`fill-pink ${styles.socialIcon}`} />
            </a>
            <a href="https://s3.us-west-2.amazonaws.com/reedthazen.me/resume/Reed+Hazen+Resume.pdf" target="_blank">
                <ArticleIcon fontSize="inherit" className={`fill-pink ${styles.socialIcon}`} />
            </a>
        </div>
    );
};

export default SocialIcons;
