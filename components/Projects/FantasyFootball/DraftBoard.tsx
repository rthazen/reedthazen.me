// components/Projects/FantasyFootball/DraftBoard.tsx
import { useEffect, useMemo, useState } from 'react';
import styles from './DraftBoard.module.css';

type RawPlayer = {
    player_id: string | number;
    first_name?: string | null;
    last_name?: string | null;
    team?: string | null;
    position?: string | null;
    fantasy_positions?: string[] | null;
    search_rank?: number | string | null;
    search_full_name?: string | null;
    age?: number | null;
};

type Player = {
    id: string;
    name: string;
    team: string;
    pos: string; // display positions joined (e.g., "RB/WR")
    primary: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
    rank: number; // Sleeper's search_rank (positive only)
    age: number | null;
};

const ALLOWED = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF']);
const MINE_KEY = 'ff.drafted.mine.v1';
const OTHER_KEY = 'ff.drafted.other.v1';

function getPrimary(fantasy_positions?: string[] | null, position?: string | null): 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | '' {
    const arr = (Array.isArray(fantasy_positions) ? fantasy_positions : []).map((s) => String(s).toUpperCase());
    const pick = (...opts: string[]) => arr.find((v) => opts.includes(v));
    const p = pick('QB', 'RB', 'WR', 'TE', 'K', 'DEF') || (position && ALLOWED.has(position.toUpperCase()) ? position.toUpperCase() : '');
    return (p as any) || '';
}

function isInvalidPlaceholder(p: RawPlayer): boolean {
    const fn = (p.first_name ?? '').trim().toLowerCase();
    const ln = (p.last_name ?? '').trim().toLowerCase();
    const sf = (p.search_full_name ?? '').trim().toLowerCase();
    return (fn === 'player' && ln === 'invalid') || `${fn} ${ln}`.trim() === 'player invalid' || sf === 'playerinvalid';
}

