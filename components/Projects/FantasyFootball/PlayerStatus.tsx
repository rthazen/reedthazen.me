// components/PlayersStatus.tsx
import { useEffect, useState } from 'react';

type Status = { updatedAt: string; count: number; source: string } | null;

export default function PlayersStatus() {
    const [status, setStatus] = useState<Status>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/players');
                const json = await res.json();
                if (mounted) setStatus({ updatedAt: json.updatedAt, count: json.count, source: json.source });
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    if (loading && !status) return <p>Loading players status…</p>;
    if (!status) return <p>Players cache status unavailable.</p>;

    return (
        <div style={{ marginTop: '1rem', fontSize: '.95rem' }}>
            <strong>Players cache:</strong> {status.count} players • Updated {new Date(status.updatedAt).toLocaleString()} • Source: {status.source}
        </div>
    );
}
