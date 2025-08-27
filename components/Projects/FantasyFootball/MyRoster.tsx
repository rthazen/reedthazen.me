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
    primary: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | 'OTHER';
    rank: number; // use large value for DEF to sort after skills
};

const MINE_KEY = 'ff.drafted.mine.v1';
const OTHER_KEY = 'ff.drafted.other.v1';
const MINE_ORDER_KEY = 'ff.drafted.mine.order.v1';
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

const ALLOWED = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);

function getPrimary(fantasy_positions?: string[] | null, position?: string | null): Player['primary'] {
    const arr = (Array.isArray(fantasy_positions) ? fantasy_positions : []).map((s) => String(s).toUpperCase());
    const pick = (...opts: string[]) => arr.find((v) => opts.includes(v));
    const p = pick('QB', 'RB', 'WR', 'TE', 'K', 'DEF') || (position && ALLOWED.has(position.toUpperCase()) ? position.toUpperCase() : '');
    return (p as Player['primary']) || 'OTHER';
}

export default function MyRoster() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [mine, setMine] = useState<Set<string>>(new Set());
    const [others, setOthers] = useState<Set<string>>(new Set());
    const [order, setOrder] = useState<string[]>([]);
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

    // Load drafted sets + order
    const loadSets = () => {
        try {
            setMine(new Set(JSON.parse(localStorage.getItem(MINE_KEY) || '[]')));
            setOthers(new Set(JSON.parse(localStorage.getItem(OTHER_KEY) || '[]')));
            const ord = JSON.parse(localStorage.getItem(MINE_ORDER_KEY) || '[]');
            setOrder(Array.isArray(ord) ? ord.map(String) : []);
        } catch {
            setMine(new Set());
            setOthers(new Set());
            setOrder([]);
        }
    };
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

    // Fetch small pool (skillsTop200 + all DEF)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await fetch('/api/draft-data');
            const json = await res.json();
            const slim = [...(json.skillsTop200 || []), ...(json.defenses || [])];

            // Already shaped; just sort for deterministic order
            slim.sort((a: any, b: any) => a.rank - b.rank || a.name.localeCompare(b.name));

            if (!cancelled) setPlayers(slim);
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Build my roster list in PICK ORDER first (so "first I draft" fills base slots)
    const myRosterOrdered: Player[] = useMemo(() => {
        const mineIds = Array.from(mine);
        // stable-by-order, fallback by rank if something missing
        const indexById = new Map<string, number>();
        order.forEach((id, i) => indexById.set(id, i));
        return players
            .filter((p) => mineIds.includes(p.id))
            .sort((a, b) => {
                const ia = indexById.has(a.id) ? (indexById.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
                const ib = indexById.has(b.id) ? (indexById.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
                if (ia !== ib) return ia - ib;
                return a.rank - b.rank; // fallback
            });
    }, [players, mine, order]);

    // Partition picks: first RB/WR/TE up to targets go to that position; overflow to FLEX
    const grouped = useMemo(() => {
        const base: Record<'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | 'OTHER' | 'FLEX', Player[]> = {
            QB: [],
            RB: [],
            WR: [],
            TE: [],
            K: [],
            DEF: [],
            OTHER: [],
            FLEX: []
        };
        const usedCounts = { RB: 0, WR: 0, TE: 0 };

        for (const p of myRosterOrdered) {
            if (p.primary === 'RB' || p.primary === 'WR' || p.primary === 'TE') {
                const cap = targets[p.primary];
                if (usedCounts[p.primary] < cap) {
                    base[p.primary].push(p);
                    usedCounts[p.primary] += 1;
                } else {
                    base.FLEX.push(p); // overflow counts toward FLEX
                }
            } else {
                base[p.primary].push(p);
            }
        }

        // sort each bucket by pick order (already ordered), but keep consistent UI by rank if same
        Object.values(base).forEach((list) => list.sort((a, b) => a.rank - b.rank));
        return base;
    }, [myRosterOrdered, targets]);

    // Counts for deficits: base positions only consider up to their caps
    const countsBase = {
        QB: grouped.QB.length,
        RB: Math.min(grouped.RB.length, targets.RB),
        WR: Math.min(grouped.WR.length, targets.WR),
        TE: Math.min(grouped.TE.length, targets.TE),
        K: grouped.K.length,
        DEF: grouped.DEF.length
    };

    // How many overflow RB/WR/TE went to FLEX?
    const flexFromOverflow = grouped.FLEX.length;

    // Deficits
    const deficits = {
        QB: Math.max(0, targets.QB - countsBase.QB),
        RB: Math.max(0, targets.RB - countsBase.RB),
        WR: Math.max(0, targets.WR - countsBase.WR),
        TE: Math.max(0, targets.TE - countsBase.TE),
        K: Math.max(0, targets.K - countsBase.K),
        DEF: Math.max(0, targets.DEF - countsBase.DEF)
    };

    // FLEX need = target FLEX minus how many overflow RB/WR/TE you have
    const flexNeed = Math.max(0, targets.FLEX - flexFromOverflow);

    // Available pool (not drafted by anyone)
    const available = useMemo(() => players.filter((p) => !mine.has(p.id) && !others.has(p.id)), [players, mine, others]);

    // Suggestions
    const suggest = (pos: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF', limit = 5) => available.filter((p) => p.primary === pos).slice(0, limit);

    const suggestFlex = (limit = 7) => available.filter((p) => p.primary === 'RB' || p.primary === 'WR' || p.primary === 'TE').slice(0, limit);

    function removeFromMine(id: string) {
        const next = new Set(mine);
        next.delete(id);
        setMine(next);
        try {
            localStorage.setItem(MINE_KEY, JSON.stringify(Array.from(next)));
            // also remove from order
            const ord = JSON.parse(localStorage.getItem(MINE_ORDER_KEY) || '[]');
            const newOrd = Array.isArray(ord) ? ord.filter((x: any) => String(x) !== id) : [];
            localStorage.setItem(MINE_ORDER_KEY, JSON.stringify(newOrd));
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
                <p className={styles.note}>FLEX fills with extra RB/WR/TE you pick beyond their base targets.</p>
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
                {myRosterOrdered.length === 0 ? (
                    <p className={styles.empty}>No players yet. Click cards to mark yours.</p>
                ) : (
                    <ul className={styles.rosterList}>
                        {(['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF', 'OTHER'] as const).map((pos) =>
                            grouped[pos].length ? (
                                <li key={pos}>
                                    <div className={styles.posHeader}>{pos}</div>
                                    <ol className={styles.posList}>
                                        {grouped[pos].map((p) => (
                                            <li key={p.id} className={styles.pick}>
                                                <span className={styles.rank}>{p.primary === 'DEF' || p.rank > 900000 ? '—' : `#${p.rank}`}</span>
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
                                        <span className={styles.rank}>{p.primary === 'DEF' || p.rank > 900000 ? '—' : `#${p.rank}`}</span>
                                        <span className={styles.name}>{p.name}</span>
                                        {p.team && <span className={styles.badge}>{p.team}</span>}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ) : null
                )}

                {flexNeed > 0 && (
                    <div className={styles.suggestBlock}>
                        <div className={styles.posHeader}>FLEX</div>
                        <ol className={styles.suggestList}>
                            {suggestFlex().map((p) => (
                                <li key={p.id}>
                                    <span className={styles.rank}>{p.rank > 900000 ? '—' : `#${p.rank}`}</span>
                                    <span className={styles.name}>{p.name}</span>
                                    {p.team && <span className={styles.badge}>{p.team}</span>}
                                    <span className={styles.badge}>{p.primary}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </aside>
    );
}
