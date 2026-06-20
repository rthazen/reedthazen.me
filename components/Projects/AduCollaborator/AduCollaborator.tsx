import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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
import { formatDistanceToNow } from 'date-fns';
import { aduChecklist, ChecklistSection, ItemType } from '../../../constants/aduChecklist';
import styles from './AduCollaborator.module.css';

const CACHE_KEY = 'adu-selections-cache';
const IDENTITY_KEY = 'adu-identity';
const PASSWORD_KEY = 'adu-edit-password';
const API = '/api/adu';
const POLL_MS = 25000;
const SAVE_DEBOUNCE_MS = 800;
const DUE_SUFFIX = '::due'; // entries key for an item's due date

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
type CustomItemDef = { id: string; label: string; type?: ItemType };
type OptionDef = { id: string; label: string; addedBy: string; addedAt: string };
type PersistedState = {
    entries: Record<string, BlameEntry>;
    options: Record<string, OptionDef[]>;
    customItems: Record<string, CustomItemDef[]>;
    removedItems: string[];
};
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

const EMPTY: PersistedState = { entries: {}, options: {}, customItems: {}, removedItems: [] };

function normalize(x: Partial<PersistedState> | null | undefined): PersistedState {
    return {
        entries: x?.entries ?? {},
        options: x?.options ?? {},
        customItems: x?.customItems ?? {},
        removedItems: x?.removedItems ?? []
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

function getAllBaseItems(sections: ChecklistSection[]) {
    return sections.flatMap((s) => s.subsections.flatMap((ss) => ss.items));
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const sxTextField = {
    '& .MuiInputBase-input': { color: C.sand, fontSize: '0.875rem' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.aqua },
    '& .MuiInputBase-input::placeholder': { color: C.muted, opacity: 1 }
};

const sxLabelField = {
    '& .MuiInputBase-input': { color: C.sand, fontSize: '0.875rem', fontWeight: 500 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#555' },
    '& .MuiInputBase-input::placeholder': { color: '#666', opacity: 1 },
    '& .MuiInputBase-root': { px: 0.5 }
};

// ─── Small presentational pieces ──────────────────────────────────────────────

function BlameChip({ entry, prefix }: { entry: BlameEntry | undefined; prefix?: string }) {
    if (!entry || !entry.value.trim()) return null;
    return (
        <Typography sx={{ color: '#6b7280', fontSize: '0.68rem', mt: 0.4, lineHeight: 1.2 }}>
            {prefix}
            {entry.editedBy} &middot; {relativeTime(entry.editedAt)}
        </Typography>
    );
}

function YesNoToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <ToggleButtonGroup
            value={value}
            exclusive
            onChange={(_, v) => v !== null && onChange(v)}
            size="small"
            sx={{ flexShrink: 0 }}
        >
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
                        '&.Mui-selected': {
                            color: C.card,
                            bgcolor: C.aqua,
                            borderColor: C.aqua,
                            '&:hover': { bgcolor: C.aqua }
                        }
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

// ─── Item row (shared by base + custom items) ─────────────────────────────────

type ItemRowProps = {
    itemId: string;
    labelNode: ReactNode;
    type?: ItemType;
    valueEntry: BlameEntry | undefined;
    dueEntry: BlameEntry | undefined;
    options: OptionDef[];
    onSetValue: (value: string) => void;
    onSetDue: (value: string) => void;
    onAddOption: () => void;
    onUpdateOption: (optionId: string, label: string) => void;
    onRemoveOption: (optionId: string) => void;
    onChooseOption: (label: string) => void;
    onDelete: () => void;
    deleteTooltip: string;
};

function ItemRow({
    itemId,
    labelNode,
    type,
    valueEntry,
    dueEntry,
    options,
    onSetValue,
    onSetDue,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
    onChooseOption,
    onDelete,
    deleteTooltip
}: ItemRowProps) {
    const value = valueEntry?.value ?? '';

    return (
        <Box
            className={styles.itemRow}
            sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}
        >
            {/* Label */}
            <Box sx={{ flex: '0 0 220px', minWidth: 140 }}>{labelNode}</Box>

            {/* Main column: selection · options · due */}
            <Box sx={{ flex: 1, minWidth: 200 }}>
                {/* Selection */}
                {type === 'yes_no' ? (
                    <YesNoToggle value={value} onChange={onSetValue} />
                ) : (
                    <TextField
                        value={value}
                        onChange={(e) => onSetValue(e.target.value)}
                        placeholder="Your selection..."
                        size="small"
                        multiline
                        maxRows={3}
                        fullWidth
                        sx={sxTextField}
                    />
                )}
                <BlameChip entry={valueEntry} />

                {/* Options (candidates) */}
                {options.length > 0 && (
                    <Box sx={{ mt: 1.25 }}>
                        <Typography
                            sx={{ color: C.muted, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}
                        >
                            Options
                        </Typography>
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
                                                    {chosen ? (
                                                        <RadioButtonCheckedIcon sx={{ fontSize: 18 }} />
                                                    ) : (
                                                        <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
                                                    )}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <TextField
                                                value={o.label}
                                                onChange={(e) => onUpdateOption(o.id, e.target.value)}
                                                placeholder="Option…"
                                                size="small"
                                                fullWidth
                                                sx={sxLabelField}
                                            />
                                            <Typography sx={{ color: '#6b7280', fontSize: '0.66rem', mt: 0.2, lineHeight: 1.2 }}>
                                                added by {o.addedBy} &middot; {relativeTime(o.addedAt)}
                                            </Typography>
                                        </Box>
                                        <Tooltip title="Remove option" placement="top">
                                            <IconButton
                                                size="small"
                                                onClick={() => onRemoveOption(o.id)}
                                                sx={{ p: 0.5, mt: 0.25, color: '#555', '&:hover': { color: C.danger } }}
                                            >
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

                {/* Due date */}
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

            {/* Delete row */}
            <Tooltip title={deleteTooltip} placement="top">
                <IconButton
                    className={styles.removeBtn}
                    size="small"
                    onClick={onDelete}
                    sx={{ color: '#555', flexShrink: 0, mt: 0.25, '&:hover': { color: C.danger } }}
                >
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AduCollaborator() {
    const [state, setState] = useState<PersistedState>(EMPTY);
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [snackbar, setSnackbar] = useState('');
    const [pwDialogOpen, setPwDialogOpen] = useState(false);
    const [pwInput, setPwInput] = useState('');

    const dirtyRef = useRef(false);
    const stateRef = useRef(state);
    const passwordRef = useRef(password);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSave = useRef(false);

    stateRef.current = state;
    passwordRef.current = password;

    const who = useCallback(() => identity.trim() || 'Anonymous', [identity]);

    // ── Initial load ──
    useEffect(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) setState(normalize(JSON.parse(cached)));
            const id = localStorage.getItem(IDENTITY_KEY);
            if (id) setIdentity(id);
            const pw = sessionStorage.getItem(PASSWORD_KEY);
            if (pw) setPassword(pw);
        } catch {}

        fetch(API)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((doc) => {
                setState(normalize(doc));
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
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doSave(), SAVE_DEBOUNCE_MS);
    }, [doSave]);

    // ── Background poll ──
    useEffect(() => {
        const iv = setInterval(() => {
            if (dirtyRef.current || pendingSave.current) return;
            fetch(API)
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((doc) => {
                    if (dirtyRef.current || pendingSave.current) return;
                    setState(normalize(doc));
                    if (saveStatus === 'offline') setSaveStatus('idle');
                })
                .catch(() => {});
        }, POLL_MS);
        return () => clearInterval(iv);
    }, [saveStatus]);

    // ── Mutations ──
    const setEntry = useCallback(
        (id: string, value: string) => {
            setState((prev) => ({
                ...prev,
                entries: { ...prev.entries, [id]: { value, editedBy: who(), editedAt: new Date().toISOString() } }
            }));
            scheduleSave();
        },
        [who, scheduleSave]
    );

    const setDueDate = useCallback((itemId: string, value: string) => setEntry(itemId + DUE_SUFFIX, value), [setEntry]);

    const addOption = useCallback(
        (itemId: string) => {
            const opt: OptionDef = { id: `opt-${itemId}-${Date.now()}`, label: '', addedBy: who(), addedAt: new Date().toISOString() };
            setState((prev) => ({
                ...prev,
                options: { ...prev.options, [itemId]: [...(prev.options[itemId] ?? []), opt] }
            }));
            scheduleSave();
        },
        [who, scheduleSave]
    );

    const updateOption = useCallback(
        (itemId: string, optionId: string, label: string) => {
            setState((prev) => {
                const opts = prev.options[itemId] ?? [];
                const old = opts.find((o) => o.id === optionId)?.label ?? '';
                const stamp = { addedBy: who(), addedAt: new Date().toISOString() };
                const nextOpts = opts.map((o) => (o.id === optionId ? { ...o, label, ...stamp } : o));
                // Keep the selection in sync if this option was the chosen one
                let entries = prev.entries;
                if (old && prev.entries[itemId]?.value === old) {
                    entries = { ...entries, [itemId]: { value: label, editedBy: who(), editedAt: new Date().toISOString() } };
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
                options: { ...prev.options, [itemId]: (prev.options[itemId] ?? []).filter((o) => o.id !== optionId) }
            }));
            scheduleSave();
        },
        [scheduleSave]
    );

    const removeBaseItem = useCallback(
        (itemId: string) => {
            setState((prev) => ({ ...prev, removedItems: [...prev.removedItems, itemId] }));
            scheduleSave();
        },
        [scheduleSave]
    );

    const restoreBaseItem = useCallback(
        (itemId: string) => {
            setState((prev) => ({ ...prev, removedItems: prev.removedItems.filter((id) => id !== itemId) }));
            scheduleSave();
        },
        [scheduleSave]
    );

    const addCustomItem = useCallback(
        (subsectionId: string) => {
            const newItem: CustomItemDef = { id: `custom-${subsectionId}-${Date.now()}`, label: '' };
            setState((prev) => ({
                ...prev,
                customItems: { ...prev.customItems, [subsectionId]: [...(prev.customItems[subsectionId] ?? []), newItem] }
            }));
            scheduleSave();
        },
        [scheduleSave]
    );

    const updateCustomLabel = useCallback(
        (subsectionId: string, itemId: string, label: string) => {
            setState((prev) => ({
                ...prev,
                customItems: {
                    ...prev.customItems,
                    [subsectionId]: (prev.customItems[subsectionId] ?? []).map((it) => (it.id === itemId ? { ...it, label } : it))
                }
            }));
            scheduleSave();
        },
        [scheduleSave]
    );

    const removeCustomItem = useCallback(
        (subsectionId: string, itemId: string) => {
            setState((prev) => {
                const next = {
                    ...prev,
                    customItems: { ...prev.customItems, [subsectionId]: (prev.customItems[subsectionId] ?? []).filter((it) => it.id !== itemId) }
                };
                const { [itemId]: _v, ...entries } = next.entries;
                const { [itemId + DUE_SUFFIX]: _d, ...entries2 } = entries;
                const { [itemId]: _o, ...options } = next.options;
                return { ...next, entries: entries2, options };
            });
            scheduleSave();
        },
        [scheduleSave]
    );

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
    const refresh = () => {
        fetch(API)
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((doc) => {
                setState(normalize(doc));
                dirtyRef.current = false;
                setSaveStatus('idle');
                setSnackbar('Refreshed with the latest saved version.');
            })
            .catch(() => setSnackbar('Could not refresh from the server.'));
    };

    // ── Progress ──
    const allBaseItems = getAllBaseItems(aduChecklist).filter((it) => !state.removedItems.includes(it.id));
    const allCustomItems = Object.values(state.customItems).flat().filter((it) => it.label.trim());
    const totalItems = allBaseItems.length + allCustomItems.length;
    const filledItems = [...allBaseItems, ...allCustomItems].filter((it) => (state.entries[it.id]?.value ?? '').trim()).length;
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

    // ── Render ──
    return (
        <Box className={styles.root}>
            <Box className={styles.header}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                    <Box>
                        <Typography variant="h4" sx={{ color: C.aqua, fontWeight: 700, mb: 0.5 }}>
                            ADU Client Selections
                        </Typography>
                        <Typography sx={{ color: C.muted, fontSize: '0.9rem' }}>
                            Los Angeles ADU Project &mdash; a shared, auto-saving checklist for you and your PM.
                        </Typography>
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
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 7, borderRadius: 4, bgcolor: '#4a4a4a', '& .MuiLinearProgress-bar': { bgcolor: C.aqua, borderRadius: 4 } }}
                    />
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button variant="outlined" size="small" startIcon={<ContentCopyIcon />} onClick={copyLink} sx={{ color: C.aqua, borderColor: C.aqua, '&:hover': { borderColor: C.aqua, bgcolor: 'rgba(0,255,255,0.08)' } }}>
                        Copy Page Link
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<SyncIcon />} onClick={refresh} sx={{ color: C.sand, borderColor: '#555', '&:hover': { borderColor: C.sand, bgcolor: 'rgba(244,241,201,0.06)' } }}>
                        Refresh
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ color: C.sand, borderColor: '#555', '&:hover': { borderColor: C.sand, bgcolor: 'rgba(244,241,201,0.06)' } }}>
                        Print
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<FileDownloadOutlinedIcon />} onClick={exportJson} sx={{ color: C.sand, borderColor: '#555', '&:hover': { borderColor: C.sand, bgcolor: 'rgba(244,241,201,0.06)' } }}>
                        Backup
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <SaveIndicator status={saveStatus} />
                </Stack>
            </Box>

            <Box className={styles.sections}>
                {aduChecklist.map((section) => {
                    const baseItems = section.subsections.flatMap((ss) => ss.items);
                    const visibleBase = baseItems.filter((it) => !state.removedItems.includes(it.id));
                    const customForSection = section.subsections.flatMap((ss) => (state.customItems[ss.id] ?? []).filter((it) => it.label.trim()));
                    const allVisible = [...visibleBase, ...customForSection];
                    const sectionFilled = allVisible.filter((it) => (state.entries[it.id]?.value ?? '').trim()).length;
                    const sectionTotal = visibleBase.length + customForSection.length;
                    const sectionComplete = sectionFilled > 0 && sectionFilled === sectionTotal;

                    return (
                        <Accordion
                            key={section.id}
                            disableGutters
                            sx={{ bgcolor: C.card, color: C.sand, mb: 1, border: `1px solid ${C.cardBorder}`, borderRadius: '8px !important', '&:before': { display: 'none' }, '&.Mui-expanded': { mb: 1 } }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: C.aqua }} />} sx={{ px: 2.5, minHeight: 52 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 1 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: C.sand, flex: 1 }}>{section.title}</Typography>
                                    {sectionComplete ? (
                                        <CheckCircleOutlineIcon sx={{ color: C.aqua, fontSize: 18 }} />
                                    ) : (
                                        <Chip label={`${sectionFilled}/${sectionTotal}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: C.muted, fontWeight: 600, fontSize: '0.72rem', height: 22 }} />
                                    )}
                                </Box>
                            </AccordionSummary>

                            <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                                {section.note && (
                                    <Box sx={{ bgcolor: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.18)', borderRadius: 1.5, px: 2, py: 1, mb: 2 }}>
                                        <Typography sx={{ color: C.muted, fontSize: '0.8rem', fontStyle: 'italic' }}>{section.note}</Typography>
                                    </Box>
                                )}

                                {section.subsections.map((subsection, ssIdx) => {
                                    const removedInSub = subsection.items.filter((it) => state.removedItems.includes(it.id));
                                    const customInSub = state.customItems[subsection.id] ?? [];

                                    return (
                                        <Box key={subsection.id} sx={{ mb: ssIdx < section.subsections.length - 1 ? 3 : 0 }}>
                                            <Typography sx={{ color: C.subLabel, fontWeight: 600, fontSize: '0.75rem', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                                {subsection.title}
                                            </Typography>

                                            <Stack spacing={2}>
                                                {/* Base items */}
                                                {subsection.items
                                                    .filter((it) => !state.removedItems.includes(it.id))
                                                    .map((item) => (
                                                        <ItemRow
                                                            key={item.id}
                                                            itemId={item.id}
                                                            type={item.type}
                                                            labelNode={
                                                                <>
                                                                    <Typography sx={{ color: C.sand, fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4, pt: item.note ? 0 : 0.75 }}>
                                                                        {item.label}
                                                                    </Typography>
                                                                    {item.note && (
                                                                        <Typography sx={{ color: C.muted, fontSize: '0.73rem', mt: 0.25, lineHeight: 1.4 }}>{item.note}</Typography>
                                                                    )}
                                                                </>
                                                            }
                                                            valueEntry={state.entries[item.id]}
                                                            dueEntry={state.entries[item.id + DUE_SUFFIX]}
                                                            options={state.options[item.id] ?? []}
                                                            onSetValue={(v) => setEntry(item.id, v)}
                                                            onSetDue={(v) => setDueDate(item.id, v)}
                                                            onAddOption={() => addOption(item.id)}
                                                            onUpdateOption={(oid, l) => updateOption(item.id, oid, l)}
                                                            onRemoveOption={(oid) => removeOption(item.id, oid)}
                                                            onChooseOption={(l) => setEntry(item.id, l)}
                                                            onDelete={() => removeBaseItem(item.id)}
                                                            deleteTooltip="Hide this item"
                                                        />
                                                    ))}

                                                {/* Custom items */}
                                                {customInSub.map((item) => (
                                                    <ItemRow
                                                        key={item.id}
                                                        itemId={item.id}
                                                        labelNode={
                                                            <TextField
                                                                value={item.label}
                                                                onChange={(e) => updateCustomLabel(subsection.id, item.id, e.target.value)}
                                                                placeholder="Item label..."
                                                                size="small"
                                                                fullWidth
                                                                sx={sxLabelField}
                                                            />
                                                        }
                                                        valueEntry={state.entries[item.id]}
                                                        dueEntry={state.entries[item.id + DUE_SUFFIX]}
                                                        options={state.options[item.id] ?? []}
                                                        onSetValue={(v) => setEntry(item.id, v)}
                                                        onSetDue={(v) => setDueDate(item.id, v)}
                                                        onAddOption={() => addOption(item.id)}
                                                        onUpdateOption={(oid, l) => updateOption(item.id, oid, l)}
                                                        onRemoveOption={(oid) => removeOption(item.id, oid)}
                                                        onChooseOption={(l) => setEntry(item.id, l)}
                                                        onDelete={() => removeCustomItem(subsection.id, item.id)}
                                                        deleteTooltip="Delete this item"
                                                    />
                                                ))}
                                            </Stack>

                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5, gap: 2, flexWrap: 'wrap' }}>
                                                <Button
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => addCustomItem(subsection.id)}
                                                    sx={{ color: C.muted, fontSize: '0.75rem', textTransform: 'none', px: 0, minWidth: 0, '&:hover': { color: C.aqua, bgcolor: 'transparent' } }}
                                                    disableRipple
                                                >
                                                    Add item
                                                </Button>
                                                {removedInSub.length > 0 && (
                                                    <Typography sx={{ color: '#555', fontSize: '0.72rem' }}>
                                                        {removedInSub.length} hidden
                                                        {removedInSub.map((it) => (
                                                            <Box
                                                                key={it.id}
                                                                component="span"
                                                                onClick={() => restoreBaseItem(it.id)}
                                                                sx={{ ml: 1, color: C.muted, cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: C.sand }, fontSize: '0.72rem' }}
                                                            >
                                                                restore &quot;{it.label}&quot;
                                                            </Box>
                                                        ))}
                                                    </Typography>
                                                )}
                                            </Box>

                                            {ssIdx < section.subsections.length - 1 && <Divider sx={{ mt: 2.5, borderColor: '#3a3a3a' }} />}
                                        </Box>
                                    );
                                })}
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Box>

            {/* Password dialog */}
            <Dialog open={pwDialogOpen} onClose={() => setPwDialogOpen(false)} PaperProps={{ sx: { bgcolor: C.card, color: C.sand, border: `1px solid ${C.aqua}`, minWidth: 320 } }}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: C.aqua, fontSize: '1.05rem' }}>
                    <LockOutlinedIcon sx={{ fontSize: 20 }} />
                    Edit password required
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: C.muted, fontSize: '0.82rem', mb: 2 }}>
                        Enter the shared edit password to save changes. Anyone can view, but saving is protected.
                    </Typography>
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
                    <Button onClick={() => setPwDialogOpen(false)} sx={{ color: C.muted }}>Cancel</Button>
                    <Button onClick={submitPassword} variant="outlined" sx={{ color: C.aqua, borderColor: C.aqua }}>Unlock &amp; Save</Button>
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
