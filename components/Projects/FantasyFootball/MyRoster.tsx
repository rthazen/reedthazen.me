import { useEffect, useMemo, useState } from 'react';
import styles from './MyRoster.module.css';

type RawPlayer = {
    player_id: string | number;
    first_name?: string;
    last_name?: string;
    team?: string | null;
    position?: string | null;
    fantasy_positions?: string[] | null;
    search_rank?: number | string | null;
    age?: number | null;
};

type Player = {
    id: string;
    name: string;
    team: string;
    pos: string; // "RB/WR", "QB", "DEF", etc.
    primary: string; // QB|RB|WR|TE|K|DEF|OTHER
    rank: number; // we’ll push DEF to the end with a big rank
};

const MINE_KEY = 'ff.drafted.mine.v1';
const OTHER_KEY = 'ff.drafted.other.v1';
const TARGETS_KEY = 'ff.roster.targets.v1';

type Targets = {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    K: number;
    DEF: number;
    BENCH: number;
};

const DEFAULT_TARGETS: Targets = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 0, DEF: 1, BENCH: 6 };

// Allowed primaries for mapping
const ALLOWED = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);

function getPrimary(fantasy_positions?: string[] | null, position?: string | null): string {
    const arr = (Array.isArray(fantasy_positions) ? fantasy_positions : []).map(String);
    const pick = (...opts: string[]) => arr.find((v) => opts.includes(v));
    const p = pick('QB', 'RB', 'WR', 'TE', 'K', 'DEF') || (position && ALLOWED.has(position) ? position : undefined);
    return p || 'OTHER';
}

