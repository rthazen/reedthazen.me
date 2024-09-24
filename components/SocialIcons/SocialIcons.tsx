import styles from './SocialIcons.module.css';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailIcon from '@mui/icons-material/Email';
import ArticleIcon from '@mui/icons-material/Article';

const SocialIcons = () => {
    return (
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
    );
};

export default SocialIcons;
