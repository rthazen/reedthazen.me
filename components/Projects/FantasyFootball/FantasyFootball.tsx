// components/projects/FantasyFootball.tsx
import { useEffect, useState } from 'react';
import styles from '../Projects.module.css';
import utilStyles from '../../../styles/utils.module.css';
import Wrapper from '../../Wrapper';
import DraftBoard from './DraftBoard';
import MyRoster from './MyRoster';
import ffLayout from './FantasyFootball.module.css';

type Props = {
    updatedAt: string | null;
    count: number | null;
    data: Record<string, any> | null;
    source: 'memory' | 'disk' | 'remote' | null;
};

const FantasyFootball = ({ updatedAt, count, data, source }: Props) => {
    const [loading, setLoading] = useState(false);
    const [payloadSizeKB, setPayloadSizeKB] = useState<number | null>(null);

    async function measureOnce() {
        try {
            setLoading(true);
            const res = await fetch('/api/players');
            const txt = await res.text();
            setPayloadSizeKB(Math.round((txt.length / 1024) * 10) / 10);
        } catch {
            setPayloadSizeKB(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className={`${utilStyles.headingMd} ${styles.section}`}>
            <div className={ffLayout.twoCol}>
                <DraftBoard />
                <MyRoster />
            </div>
            {/* <Wrapper direction="col">
                <h1>Fantasy Football</h1>
                <MyRoster />
                <DraftBoard />

                {/* <div className={styles.card}>
                    <p>
                        <strong>Players cache:</strong>
                    </p>
                    <ul>
                        <li>Last updated: {updatedAt ?? '—'}</li>
                        <li>Count: {count ?? '—'}</li>
                        <li>Cache source (at build): {source ?? '—'}</li>
                    </ul>
                </div>

                <div className={styles.card}>
                    <p>
                        The full dataset is served from <code>/api/players</code>. You can refresh the server cache by calling <code>/api/players?refresh=1</code>.
                    </p>

                    <button disabled={loading} onClick={measureOnce} style={{ padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                        {loading ? 'Measuring…' : 'Measure payload from /api/players'}
                    </button>
                    {payloadSizeKB !== null && <p style={{ marginTop: 8 }}>~{payloadSizeKB} KB transferred (JSON string length).</p>}
                </div> 
            </Wrapper> */}
        </section>
    );
};

export default FantasyFootball;