export default function MyRoster() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [mine, setMine] = useState<Set<string>>(new Set());
    const [others, setOthers] = useState<Set<string>>(new Set());
    const [targets, setTargets] = useState<Targets>(DEFAULT_TARGETS);

    // Load targets
    useEffect(() => {
        try {
            const raw = localStorage.getItem(TARGETS_KEY);
            if (raw) setTargets({ ...DEFAULT_TARGETS, ...JSON.parse(raw) });
        } catch {}
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
        } catch {}
    }, [targets]);

    // Load drafted sets
    function loadSets() {
        try {
            setMine(new Set(JSON.parse(localStorage.getItem(MINE_KEY) || '[]')));
            setOthers(new Set(JSON.parse(localStorage.getItem(OTHER_KEY) || '[]')));
        } catch {
            setMine(new Set());
            setOthers(new Set());
        }
    }
    useEffect(() => {
        loadSets();
    }, []);
    useEffect(() => {
        const reload = () => loadSets();
        window.addEventListener('storage', reload);
        window.addEventListener('ff-draft-updated', reload);
        return () => {
            window.removeEventListener('storage', reload);
            window.removeEventListener('ff-draft-updated', reload);
        };
    }, []);

    // Fetch players once; include DEF even if rank missing
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await fetch('/api/players');
            const json = await res.json();
            const raw = json?.data || {};
            const arr: RawPlayer[] = Object.values(raw);

            const all: Player[] = [];
            for (const p of arr) {
                if (!p || p.player_id == null) continue;

                const primary = getPrimary(p.fantasy_positions, p.position);
                if (!ALLOWED.has(primary) && primary !== 'OTHER') continue; // skip IDP

                const id = String(p.player_id);
                const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || (primary === 'DEF' ? `${p.team ?? 'Team'} DEF` : primary === 'K' ? `${p.team ?? 'Team'} K` : id);

                const posJoined = Array.isArray(p.fantasy_positions) && p.fantasy_positions.length > 0 ? p.fantasy_positions.join('/') : p.position ?? primary;

                // normalize rank; make DEF sort after skill players by using a big number
                const rawRank = typeof p.search_rank === 'number' ? p.search_rank : Number(p.search_rank);
                const rank =
                    primary === 'DEF'
                        ? 1_000_000 + name.charCodeAt(0) // push to end, light alpha tie-break
                        : Number.isFinite(rawRank) && rawRank > 0
                        ? rawRank
                        : 999_999;

                all.push({ id, name, team: p.team ?? '', pos: posJoined, primary, rank });
            }

            all.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
            if (!cancelled) setPlayers(all);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Build my roster list
    const myRoster = useMemo(() => players.filter((p) => mine.has(p.id)), [players, mine]);
    const myByPos: Record<string, Player[]> = useMemo(() => {
        const out: Record<string, Player[]> = { QB: [], RB: [], WR: [], TE: [], K: [], DEF: [], OTHER: [] };
        for (const p of myRoster) (out[p.primary] ?? (out[p.primary] = [])).push(p);
        Object.values(out).forEach((list) => list.sort((a, b) => a.rank - b.rank));
        return out;
    }, [myRoster]);

    const counts = {
        QB: myByPos.QB.length,
        RB: myByPos.RB.length,
        WR: myByPos.WR.length,
        TE: myByPos.TE.length,
        K: myByPos.K.length,
        DEF: myByPos.DEF.length
    };

    // Base deficits
    const deficits = {
        QB: Math.max(0, targets.QB - counts.QB),
        RB: Math.max(0, targets.RB - counts.RB),
        WR: Math.max(0, targets.WR - counts.WR),
        TE: Math.max(0, targets.TE - counts.TE),
        K: Math.max(0, targets.K - counts.K),
        DEF: Math.max(0, targets.DEF - counts.DEF)
    };

    // FLEX need: RB/WR/TE extras fill FLEX
    const baseNeeded = targets.RB + targets.WR + targets.TE;
    const baseHave = counts.RB + counts.WR + counts.TE;
    const extras = Math.max(0, baseHave - baseNeeded);
    const flexNeed = Math.max(0, targets.FLEX - extras);

    // Available players (not drafted by anyone)
    const available = useMemo(() => players.filter((p) => !mine.has(p.id) && !others.has(p.id)), [players, mine, others]);

    // Suggest best for each deficit
    const suggest = (pos: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF', limit = 5) => available.filter((p) => p.primary === pos).slice(0, limit);

    function removeFromMine(id: string) {
        const next = new Set(mine);
        next.delete(id);
        setMine(next);
        try {
            localStorage.setItem(MINE_KEY, JSON.stringify(Array.from(next)));
        } catch {}
        window.dispatchEvent(new Event('ff-draft-updated'));
    }

    function onTargetChange(pos: keyof Targets, val: number) {
        const v = Math.max(0, Math.min(20, Math.floor(val || 0)));
        setTargets((t) => ({ ...t, [pos]: v }));
    }

    return (
        <aside className={styles.panel}>
            <h2 className={styles.h2}>My Roster & Needs</h2>

            <div className={styles.targets}>
                <div className={styles.row}>
                    {(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF', 'BENCH'] as (keyof Targets)[]).map((pos) => (
                        <label key={pos} className={styles.tcell}>
                            <span>{pos}</span>
                            <input type="number" min={0} max={20} value={targets[pos]} onChange={(e) => onTargetChange(pos, Number(e.target.value))} />
                        </label>
                    ))}
                </div>
                <p className={styles.note}>FLEX is filled by extra RB/WR/TE beyond their base targets.</p>
            </div>

            <div className={styles.section}>
                <h3>Needs</h3>
                <ul className={styles.needsList}>
                    {Object.entries(deficits).map(([pos, need]) =>
                        need > 0 ? (
                            <li key={pos}>
                                <strong>{pos}</strong>: {need}
                            </li>
                        ) : null
                    )}
                    {flexNeed > 0 && (
                        <li>
                            <strong>FLEX</strong>: {flexNeed}
                        </li>
                    )}
                    {Object.values(deficits).every((n) => n === 0) && flexNeed === 0 && <li>Roster needs met for base + flex.</li>}
                </ul>
            </div>

            <div className={styles.section}>
                <h3>My Picks</h3>
                {myRoster.length === 0 ? (
                    <p className={styles.empty}>No players yet. Click cards to mark yours.</p>
                ) : (
                    <ul className={styles.rosterList}>
                        {(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'OTHER'] as const).map((pos) =>
                            myByPos[pos].length ? (
                                <li key={pos}>
                                    <div className={styles.posHeader}>{pos}</div>
                                    <ol className={styles.posList}>
                                        {myByPos[pos].map((p) => (
                                            <li key={p.id} className={styles.pick}>
                                                <span className={styles.rank}>#{p.rank > 900000 ? '—' : p.rank}</span>
                                                <span className={styles.name}>{p.name}</span>
                                                {p.team && <span className={styles.badge}>{p.team}</span>}
                                                <button className={styles.remove} onClick={() => removeFromMine(p.id)} aria-label={`Remove ${p.name}`}>
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                </li>
                            ) : null
                        )}
                    </ul>
                )}
            </div>

            <div className={styles.section}>
                <h3>Suggestions</h3>
                {(['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] as const).map((pos) =>
                    (deficits as any)[pos] > 0 ? (
                        <div key={pos} className={styles.suggestBlock}>
                            <div className={styles.posHeader}>{pos}</div>
                            <ol className={styles.suggestList}>
                                {suggest(pos).map((p) => (
                                    <li key={p.id}>
                                        <span className={styles.rank}>#{p.rank > 900000 ? '—' : p.rank}</span>
                                        <span className={styles.name}>{p.name}</span>
                                        {p.team && <span className={styles.badge}>{p.team}</span>}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ) : null
                )}
            </div>
        </aside>
    );
}
