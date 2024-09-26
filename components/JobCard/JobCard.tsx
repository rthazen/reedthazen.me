import styles from './JobCard.module.css';

const JobCard = ({ job }) => {
    return (
        <a href={job.url} className={styles.parentLink} target="_blank">
            <div className={styles.container}>
                <div className={styles.leftSide}>
                    <div className={styles.years}>{job.years}</div>
                </div>
                <div className={styles.rightSide}>
                    <div className={styles.top}>
                        {job.role} - {job.company}
                    </div>
                    <div className={styles.description}>{job.description}</div>
                    {}
                    <div className={styles.projects}>
                        {job.projects.map((project) => (
                            <a href={project.url} target="_blank">
                                {project.name}
                            </a>
                        ))}
                    </div>
                    <div className={styles.skills}>
                        {job.skills.map((skill) => (
                            <div>{skill}</div>
                        ))}
                    </div>
                    <div className={styles.note}>note: {job.note}</div>
                </div>
            </div>
        </a>
    );
};

export default JobCard;
