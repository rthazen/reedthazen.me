import Link from 'next/link';
import styles from './Projects.module.css';
import utilStyles from '../../styles/utils.module.css';
import Wrapper from '../Wrapper';
import { projects } from '../../constants/projectsConst';

const Projects = () => {
    return (
        <section className={`${utilStyles.headingMd} ${styles.section}`}>
            <Wrapper direction="col">
                <h1>Projects</h1>

                <ul className={styles.list}>
                    {projects.map((project) => (
                        <li key={project.slug} className={styles.listItem}>
                            <h2 className={styles.itemTitle}>
                                <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                            </h2>
                            <p>{project.summary}</p>
                            <div className={styles.metaRow}>
                                {project.tags?.map((t) => (
                                    <span key={t} className={styles.tag}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            </Wrapper>
        </section>
    );
};

export default Projects;
