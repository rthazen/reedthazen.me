import styles from './JobCard.module.css';

const JobCard = ({ job }) => {
    const handleCardClick = (url) => {
        window.open(url, '_blank');
    };

    return (
        <div onClick={() => handleCardClick(job.url)} className={styles.parentLink}>
            <div className={styles.container}>
                <div className={styles.leftSide}>
                    <div className={styles.years}>{job.years}</div>
                </div>
                <div className={styles.rightSide}>
                    <div className={styles.top}>
                        {job.role} - {job.company}
                    </div>
                    <div className={styles.description}>{job.description}</div>
                    <div className={styles.projects}>
                        {job.projects.map((project, index) => (
                            <a href={project.url} target="_blank" key={index} onClick={(e) => e.stopPropagation()}>
                                {project.name}
                            </a>
                        ))}
                    </div>
                    <div className={styles.skills}>
                        {job.skills.map((skill, index) => (
                            <div key={index}>{skill}</div>
                        ))}
                    </div>
                    <div className={styles.note}>note: {job.note}</div>
                </div>
            </div>
        </div>
    );
};

export default JobCard;
