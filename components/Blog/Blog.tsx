import Link from 'next/link';
import styles from './Blog.module.css';
import utilStyles from '../../styles/utils.module.css';
import Date from '../date';
import Wrapper from '../Wrapper';

const Blog = ({ allPostsData }) => {
    return (
        <section className={`${utilStyles.headingMd} ${utilStyles.padding1px} ${styles.section}`}>
            <Wrapper direction="col">
                <h2 className={utilStyles.headingLg}>Blog</h2>
                <ul className={utilStyles.list}>
                    {allPostsData.map(({ id, date, title }) => (
                        <li className={utilStyles.listItem} key={id}>
                            <Link href={`/posts/${id}`}>{title}</Link>
                            <br />
                            <small className={utilStyles.lightText}>
                                <Date dateString={date} />
                            </small>
                        </li>
                    ))}
                </ul>
            </Wrapper>
        </section>
    );
};

export default Blog;