// typed storage helpers
function loadSet(key: string): Set<string> {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return new Set<string>();
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set<string>(parsed.map((v) => String(v)));
        return new Set<string>();
    } catch {
        return new Set<string>();
    }
}
function saveSet(key: string, set: Set<string>) {
    try {
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch {}
}
function notifyDraftChange() {
    try {
        window.dispatchEvent(new Event('ff-draft-updated'));
    } catch {}
}

export default function DraftBoard() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [mine, setMine] = useState<Set<string>>(() => new Set());
    const [others, setOthers] = useState<Set<string>>(() => new Set());

    const [query, setQuery] = useState('');
    const [hideDrafted, setHideDrafted] = useState(false);

    // Load drafted sets on mount
    useEffect(() => {
        setMine(loadSet(MINE_KEY));
        setOthers(loadSet(OTHER_KEY));
    }, []);
    // Persist + notify
    useEffect(() => {
        saveSet(MINE_KEY, mine);
        notifyDraftChange();
    }, [mine]);
    useEffect(() => {
        saveSet(OTHER_KEY, others);
        notifyDraftChange();
    }, [others]);

    // Fetch and build list (top 200 by positive search_rank), filtering out IDP and placeholders
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch('/api/players');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();

                const raw = (json?.data ?? {}) as Record<string, RawPlayer>;
                const arr: RawPlayer[] = Object.values(raw);

                const list: Player[] = [];
                for (const p of arr) {
                    if (!p || p.player_id == null) continue;

                    // normalize rank and REQUIRE it to be positive (> 0)
                    const rankNum = typeof p.search_rank === 'number' ? p.search_rank : Number(p.search_rank);
                    if (!Number.isFinite(rankNum) || rankNum <= 0) continue;

                    if (isInvalidPlaceholder(p)) continue;

                    const primary = getPrimary(p.fantasy_positions, p.position);
                    if (!primary || !ALLOWED.has(primary)) continue; // drop IDP

                    const id = String(p.player_id);

                    // Name fallback rules — ensure DEF/K have readable names
                    let first = (p.first_name ?? '').trim();
                    let last = (p.last_name ?? '').trim();
                    let name = `${first} ${last}`.trim();
                    if (!name) {
                        if (primary === 'DEF') name = `${p.team ?? 'Team'} DEF`;
                        else if (primary === 'K') name = `${p.team ?? 'Team'} K`;
                        else name = id;
                    }

                    const joined = Array.isArray(p.fantasy_positions) && p.fantasy_positions.length > 0 ? p.fantasy_positions.join('/') : p.position ?? primary;

                    list.push({
                        id,
                        name,
                        team: p.team ?? '',
                        pos: joined,
                        primary: primary as Player['primary'],
                        rank: rankNum,
                        age: p.age ?? null
                    });
                }

                // Sort by rank ASC (1 is best), then name for tie-breaker
                list.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

                const top200 = list.slice(0, 200);
                if (!cancelled) setPlayers(top200);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Failed to load players');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Stable display numbers (#1..#200) based on the sorted top200 order
    const displayIndex = useMemo(() => {
        const map = new Map<string, number>();
        players.forEach((p, i) => map.set(p.id, i + 1));
        return map;
    }, [players]);

    // Search / filter (doesn't change the display number)
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return players.filter((p) => {
            const isDrafted = mine.has(p.id) || others.has(p.id);
            if (hideDrafted && isDrafted) return false;
            if (!q) return true;
            return p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q);
        });
    }, [players, query, hideDrafted, mine, others]);

    // Cycle: none -> mine -> other -> none
    function cycleDraftState(id: string, preferOther = false) {
        const iMine = mine.has(id);
        const iOther = others.has(id);

        if (preferOther) {
            if (iOther) {
                const next = new Set(others);
                next.delete(id);
                setOthers(next);
            } else {
                const nextO = new Set(others);
                nextO.add(id);
                setOthers(nextO);
                const nextM = new Set(mine);
                nextM.delete(id);
                setMine(nextM);
            }
            return;
        }

        if (!iMine && !iOther) {
            const next = new Set(mine);
            next.add(id);
            setMine(next);
        } else if (iMine) {
            const nextM = new Set(mine);
            nextM.delete(id);
            setMine(nextM);
            const nextO = new Set(others);
            nextO.add(id);
            setOthers(nextO);
        } else if (iOther) {
            const next = new Set(others);
            next.delete(id);
            setOthers(next);
        }
    }

    function onCardClick(e: React.MouseEvent, id: string) {
        const preferOther = e.altKey || e.metaKey || e.ctrlKey;
        cycleDraftState(id, preferOther);
    }

    if (loading) return <div className={styles.loading}>Loading draft board…</div>;
    if (error) return <div className={styles.error}>Error: {String(error)}</div>;

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <input type="text" value={query} placeholder="Search name / team / position" onChange={(e) => setQuery(e.target.value)} className={styles.search} aria-label="Search players" />
                <label className={styles.checkboxRow}>
                    <input type="checkbox" checked={hideDrafted} onChange={(e) => setHideDrafted(e.target.checked)} />
                    Hide drafted
                </label>
                <div className={styles.legend}>
                    <span className={`${styles.legendItem} ${styles.legendMine}`}>Your pick</span>
                    <span className={`${styles.legendItem} ${styles.legendOther}`}>Taken</span>
                </div>
                <div className={styles.count}>
                    Showing {filtered.length} / {players.length}
                </div>
            </div>

            <ol className={styles.grid}>
                {filtered.map((p) => {
                    const isMine = mine.has(p.id);
                    const isOther = others.has(p.id);
                    const num = displayIndex.get(p.id); // stable #1..#200
                    const displayPos = p.primary === 'DEF' ? 'Def' : p.pos;

                    return (
                        <li
                            key={p.id}
                            className={[styles.card, isMine ? styles.mine : '', isOther ? styles.other : ''].join(' ')}
                            onClick={(e) => onCardClick(e, p.id)}
                            role="button"
                            aria-pressed={isMine || isOther}
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    cycleDraftState(p.id, e.altKey);
                                }
                            }}
                            title={
                                isMine
                                    ? 'You drafted this (click to mark as Taken by others)'
                                    : isOther
                                    ? 'Taken by others (click to clear)'
                                    : 'Click to mark as Yours; Alt/Option-click to mark as Taken'
                            }
                        >
                            <div className={styles.rank}>#{num}</div>
                            <div className={styles.name}>{p.name}</div>
                            <div className={styles.meta}>
                                <span className={styles.badge}>{displayPos || '—'}</span>
                                {p.team && <span className={styles.badge}>{p.team}</span>}
                                {p.age != null && <span className={styles.badge}>{p.age}y</span>}
                            </div>
                            {isMine && <div className={styles.flagMine}>Your pick</div>}
                            {isOther && <div className={styles.flagOther}>Taken</div>}
                        </li>
                    );
                })}
            </ol>

            <p className={styles.hint}>
                Tip: <kbd>Click</kbd> to mark <strong>Yours</strong>, <kbd>Alt/Option + Click</kbd> to mark <strong>Taken</strong>, click again to cycle/clear.
            </p>
        </div>
    );
}
