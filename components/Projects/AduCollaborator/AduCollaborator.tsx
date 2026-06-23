import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    LinearProgress,
    Button,
    Chip,
    Typography,
    Box,
    Stack,
    Snackbar,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    Divider,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { formatDistanceToNow } from 'date-fns';
import useSWR from 'swr';
import {
    ChecklistSection,
    ChecklistItem,
    ItemType,
    defaultStructure,
    buildStructureFromLegacy
} from '../../../constants/aduChecklist';
import { projects } from '../../../constants/projectsConst';
import styles from './AduCollaborator.module.css';

const CACHE_KEY = 'adu-selections-cache-v2';
const IDENTITY_KEY = 'adu-identity';
const PASSWORD_KEY = 'adu-edit-password';
const API = '/api/adu';
const POLL_MS = 25000;
const SAVE_DEBOUNCE_MS = 800;
const DUE_SUFFIX = '::due';
const EPOCH = new Date(0).toISOString();
const TITLE = projects.find((p) => p.slug === 'adu-collaborator')?.title ?? 'ADU Client Selections';

const C = {
    bg: '#3b3b3b',
    card: '#2e2e2e',
    cardBorder: '#444',
    aqua: '#00ffff',
    sand: '#f4f1c9',
    muted: '#9ca3af',
    subLabel: '#00dbff',
    danger: '#f87171'
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type BlameEntry = { value: string; editedBy: string; editedAt: string };
type OptionDef = { id: string; label: string; addedBy: string; addedAt: string };
type Doc = {
    structure: ChecklistSection[];
    structureUpdatedAt: string;
    entries: Record<string, BlameEntry>;
    options: Record<string, OptionDef[]>;
    deleted: string[];
};
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

const now = () => new Date().toISOString();
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function makeInitial(): Doc {
    return { structure: defaultStructure(), structureUpdatedAt: EPOCH, entries: {}, options: {}, deleted: [] };
}

// Accept the current shape or migrate an older doc (which had customItems /
// removedItems but no editable structure).
function normalizeDoc(raw: any): Doc {
    const structure: ChecklistSection[] = Array.isArray(raw?.structure)
        ? raw.structure
        : buildStructureFromLegacy(raw?.customItems, raw?.removedItems);
    return {
        structure,
        structureUpdatedAt: raw?.structureUpdatedAt ?? EPOCH,
        entries: raw?.entries ?? {},
        options: raw?.options ?? {},
        deleted: raw?.deleted ?? []
    };
}

// Remove selection/due/option data for a set of item ids (used on delete).
function pruneData(doc: Doc, removeIds: Set<string>): Pick<Doc, 'entries' | 'options'> {
    const entries: Record<string, BlameEntry> = {};
    for (const [k, v] of Object.entries(doc.entries)) {
        const base = k.endsWith(DUE_SUFFIX) ? k.slice(0, -DUE_SUFFIX.length) : k;
        if (!removeIds.has(base)) entries[k] = v;
    }
    const options: Record<string, OptionDef[]> = {};
    for (const [k, v] of Object.entries(doc.options)) if (!removeIds.has(k)) options[k] = v;
    return { entries, options };
}

function cloneSectionWithNewIds(section: ChecklistSection): ChecklistSection {
    return {
        id: genId('section'),
        title: `${section.title || 'Group'} (copy)`,
        note: section.note,
        subsections: section.subsections.map((ss) => ({
            id: genId('group'),
            title: ss.title,
            items: ss.items.map((it) => ({ id: genId('item'), label: it.label, note: it.note, type: it.type }))
        }))
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true });
    } catch {
        return '';
    }
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const sxTextField = {
    '& .MuiInputBase-input': { color: C.sand, fontSize: '0.875rem' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
    '& .MuiInputBase-input::placeholder': { color: C.muted, opacity: 1 }
};

// Borderless-until-hover field used for filled item names / option labels.
const sxLabelField = {
    '& .MuiInputBase-input': { color: C.sand, fontSize: '0.875rem', fontWeight: 500 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiInputBase-input::placeholder': { color: '#666', opacity: 1 },
    '& .MuiInputBase-root': { px: 0.5 }
};

// Empty item-name field: clearly an input awaiting a name (dashed aqua border).
const sxLabelFieldEmpty = {
    '& .MuiInputBase-input': { color: C.sand, fontSize: '0.875rem', fontWeight: 500 },
    '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,255,255,0.05)', borderRadius: 1 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua, borderStyle: 'dashed' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua, borderStyle: 'solid' },
    '& .MuiInputBase-input::placeholder': { color: C.aqua, opacity: 0.85 }
};

const sxNoteField = {
    '& .MuiInputBase-input': { color: C.muted, fontSize: '0.73rem', fontStyle: 'italic' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiInputBase-input::placeholder': { color: '#666', opacity: 1 },
    '& .MuiInputBase-root': { px: 0.5 }
};

const sxGroupTitle = {
    '& .MuiInputBase-input': { color: C.subLabel, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', py: 0.25 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
    '& .MuiInputBase-input::placeholder': { color: C.muted, opacity: 1 }
};

// ─── Small presentational pieces ──────────────────────────────────────────────

function BlameChip({ entry }: { entry: BlameEntry | undefined }) {
    if (!entry || !entry.value.trim()) return null;
    return (
        <Typography sx={{ color: '#6b7280', fontSize: '0.68rem', mt: 0.4, lineHeight: 1.2 }}>
            {entry.editedBy} &middot; {relativeTime(entry.editedAt)}
        </Typography>
    );
}

function YesNoToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <ToggleButtonGroup value={value} exclusive onChange={(_, v) => v !== null && onChange(v)} size="small" sx={{ flexShrink: 0 }}>
            {['Yes', 'No', 'TBD'].map((opt) => (
                <ToggleButton
                    key={opt}
                    value={opt}
                    sx={{
                        color: C.muted,
                        borderColor: '#555',
                        fontSize: '0.75rem',
                        px: 1.5,
                        py: 0.5,
                        '&.Mui-selected': { color: C.card, bgcolor: C.aqua, borderColor: C.aqua, '&:hover': { bgcolor: C.aqua } }
                    }}
                >
                    {opt}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
    const map: Record<SaveStatus, { icon: JSX.Element; text: string; color: string }> = {
        idle: { icon: <CloudDoneIcon sx={{ fontSize: 16 }} />, text: 'Synced', color: C.muted },
        saving: { icon: <SyncIcon sx={{ fontSize: 16 }} className={styles.spin} />, text: 'Saving…', color: C.aqua },
        saved: { icon: <CloudDoneIcon sx={{ fontSize: 16 }} />, text: 'Saved', color: C.aqua },
        error: { icon: <CloudOffIcon sx={{ fontSize: 16 }} />, text: 'Save failed', color: C.danger },
        offline: { icon: <CloudOffIcon sx={{ fontSize: 16 }} />, text: 'Offline', color: C.danger }
    };
    const { icon, text, color } = map[status];
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color }}>
            {icon}
            <Typography sx={{ fontSize: '0.75rem', color }}>{text}</Typography>
        </Box>
    );
}

// ─── Link previews ────────────────────────────────────────────────────────────

type LinkPreviewData = { url: string; image?: string; title?: string; description?: string; siteName?: string; error?: string };

const URL_RE = /https?:\/\/[^\s)]+/gi;
const fetcher = (u: string) => fetch(u).then((r) => r.json());

function useDebounced<T>(value: T, ms: number): T {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

function extractUrls(text: string): string[] {
    const matches = text.match(URL_RE) ?? [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (let m of matches) {
        m = m.replace(/[.,;]+$/, '');
        if (!seen.has(m)) {
            seen.add(m);
            out.push(m);
        }
    }
    return out;
}

function LinkPreview({ url }: { url: string }) {
    const { data, isValidating } = useSWR<LinkPreviewData>(`/api/link-preview?url=${encodeURIComponent(url)}`, fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 1000 * 60 * 60
    });

    const host = (() => {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return url;
        }
    })();

    const loading = !data && isValidating;
    const title = data?.title || host;
    const subtitle = data?.siteName || host;

    return (
        <Box
            component="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={url}
            sx={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 1.25,
                mt: 1,
                border: '1px solid #444',
                borderRadius: 1.5,
                overflow: 'hidden',
                textDecoration: 'none',
                cursor: 'pointer',
                bgcolor: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                '&:hover': { borderColor: C.aqua, bgcolor: 'rgba(0,255,255,0.04)' }
            }}
        >
            {data?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={data.image}
                    alt=""
                    loading="lazy"
                    style={{ width: 64, minWidth: 64, height: 64, objectFit: 'cover', background: '#1f1f1f' }}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                />
            )}
            <Box sx={{ flex: 1, minWidth: 0, py: 0.75, px: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography
                    sx={{ color: C.aqua, fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textDecoration: 'underline', textUnderlineOffset: 2 }}
                >
                    {loading ? 'Loading preview…' : title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <OpenInNewIcon sx={{ fontSize: 12, color: C.muted }} />
                    <Typography sx={{ color: C.muted, fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Open {subtitle} in new tab
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

function LinkPreviews({ text }: { text: string }) {
    const debounced = useDebounced(text, 600);
    const urls = extractUrls(debounced);
    if (urls.length === 0) return null;
    return (
        <Box>
            {urls.map((u) => (
                <LinkPreview key={u} url={u} />
            ))}
        </Box>
    );
}

// ─── Item row ─────────────────────────────────────────────────────────────────

type ItemRowProps = {
    item: ChecklistItem;
    valueEntry: BlameEntry | undefined;
    dueEntry: BlameEntry | undefined;
    options: OptionDef[];
    onSetLabel: (label: string) => void;
    onSetNote: (note: string | undefined) => void;
    onSetValue: (value: string) => void;
    onSetDue: (value: string) => void;
    onAddOption: () => void;
    onUpdateOption: (optionId: string, label: string) => void;
    onRemoveOption: (optionId: string) => void;
    onChooseOption: (label: string) => void;
    onDelete: () => void;
};

function ItemRow({
    item,
    valueEntry,
    dueEntry,
    options,
    onSetLabel,
    onSetNote,
    onSetValue,
    onSetDue,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
    onChooseOption,
    onDelete
}: ItemRowProps) {
    const value = valueEntry?.value ?? '';
    const nameEmpty = !item.label.trim();

    return (
        <Box className={styles.itemRow} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {/* Item name + note (editable) */}
            <Box sx={{ flex: '0 0 230px', minWidth: 160 }}>
                <TextField
                    value={item.label}
                    onChange={(e) => onSetLabel(e.target.value)}
                    placeholder="Name this item"
                    size="small"
                    fullWidth
                    multiline
                    maxRows={3}
                    sx={nameEmpty ? sxLabelFieldEmpty : sxLabelField}
                />
                {item.note !== undefined ? (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.25, mt: 0.25 }}>
                        <TextField
                            value={item.note}
                            onChange={(e) => onSetNote(e.target.value)}
                            placeholder="Add a note…"
                            size="small"
                            fullWidth
                            multiline
                            maxRows={4}
                            sx={sxNoteField}
                        />
                        <Tooltip title="Remove note" placement="top">
                            <IconButton size="small" onClick={() => onSetNote(undefined)} sx={{ p: 0.25, mt: 0.25, color: '#555', '&:hover': { color: C.danger } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ) : (
                    <Button
                        size="small"
                        onClick={() => onSetNote('')}
                        disableRipple
                        sx={{ color: '#6b7280', fontSize: '0.68rem', textTransform: 'none', px: 0.5, minWidth: 0, mt: 0.25, '&:hover': { color: C.aqua, bgcolor: 'transparent' } }}
                    >
                        + note
                    </Button>
                )}
            </Box>

            {/* Selection · options · due */}
            <Box sx={{ flex: 1, minWidth: 200 }}>
                {item.type === 'yes_no' ? (
                    <YesNoToggle value={value} onChange={onSetValue} />
                ) : (
                    <TextField value={value} onChange={(e) => onSetValue(e.target.value)} placeholder="Your selection..." size="small" multiline maxRows={3} fullWidth sx={sxTextField} />
                )}
                <BlameChip entry={valueEntry} />
                {item.type !== 'yes_no' && <LinkPreviews text={value} />}

                {options.length > 0 && (
                    <Box sx={{ mt: 1.25 }}>
                        <Typography sx={{ color: C.muted, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>Options</Typography>
                        <Stack spacing={0.75}>
                            {options.map((o) => {
                                const chosen = !!o.label.trim() && value === o.label;
                                return (
                                    <Box key={o.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                                        <Tooltip title={chosen ? 'Selected' : 'Choose this option'} placement="top">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => o.label.trim() && onChooseOption(o.label)}
                                                    disabled={!o.label.trim()}
                                                    sx={{ p: 0.5, mt: 0.25, color: chosen ? C.aqua : '#666', '&:hover': { color: C.aqua } }}
                                                >
                                                    {chosen ? <RadioButtonCheckedIcon sx={{ fontSize: 18 }} /> : <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField value={o.label} onChange={(e) => onUpdateOption(o.id, e.target.value)} placeholder="Option…" size="small" fullWidth sx={sxLabelField} />
                                            <Typography sx={{ color: '#6b7280', fontSize: '0.66rem', mt: 0.2, lineHeight: 1.2 }}>
                                                added by {o.addedBy} &middot; {relativeTime(o.addedAt)}
                                            </Typography>
                                            <LinkPreviews text={o.label} />
                                        </Box>
                                        <Tooltip title="Remove option" placement="top">
                                            <IconButton size="small" onClick={() => onRemoveOption(o.id)} sx={{ p: 0.5, mt: 0.25, color: '#555', '&:hover': { color: C.danger } }}>
                                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                <Button
                    size="small"
                    startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                    onClick={onAddOption}
                    disableRipple
                    sx={{ color: C.muted, fontSize: '0.72rem', textTransform: 'none', px: 0, minWidth: 0, mt: 0.75, '&:hover': { color: C.aqua, bgcolor: 'transparent' } }}
                >
                    Add option
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <EventOutlinedIcon sx={{ fontSize: 16, color: C.muted }} />
                    <Typography sx={{ color: C.muted, fontSize: '0.72rem' }}>Due</Typography>
                    <TextField
                        value={dueEntry?.value ?? ''}
                        onChange={(e) => onSetDue(e.target.value)}
                        placeholder="e.g. Jul 15 or 2026-07-15"
                        size="small"
                        sx={{ ...sxTextField, width: 200, '& .MuiInputBase-input': { ...sxTextField['& .MuiInputBase-input'], fontSize: '0.8rem', py: 0.5 } }}
                    />
                    {(dueEntry?.value ?? '').trim() && (
                        <Typography sx={{ color: '#6b7280', fontSize: '0.66rem' }}>
                            {dueEntry!.editedBy} &middot; {relativeTime(dueEntry!.editedAt)}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Tooltip title="Delete this item" placement="top">
                <IconButton className={styles.removeBtn} size="small" onClick={onDelete} sx={{ color: '#555', flexShrink: 0, mt: 0.25, '&:hover': { color: C.danger } }}>
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AduCollaborator() {
    const [state, setState] = useState<Doc>(makeInitial);
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [snackbar, setSnackbar] = useState('');
    const [pwDialogOpen, setPwDialogOpen] = useState(false);
    const [pwInput, setPwInput] = useState('');
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [dragId, setDragId] = useState<string | null>(null); // group being dragged
    const [overId, setOverId] = useState<string | null>(null); // drop target group
    const [overAfter, setOverAfter] = useState(false); // drop below (vs above) the target
    const [armed, setArmed] = useState<string | null>(null); // group whose drag handle is held

    const dirtyRef = useRef(false);
    const stateRef = useRef(state);
    const passwordRef = useRef(password);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSave = useRef(false);
    // Bumped on every local edit. A GET (initial load / poll) snapshots this
    // before fetching and discards its response if the counter advanced while
    // the request was in flight — otherwise a slow GET that started before an
    // edit (and resolves after that edit has already saved + cleared the dirty
    // flags) would clobber the just-saved change.
    const editEpoch = useRef(0);

    stateRef.current = state;
    passwordRef.current = password;

    const who = useCallback(() => identity.trim() || 'Anonymous', [identity]);

    // ── Initial load ──
    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) setState(normalizeDoc(JSON.parse(cached)));
            const id = localStorage.getItem(IDENTITY_KEY);
            if (id) setIdentity(id);
            const pw = sessionStorage.getItem(PASSWORD_KEY);
            if (pw) setPassword(pw);
        } catch {}

        const epochAtFetch = editEpoch.current;
        fetch(API)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((doc) => {
                // Don't clobber an edit the user made while this load was in flight.
                if (editEpoch.current !== epochAtFetch) return;
                setState(normalizeDoc(doc));
                setSaveStatus('idle');
            })
            .catch(() => setSaveStatus('offline'))
            .finally(() => setLoaded(true));
    }, []);

    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem(IDENTITY_KEY, identity);
        } catch {}
    }, [identity, loaded]);

    useEffect(() => {
        try {
            sessionStorage.setItem(PASSWORD_KEY, password);
        } catch {}
    }, [password]);

    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(state));
        } catch {}
    }, [state, loaded]);

    // ── Server save ──
    const doSave = useCallback(async () => {
        const pw = passwordRef.current;
        if (!pw) {
            setPwDialogOpen(true);
            return;
        }
        pendingSave.current = false;
        setSaveStatus('saving');
        try {
            const res = await fetch(API, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'x-adu-edit-password': pw },
                body: JSON.stringify(stateRef.current)
            });
            if (res.status === 401) {
                setPassword('');
                try {
                    sessionStorage.removeItem(PASSWORD_KEY);
                } catch {}
                setSaveStatus('error');
                setSnackbar('Incorrect edit password — re-enter it to save.');
                setPwDialogOpen(true);
                return;
            }
            if (res.status === 503) {
                setSaveStatus('error');
                setSnackbar('Editing is not configured on the server yet (ADU_EDIT_PASSWORD).');
                return;
            }
            if (!res.ok) throw new Error(String(res.status));
            dirtyRef.current = false;
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
            setSnackbar('Could not save — your changes are cached locally and will retry.');
        }
    }, []);

    const scheduleSave = useCallback(() => {
        dirtyRef.current = true;
        pendingSave.current = true;
        editEpoch.current += 1;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doSave(), SAVE_DEBOUNCE_MS);
    }, [doSave]);

    // ── Background poll ──
    useEffect(() => {
        const iv = setInterval(() => {
            if (dirtyRef.current || pendingSave.current) return;
            const epochAtFetch = editEpoch.current;
            fetch(API)
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((doc) => {
                    // Drop the response if any edit happened while it was in flight —
                    // it predates that edit and would wipe the just-saved change.
                    if (dirtyRef.current || pendingSave.current || editEpoch.current !== epochAtFetch) return;
                    setState(normalizeDoc(doc));
                    if (saveStatus === 'offline') setSaveStatus('idle');
                })
                .catch(() => {});
        }, POLL_MS);
        return () => clearInterval(iv);
    }, [saveStatus]);

    // ── Selection data mutations (do NOT bump structureUpdatedAt) ──
    const setEntry = useCallback(
        (id: string, value: string) => {
            setState((prev) => ({ ...prev, entries: { ...prev.entries, [id]: { value, editedBy: who(), editedAt: now() } } }));
            scheduleSave();
        },
        [who, scheduleSave]
    );

    const setDueDate = useCallback((itemId: string, value: string) => setEntry(itemId + DUE_SUFFIX, value), [setEntry]);

    const addOption = useCallback(
        (itemId: string) => {
            const opt: OptionDef = { id: genId('opt'), label: '', addedBy: who(), addedAt: now() };
            setState((prev) => ({ ...prev, options: { ...prev.options, [itemId]: [...(prev.options[itemId] ?? []), opt] } }));
            scheduleSave();
        },
        [who, scheduleSave]
    );

    const updateOption = useCallback(
        (itemId: string, optionId: string, label: string) => {
            setState((prev) => {
                const opts = prev.options[itemId] ?? [];
                const old = opts.find((o) => o.id === optionId)?.label ?? '';
                const nextOpts = opts.map((o) => (o.id === optionId ? { ...o, label, addedBy: who(), addedAt: now() } : o));
                let entries = prev.entries;
                if (old && prev.entries[itemId]?.value === old) {
                    entries = { ...entries, [itemId]: { value: label, editedBy: who(), editedAt: now() } };
                }
                return { ...prev, options: { ...prev.options, [itemId]: nextOpts }, entries };
            });
            scheduleSave();
        },
        [who, scheduleSave]
    );

    const removeOption = useCallback(
        (itemId: string, optionId: string) => {
            setState((prev) => ({
                ...prev,
                options: { ...prev.options, [itemId]: (prev.options[itemId] ?? []).filter((o) => o.id !== optionId) },
                deleted: prev.deleted.includes(optionId) ? prev.deleted : [...prev.deleted, optionId]
            }));
            scheduleSave();
        },
        [scheduleSave]
    );

    // ── Structure mutations (bump structureUpdatedAt) ──
    const mutateStructure = useCallback(
        (producer: (s: ChecklistSection[]) => ChecklistSection[]) => {
            setState((prev) => ({ ...prev, structure: producer(prev.structure), structureUpdatedAt: now() }));
            scheduleSave();
        },
        [scheduleSave]
    );

    const updateItem = useCallback(
        (sectionId: string, subId: string, itemId: string, patch: Partial<ChecklistItem>) => {
            mutateStructure((s) =>
                s.map((sec) =>
                    sec.id !== sectionId
                        ? sec
                        : {
                              ...sec,
                              subsections: sec.subsections.map((ss) =>
                                  ss.id !== subId ? ss : { ...ss, items: ss.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
                              )
                          }
                )
            );
        },
        [mutateStructure]
    );

    const addItem = useCallback(
        (sectionId: string, subId: string) => {
            const item: ChecklistItem = { id: genId('item'), label: '' };
            mutateStructure((s) =>
                s.map((sec) =>
                    sec.id !== sectionId ? sec : { ...sec, subsections: sec.subsections.map((ss) => (ss.id !== subId ? ss : { ...ss, items: [...ss.items, item] })) }
                )
            );
        },
        [mutateStructure]
    );

    const deleteItem = useCallback(
        (sectionId: string, subId: string, item: ChecklistItem) => {
            if ((stateRef.current.entries[item.id]?.value ?? '').trim()) {
                if (!window.confirm(`Delete "${item.label || 'this item'}" and its selection?`)) return;
            }
            setState((prev) => {
                const structure = prev.structure.map((sec) =>
                    sec.id !== sectionId ? sec : { ...sec, subsections: sec.subsections.map((ss) => (ss.id !== subId ? ss : { ...ss, items: ss.items.filter((it) => it.id !== item.id) })) }
                );
                return { ...prev, structure, ...pruneData(prev, new Set([item.id])), structureUpdatedAt: now() };
            });
            scheduleSave();
        },
        [scheduleSave]
    );

    const addSubsection = useCallback(
        (sectionId: string) => {
            mutateStructure((s) => s.map((sec) => (sec.id !== sectionId ? sec : { ...sec, subsections: [...sec.subsections, { id: genId('group'), title: '', items: [] }] })));
        },
        [mutateStructure]
    );

    const updateSubsectionTitle = useCallback(
        (sectionId: string, subId: string, title: string) => {
            mutateStructure((s) => s.map((sec) => (sec.id !== sectionId ? sec : { ...sec, subsections: sec.subsections.map((ss) => (ss.id === subId ? { ...ss, title } : ss)) })));
        },
        [mutateStructure]
    );

    const deleteSubsection = useCallback(
        (sectionId: string, subId: string) => {
            const sec = stateRef.current.structure.find((s) => s.id === sectionId);
            const sub = sec?.subsections.find((x) => x.id === subId);
            if ((sub?.items.length ?? 0) > 0 && !window.confirm(`Delete the "${sub?.title || 'untitled'}" group and its ${sub?.items.length} item(s)?`)) return;
            const ids = new Set((sub?.items ?? []).map((it) => it.id));
            setState((prev) => {
                const structure = prev.structure.map((s) => (s.id !== sectionId ? s : { ...s, subsections: s.subsections.filter((x) => x.id !== subId) }));
                return { ...prev, structure, ...pruneData(prev, ids), structureUpdatedAt: now() };
            });
            scheduleSave();
        },
        [scheduleSave]
    );

    const updateSection = useCallback(
        (sectionId: string, patch: Partial<ChecklistSection>) => {
            mutateStructure((s) => s.map((sec) => (sec.id === sectionId ? { ...sec, ...patch } : sec)));
        },
        [mutateStructure]
    );

    const addSection = useCallback(() => {
        mutateStructure((s) => [...s, { id: genId('section'), title: '', subsections: [{ id: genId('group'), title: '', items: [] }] }]);
        setSnackbar('Added a new group at the bottom — give it a name.');
    }, [mutateStructure]);

    const duplicateSection = useCallback(
        (sectionId: string) => {
            mutateStructure((s) => {
                const idx = s.findIndex((x) => x.id === sectionId);
                if (idx < 0) return s;
                const copy = [...s];
                copy.splice(idx + 1, 0, cloneSectionWithNewIds(s[idx]));
                return copy;
            });
            setSnackbar('Duplicated the group (item names copied; selections start fresh).');
        },
        [mutateStructure]
    );

    const deleteSection = useCallback(
        (sectionId: string) => {
            const sec = stateRef.current.structure.find((s) => s.id === sectionId);
            const itemCount = sec?.subsections.reduce((n, ss) => n + ss.items.length, 0) ?? 0;
            if (!window.confirm(`Delete the entire "${sec?.title || 'untitled'}" group and its ${itemCount} item(s)?`)) return;
            const ids = new Set((sec?.subsections ?? []).flatMap((ss) => ss.items.map((it) => it.id)));
            setState((prev) => {
                const structure = prev.structure.filter((s) => s.id !== sectionId);
                return { ...prev, structure, ...pruneData(prev, ids), structureUpdatedAt: now() };
            });
            scheduleSave();
        },
        [scheduleSave]
    );

    // Reorder a group: drop `sourceId` before or after `targetId`.
    const moveSection = useCallback(
        (sourceId: string, targetId: string, place: 'before' | 'after') => {
            if (sourceId === targetId) return;
            mutateStructure((s) => {
                const without = s.filter((sec) => sec.id !== sourceId);
                const moved = s.find((sec) => sec.id === sourceId);
                let idx = without.findIndex((sec) => sec.id === targetId);
                if (!moved || idx < 0) return s;
                if (place === 'after') idx += 1;
                const next = [...without];
                next.splice(idx, 0, moved);
                return next;
            });
        },
        [mutateStructure]
    );

    // Move a group up (-1) or down (+1) — touch-friendly reordering for mobile.
    const moveSectionBy = useCallback(
        (sectionId: string, delta: number) => {
            mutateStructure((s) => {
                const idx = s.findIndex((sec) => sec.id === sectionId);
                const j = idx + delta;
                if (idx < 0 || j < 0 || j >= s.length) return s;
                const next = [...s];
                const [moved] = next.splice(idx, 1);
                next.splice(j, 0, moved);
                return next;
            });
        },
        [mutateStructure]
    );

    // The drag handle "arms" a group as draggable on mouse-down; disarm on release
    // so item fields inside a group stay normally selectable/editable.
    useEffect(() => {
        if (!armed) return;
        const clear = () => setArmed(null);
        window.addEventListener('mouseup', clear);
        window.addEventListener('dragend', clear);
        return () => {
            window.removeEventListener('mouseup', clear);
            window.removeEventListener('dragend', clear);
        };
    }, [armed]);

    // ── Password dialog ──
    const submitPassword = () => {
        const pw = pwInput.trim();
        if (!pw) return;
        setPassword(pw);
        setPwInput('');
        setPwDialogOpen(false);
        setTimeout(() => doSave(), 0);
    };

    // ── Manual refresh ──
    const refresh = async () => {
        if (dirtyRef.current || pendingSave.current) {
            if (saveTimer.current) clearTimeout(saveTimer.current);
            await doSave();
        }
        try {
            const r = await fetch(API);
            if (!r.ok) throw new Error();
            const doc = await r.json();
            setState(normalizeDoc(doc));
            dirtyRef.current = false;
            setSaveStatus('idle');
            setSnackbar('Refreshed with the latest saved version.');
        } catch {
            setSnackbar('Could not refresh from the server.');
        }
    };

    // ── Progress (items count once they have a name or a value) ──
    const counts = (it: ChecklistItem) => !!(it.label.trim() || (state.entries[it.id]?.value ?? '').trim());
    const allItems = state.structure.flatMap((s) => s.subsections.flatMap((ss) => ss.items)).filter(counts);
    const totalItems = allItems.length;
    const filledItems = allItems.filter((it) => (state.entries[it.id]?.value ?? '').trim()).length;
    const progress = totalItems > 0 ? (filledItems / totalItems) * 100 : 0;

    const copyLink = async () => {
        const url = `${window.location.origin}${window.location.pathname}`;
        try {
            await navigator.clipboard.writeText(url);
            setSnackbar('Page link copied — everyone shares the same saved checklist.');
        } catch {
            setSnackbar('Could not copy automatically — try copying the URL bar.');
        }
    };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adu-selections-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setSnackbar('Downloaded a JSON backup of the current checklist.');
    };

    const btnGhost = { color: C.sand, borderColor: '#555', '&:hover': { borderColor: C.sand, bgcolor: 'rgba(244,241,201,0.06)' } };

    // ── Render ──
    return (
        <Box className={styles.root}>
            <Box className={styles.header}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                    <Box>
                        <Typography variant="h4" sx={{ color: C.aqua, fontWeight: 700, mb: 0.5 }}>
                            {TITLE}
                        </Typography>
                        <Typography sx={{ color: C.muted, fontSize: '0.9rem' }}>Los Angeles ADU Project &mdash; a shared, auto-saving checklist for you and your PM.</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <Typography sx={{ color: C.muted, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>Editing as</Typography>
                        <TextField
                            value={identity}
                            onChange={(e) => setIdentity(e.target.value)}
                            placeholder="Your name"
                            size="small"
                            sx={{
                                width: 140,
                                '& .MuiInputBase-input': { color: C.sand, fontSize: '0.8rem', py: 0.75 },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
                                '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
                                '& .MuiInputBase-input::placeholder': { color: '#666', opacity: 1 }
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ mt: 2.5, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography sx={{ color: C.sand, fontSize: '0.82rem' }}>Progress</Typography>
                        <Typography sx={{ color: C.aqua, fontSize: '0.82rem', fontWeight: 700 }}>
                            {filledItems} / {totalItems} items
                        </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 7, borderRadius: 4, bgcolor: '#4a4a4a', '& .MuiLinearProgress-bar': { bgcolor: C.aqua, borderRadius: 4 } }} />
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                    <Button variant="outlined" size="small" startIcon={<ContentCopyIcon />} onClick={copyLink} sx={{ color: C.aqua, borderColor: C.aqua, '&:hover': { borderColor: C.aqua, bgcolor: 'rgba(0,255,255,0.08)' } }}>
                        Copy Page Link
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={refresh} sx={btnGhost}>
                        Refresh
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()} sx={btnGhost}>
                        Print
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<FileDownloadOutlinedIcon />} onClick={exportJson} sx={btnGhost}>
                        Backup
                    </Button>
                    <Box sx={{ ml: 'auto' }}>
                        <SaveIndicator status={saveStatus} />
                    </Box>
                </Box>
            </Box>

            <Box className={styles.sections}>
                {state.structure.map((section, sectionIdx) => {
                    const sectionItems = section.subsections.flatMap((ss) => ss.items).filter(counts);
                    const sectionFilled = sectionItems.filter((it) => (state.entries[it.id]?.value ?? '').trim()).length;
                    const sectionTotal = sectionItems.length;
                    const sectionComplete = sectionTotal > 0 && sectionFilled === sectionTotal;

                    return (
                        <Box
                            key={section.id}
                            draggable={armed === section.id}
                            onDragStart={(e) => {
                                setDragId(section.id);
                                e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                                setDragId(null);
                                setOverId(null);
                                setArmed(null);
                            }}
                            onDragOver={(e) => {
                                if (dragId && dragId !== section.id) {
                                    e.preventDefault();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const after = e.clientY > rect.top + rect.height / 2;
                                    if (overId !== section.id || overAfter !== after) {
                                        setOverId(section.id);
                                        setOverAfter(after);
                                    }
                                }
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (dragId) moveSection(dragId, section.id, overAfter ? 'after' : 'before');
                                setDragId(null);
                                setOverId(null);
                                setArmed(null);
                            }}
                            sx={{
                                opacity: dragId === section.id ? 0.4 : 1,
                                borderTop: overId === section.id && dragId !== section.id && !overAfter ? `2px solid ${C.aqua}` : '2px solid transparent',
                                borderBottom: overId === section.id && dragId !== section.id && overAfter ? `2px solid ${C.aqua}` : '2px solid transparent',
                                borderRadius: '8px'
                            }}
                        >
                        <Accordion disableGutters sx={{ bgcolor: C.card, color: C.sand, mb: 1, border: `1px solid ${C.cardBorder}`, borderRadius: '8px !important', '&:before': { display: 'none' }, '&.Mui-expanded': { mb: 1 } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.aqua }} />} sx={{ px: 2, minHeight: 52 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', pr: 1 }}>
                                    <Box
                                        className={styles.dragHandle}
                                        onMouseDown={() => setArmed(section.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        title="Drag to reorder group"
                                        sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: '#777', '&:hover': { color: C.aqua }, '&:active': { cursor: 'grabbing' }, touchAction: 'none' }}
                                    >
                                        <DragIndicatorIcon sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', mr: 0.25 }}>
                                        <Tooltip title="Move group up" placement="top">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    disabled={sectionIdx === 0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveSectionBy(section.id, -1);
                                                    }}
                                                    sx={{ p: 0, color: '#888', '&:hover': { color: C.aqua }, '&.Mui-disabled': { color: '#444' } }}
                                                >
                                                    <KeyboardArrowUpIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title="Move group down" placement="bottom">
                                            <span>
                                                <IconButton
                                                    size="small"
                                                    disabled={sectionIdx === state.structure.length - 1}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveSectionBy(section.id, 1);
                                                    }}
                                                    sx={{ p: 0, color: '#888', '&:hover': { color: C.aqua }, '&.Mui-disabled': { color: '#444' } }}
                                                >
                                                    <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                    {editingSection === section.id ? (
                                        <TextField
                                            value={section.title}
                                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                            placeholder="Group name"
                                            size="small"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                            onFocus={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (e.key === 'Enter' || e.key === 'Escape') setEditingSection(null);
                                            }}
                                            onBlur={() => setEditingSection(null)}
                                            sx={{
                                                flex: 1,
                                                '& .MuiInputBase-input': { color: C.sand, fontSize: '1rem', fontWeight: 700, py: 0.5 },
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
                                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
                                                '& .MuiInputBase-input::placeholder': { color: C.aqua, opacity: 0.85 }
                                            }}
                                        />
                                    ) : (
                                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: section.title.trim() ? C.sand : C.muted, flex: 1 }}>
                                            {section.title.trim() || 'Untitled group'}
                                        </Typography>
                                    )}

                                    {sectionComplete ? (
                                        <CheckCircleOutlineIcon sx={{ color: C.aqua, fontSize: 18 }} />
                                    ) : (
                                        <Chip label={`${sectionFilled}/${sectionTotal}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: C.muted, fontWeight: 600, fontSize: '0.72rem', height: 22 }} />
                                    )}

                                    <Tooltip title="Rename group" placement="top">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingSection(editingSection === section.id ? null : section.id);
                                            }}
                                            sx={{ color: editingSection === section.id ? C.aqua : '#888', '&:hover': { color: C.aqua } }}
                                        >
                                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Duplicate group" placement="top">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateSection(section.id);
                                            }}
                                            sx={{ color: '#888', '&:hover': { color: C.aqua } }}
                                        >
                                            <ContentCopyIcon sx={{ fontSize: 17 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete group" placement="top">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSection(section.id);
                                            }}
                                            sx={{ color: '#888', '&:hover': { color: C.danger } }}
                                        >
                                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </AccordionSummary>

                            <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                                {/* Section note */}
                                {section.note !== undefined ? (
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, bgcolor: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.18)', borderRadius: 1.5, px: 1.5, py: 0.5, mb: 2 }}>
                                        <TextField value={section.note} onChange={(e) => updateSection(section.id, { note: e.target.value })} placeholder="Group note…" size="small" fullWidth multiline maxRows={4} sx={sxNoteField} />
                                        <Tooltip title="Remove note" placement="top">
                                            <IconButton size="small" onClick={() => updateSection(section.id, { note: undefined })} sx={{ p: 0.25, color: '#557', '&:hover': { color: C.danger } }}>
                                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                ) : (
                                    <Button size="small" onClick={() => updateSection(section.id, { note: '' })} disableRipple sx={{ color: '#6b7280', fontSize: '0.7rem', textTransform: 'none', px: 0, minWidth: 0, mb: 1.5, '&:hover': { color: C.aqua, bgcolor: 'transparent' } }}>
                                        + group note
                                    </Button>
                                )}

                                {section.subsections.map((subsection, ssIdx) => (
                                    <Box key={subsection.id} sx={{ mb: ssIdx < section.subsections.length - 1 ? 3 : 0 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                            <TextField value={subsection.title} onChange={(e) => updateSubsectionTitle(section.id, subsection.id, e.target.value)} placeholder="Subgroup name" size="small" sx={{ ...sxGroupTitle, flex: '1 1 auto' }} />
                                            <Tooltip title="Delete subgroup" placement="top">
                                                <IconButton size="small" onClick={() => deleteSubsection(section.id, subsection.id)} sx={{ p: 0.5, color: '#555', '&:hover': { color: C.danger } }}>
                                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Stack spacing={2}>
                                            {subsection.items.map((item) => (
                                                <ItemRow
                                                    key={item.id}
                                                    item={item}
                                                    valueEntry={state.entries[item.id]}
                                                    dueEntry={state.entries[item.id + DUE_SUFFIX]}
                                                    options={state.options[item.id] ?? []}
                                                    onSetLabel={(v) => updateItem(section.id, subsection.id, item.id, { label: v })}
                                                    onSetNote={(v) => updateItem(section.id, subsection.id, item.id, { note: v })}
                                                    onSetValue={(v) => setEntry(item.id, v)}
                                                    onSetDue={(v) => setDueDate(item.id, v)}
                                                    onAddOption={() => addOption(item.id)}
                                                    onUpdateOption={(oid, l) => updateOption(item.id, oid, l)}
                                                    onRemoveOption={(oid) => removeOption(item.id, oid)}
                                                    onChooseOption={(l) => setEntry(item.id, l)}
                                                    onDelete={() => deleteItem(section.id, subsection.id, item)}
                                                />
                                            ))}
                                        </Stack>

                                        <Button
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => addItem(section.id, subsection.id)}
                                            sx={{ color: C.muted, fontSize: '0.75rem', textTransform: 'none', px: 0, minWidth: 0, mt: 1.5, '&:hover': { color: C.aqua, bgcolor: 'transparent' } }}
                                            disableRipple
                                        >
                                            Add item
                                        </Button>

                                        {ssIdx < section.subsections.length - 1 && <Divider sx={{ mt: 2.5, borderColor: '#3a3a3a' }} />}
                                    </Box>
                                ))}

                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => addSubsection(section.id)}
                                    sx={{ color: C.subLabel, fontSize: '0.72rem', textTransform: 'none', px: 0, minWidth: 0, mt: 2.5, '&:hover': { color: C.aqua, bgcolor: 'transparent' } }}
                                    disableRipple
                                >
                                    Add subgroup
                                </Button>
                            </AccordionDetails>
                        </Accordion>
                        </Box>
                    );
                })}

                <Button variant="outlined" startIcon={<AddIcon />} onClick={addSection} sx={{ mt: 1, color: C.aqua, borderColor: C.aqua, borderStyle: 'dashed', textTransform: 'none', '&:hover': { borderColor: C.aqua, bgcolor: 'rgba(0,255,255,0.06)', borderStyle: 'dashed' } }}>
                    Add group
                </Button>
            </Box>

            {/* Password dialog */}
            <Dialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)} PaperProps={{ sx: { bgcolor: C.card, color: C.sand, border: `1px solid ${C.aqua}`, minWidth: 320 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: C.aqua, fontSize: '1.05rem' }}>
                    <LockOutlinedIcon sx={{ fontSize: 20 }} />
                    Edit password required
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: C.muted, fontSize: '0.82rem', mb: 2 }}>Enter the shared edit password to save changes. Anyone can view, but saving is protected.</Typography>
                    <TextField
                        autoFocus
                        type="password"
                        value={pwInput}
                        onChange={(e) => setPwInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitPassword()}
                        placeholder="Password"
                        size="small"
                        fullWidth
                        sx={{ '& .MuiInputBase-input': { color: C.sand }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua } }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setPwDialogOpen(false)} sx={{ color: C.muted }}>
                        Cancel
                    </Button>
                    <Button onClick={submitPassword} variant="outlined" sx={{ color: C.aqua, borderColor: C.aqua }}>
                        Unlock &amp; Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar('')} severity="info" sx={{ bgcolor: C.card, color: C.sand, border: `1px solid ${C.aqua}` }}>
                    {snackbar}
                </Alert>
            </Snackbar>
        </Box>
    );
}
