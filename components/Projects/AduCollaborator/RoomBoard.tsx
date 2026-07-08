import { useState } from 'react';

/* =====================================================
   5656 Lindley ADU — Japandi Room Design Board
   Illustrated elevations of each room, with palette
   and specs drawn from the design guide.

   Read-only reference for the ADU Collaborator. Kept
   self-contained (own palette + fonts) so it does not
   inherit the collaborator's dark MUI theme.
   ===================================================== */

const C = {
    paper: '#F5F1E8',
    panel: '#FCFAF4',
    ink: '#2C2823',
    faint: '#8D8375',
    wall: '#F3EDE1', // "oat milk" warm white
    wallShade: '#E9E1D1',
    floor: '#E3D5BC', // light oak
    floorLine: '#D2C0A2',
    oak: '#D9BE95',
    oakDark: '#B99A6E',
    oakLight: '#E6D2AF',
    walnut: '#8A684B',
    walnutDark: '#6E5138',
    stone: '#EDE8DD',
    plaster: '#EAE3D4',
    black: '#33302B',
    brass: '#A97E3F',
    oat: '#EDE5D5',
    oatLine: '#D3C5AA',
    linen: '#F1EADC',
    sage: '#A8B096',
    sageDark: '#87907A',
    clay: '#C2865F',
    green: '#7E8F6B',
    greenDark: '#5C6C4C',
    glow: '#F8E3B0'
} as const;

type Room = { id: string; tab: string; title: string; specs: string[] };
type Swatch = { name: string; hex: string };

const PALETTE: Swatch[] = [
    { name: 'Oat milk wall', hex: '#F3EDE1' },
    { name: 'Light oak', hex: '#D9BE95' },
    { name: 'Walnut accent', hex: '#8A684B' },
    { name: 'Matte black', hex: '#33302B' },
    { name: 'Sage', hex: '#A8B096' },
    { name: 'Clay', hex: '#C2865F' }
];

const ROOMS: Room[] = [
    {
        id: 'kitchen',
        tab: 'Kitchen + Dining',
        title: 'Kitchen and dining, under the skylight',
        specs: [
            'Slab-front oak cabinets, thin matte-black pulls',
            'One run of open oak shelving to break the solid mass',
            'Plaster-look backsplash, quiet from every sightline',
            'Round oak pedestal table centered under the skylight',
            'Paper pendant hung low (~30″) over the table',
            'W/D behind flat panels matching the cabinets'
        ]
    },
    {
        id: 'living',
        tab: 'Living',
        title: 'Living zone, TV wall and entry',
        specs: [
            'Low loveseat (under 72″), legs visible, back to dining',
            'Wall-mounted TV over a long floating oak shelf — no console',
            'Sage flatweave rug anchors the seating zone only',
            'Round walnut coffee table softens the straight lines',
            'Slim entry bench + wall hooks inside the door',
            'Warm 2700K lamps only — no cool white anywhere'
        ]
    },
    {
        id: 'bedroom',
        tab: 'Bedroom',
        title: 'Bedroom, rear of the unit',
        specs: [
            'Low platform bed in light oak — no tall headboard',
            'Floating shelves as nightstands, walls stay open',
            'Two matte-black sconces replace table lamps',
            'Built-in refaced with slatted, shoji-inspired doors',
            'Layered oatmeal linen, one sage or clay throw',
            "Walnut dresser as the room's single dark accent"
        ]
    },
    {
        id: 'bath',
        tab: 'Bathroom',
        title: 'Bathroom, off the kitchen hall',
        specs: [
            'Floating oak vanity — visible floor expands the room',
            'Round mirror, no hard rectangles',
            'Large-format greige tile, minimal grout lines',
            'Matte black fixtures matching the kitchen hardware',
            'Frameless glass at the shower keeps light moving',
            'Woven baskets instead of closed cabinets'
        ]
    }
];

export default function RoomBoard() {
    const [room, setRoom] = useState('kitchen');
    const active = ROOMS.find((r) => r.id === room) ?? ROOMS[0];

    return (
        <div style={{ background: C.paper, color: C.ink, fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", borderRadius: 14 }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Old+Mincho:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        .zom { font-family:'Zen Old Mincho', Georgia, serif; }
        .rb-tab { border:1px solid #D8CFBD; background:#FCFAF4; color:#4A443B; border-radius:999px;
               padding:7px 15px; font-size:12.5px; font-weight:500; cursor:pointer; transition:all .15s ease; }
        .rb-tab.on { background:#2C2823; color:#F5F1E8; border-color:#2C2823; }
        .rb-tab:hover:not(.on) { border-color:${C.brass}; }
        @media (prefers-reduced-motion: reduce) { .rb-tab { transition:none !important; } }
      `}</style>

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 14px 48px' }}>
                <div style={{ fontSize: 10.5, letterSpacing: '0.22em', color: C.faint, fontWeight: 600 }}>5656 LINDLEY AVE · ENCINO · ADU INTERIOR</div>
                <h1 className="zom" style={{ fontSize: 28, fontWeight: 700, margin: '5px 0 4px' }}>
                    Japandi, room by room
                </h1>
                <div style={{ fontSize: 13, color: '#6B6355', marginBottom: 16 }}>Elevation studies of each room in the finishes from your design guide.</div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
                    {ROOMS.map((r) => (
                        <button key={r.id} className={`rb-tab ${room === r.id ? 'on' : ''}`} onClick={() => setRoom(r.id)}>
                            {r.tab}
                        </button>
                    ))}
                </div>

                {/* Scene */}
                <div style={{ background: C.panel, border: '1px solid #E2D9C7', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(44,40,35,.06)' }}>
                    <svg viewBox="0 0 800 440" style={{ width: '100%', height: 'auto', display: 'block' }}>
                        {room === 'kitchen' && <KitchenScene />}
                        {room === 'living' && <LivingScene />}
                        {room === 'bedroom' && <BedroomScene />}
                        {room === 'bath' && <BathScene />}
                    </svg>
                    <div style={{ padding: '14px 16px 18px' }}>
                        <div className="zom" style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                            {active.title}
                        </div>
                        <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.75, color: '#4A443B' }}>
                            {active.specs.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Palette */}
                <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: '0.2em', color: C.faint, fontWeight: 600, marginBottom: 8 }}>WHOLE-UNIT PALETTE</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {PALETTE.map((p) => (
                            <div key={p.hex} style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.panel, border: '1px solid #E2D9C7', borderRadius: 999, padding: '5px 12px 5px 6px' }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: p.hex, border: '1px solid rgba(44,40,35,.15)', display: 'inline-block' }} />
                                <span style={{ fontSize: 11.5, color: '#4A443B' }}>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: 14, fontSize: 11.5, color: C.faint, lineHeight: 1.55 }}>Illustrations are style studies, not to-scale renderings — use them with the furniture planner to pair the look with the layout.</div>
            </div>
        </div>
    );
}

/* ---------------- shared bits ---------------- */

function Backdrop({ skylight = false }: { skylight?: boolean }) {
    return (
        <g>
            <rect x="0" y="0" width="800" height="360" fill={C.wall} />
            <rect x="0" y="0" width="800" height="360" fill="url(#wallSoft)" opacity="0.5" />
            <rect x="0" y="360" width="800" height="80" fill={C.floor} />
            {[420, 620, 220].map((x, i) => (
                <line key={i} x1={x - 160} y1="440" x2={x} y2="360" stroke={C.floorLine} strokeWidth="1" opacity="0.7" />
            ))}
            <line x1="0" y1="360" x2="800" y2="360" stroke={C.floorLine} strokeWidth="1.5" />
            {skylight && (
                <g>
                    <polygon points="470,0 700,0 760,360 410,360" fill="url(#shaft)" opacity="0.55" />
                    <ellipse cx="585" cy="368" rx="185" ry="26" fill={C.glow} opacity="0.4" />
                </g>
            )}
        </g>
    );
}

function Defs() {
    return (
        <defs>
            <linearGradient id="wallSoft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
                <stop offset="100%" stopColor={C.wallShade} stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.glow} stopOpacity="0.95" />
                <stop offset="100%" stopColor={C.glow} stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#DCE4E0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#C7D2CC" stopOpacity="0.5" />
            </linearGradient>
        </defs>
    );
}

type WoodPanelProps = {
    x: number;
    y: number;
    w: number;
    h: number;
    tone?: string;
    dark?: string;
    grain?: boolean;
    rx?: number;
};

function WoodPanel({ x, y, w, h, tone = C.oak, dark = C.oakDark, grain = true, rx = 2 }: WoodPanelProps) {
    const lines = grain ? Math.max(2, Math.floor(w / 26)) : 0;
    return (
        <g>
            <rect x={x} y={y} width={w} height={h} rx={rx} fill={tone} stroke={dark} strokeWidth="1" />
            {Array.from({ length: lines }).map((_, i) => (
                <line key={i} x1={x + ((i + 1) * w) / (lines + 1)} y1={y + 4} x2={x + ((i + 1) * w) / (lines + 1)} y2={y + h - 4} stroke={dark} strokeWidth="0.7" opacity="0.35" />
            ))}
        </g>
    );
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x},${y}) scale(${s})`}>
            <path d="M0,0 C-6,-34 -22,-44 -26,-66 C-8,-56 -4,-38 0,-16 C4,-44 16,-56 30,-70 C24,-44 12,-30 4,-4 Z" fill={C.green} />
            <path d="M0,-10 C-2,-40 -14,-58 -10,-78 C0,-62 2,-40 2,-14 Z" fill={C.greenDark} opacity="0.8" />
            <path d="M-14,0 L14,0 L10,26 L-10,26 Z" fill={C.stone} stroke={C.oatLine} strokeWidth="1" />
        </g>
    );
}

/* ---------------- Kitchen + Dining ---------------- */

function KitchenScene() {
    return (
        <g>
            <Defs />
            <Backdrop skylight />

            {/* Backsplash (plaster) */}
            <rect x="30" y="180" width="360" height="88" fill={C.plaster} stroke={C.oatLine} strokeWidth="1" />

            {/* Open oak shelf with ceramics */}
            <WoodPanel x={52} y={132} w={200} h={10} rx={2} />
            <g>
                <rect x="70" y="106" width="22" height="26" rx="3" fill={C.stone} stroke={C.oatLine} />
                <path d="M112 132 a12 14 0 0 1 0 -26 a12 14 0 0 1 0 26 z" fill={C.sage} opacity="0.9" />
                <rect x="140" y="112" width="16" height="20" rx="8" fill={C.clay} opacity="0.85" />
                <rect x="172" y="102" width="26" height="30" rx="3" fill={C.linen} stroke={C.oatLine} />
            </g>

            {/* Counter + lower slab cabinets */}
            <rect x="22" y="268" width="376" height="10" rx="2" fill={C.stone} stroke={C.oatLine} strokeWidth="1" />
            <WoodPanel x={30} y={278} w={120} h={86} />
            <WoodPanel x={150} y={278} w={120} h={86} />
            <WoodPanel x={270} y={278} w={120} h={86} />
            {/* thin black pulls */}
            {[60, 180, 300].map((x) => (
                <rect key={x} x={x} y="286" width="58" height="3" rx="1.5" fill={C.black} />
            ))}

            {/* Faucet + sink line */}
            <g stroke={C.black} strokeWidth="4" fill="none" strokeLinecap="round">
                <path d="M96 268 v-30 q0 -12 14 -12 h10 v8" />
            </g>
            <line x1="66" y1="269" x2="150" y2="269" stroke={C.black} strokeWidth="2.5" opacity="0.6" />

            {/* Range burners hint */}
            {[300, 336].map((x) => (
                <g key={x}>
                    <circle cx={x} cy="272" r="8" fill="none" stroke={C.black} strokeWidth="2" opacity="0.7" />
                </g>
            ))}

            {/* Pendant over table */}
            <line x1="585" y1="0" x2="585" y2="118" stroke={C.black} strokeWidth="2" />
            <path d="M545 156 a40 42 0 0 1 80 0 q0 10 -40 10 q-40 0 -40 -10 z" fill={C.linen} stroke={C.oatLine} strokeWidth="1.5" />
            <circle cx="585" cy="168" r="4" fill={C.glow} />

            {/* Round oak table, pedestal */}
            <ellipse cx="585" cy="298" rx="118" ry="20" fill={C.oak} stroke={C.oakDark} strokeWidth="1.5" />
            <rect x="573" y="304" width="24" height="52" fill={C.oakDark} />
            <path d="M553 356 h64 l8 8 h-80 z" fill={C.oakDark} />
            <ellipse cx="585" cy="296" rx="104" ry="15" fill="none" stroke={C.oakDark} strokeWidth="1" opacity="0.5" />

            {/* Two bentwood chairs */}
            <Chair x={452} y={268} flip={false} />
            <Chair x={718} y={268} flip={true} />

            <Plant x={756} y={392} s={0.9} />

            {/* caption */}
            <SceneTag x={30} y={34} label="SKYLIGHT LIGHT POOL" />
        </g>
    );
}

function Chair({ x, y, flip }: { x: number; y: number; flip: boolean }) {
    const s = flip ? -1 : 1;
    return (
        <g transform={`translate(${x},${y}) scale(${s},1)`}>
            <path d="M0 0 q-10 -52 4 -66" fill="none" stroke={C.oakDark} strokeWidth="5" strokeLinecap="round" />
            <rect x="-4" y="-4" width="52" height="8" rx="4" fill={C.oak} stroke={C.oakDark} strokeWidth="1" />
            <line x1="2" y1="4" x2="-4" y2="88" stroke={C.oakDark} strokeWidth="5" strokeLinecap="round" />
            <line x1="44" y1="4" x2="52" y2="88" stroke={C.oakDark} strokeWidth="5" strokeLinecap="round" />
        </g>
    );
}

/* ---------------- Living ---------------- */

function LivingScene() {
    return (
        <g>
            <Defs />
            <Backdrop />

            {/* Window, right */}
            <rect x="656" y="86" width="112" height="180" rx="3" fill="url(#glass)" stroke={C.black} strokeWidth="3" />
            <line x1="712" y1="86" x2="712" y2="266" stroke={C.black} strokeWidth="2" />
            <line x1="656" y1="176" x2="768" y2="176" stroke={C.black} strokeWidth="2" />

            {/* TV + floating oak shelf */}
            <rect x="216" y="96" width="230" height="132" rx="4" fill={C.black} />
            <rect x="224" y="104" width="214" height="116" rx="2" fill="#4A463F" />
            <WoodPanel x={188} y={252} w={288} h={14} rx={3} />
            <rect x="222" y="234" width="26" height="18" rx="2" fill={C.stone} stroke={C.oatLine} />
            <path d="M398 252 a12 13 0 0 1 0 -24 a12 13 0 0 1 0 24 z" fill={C.sage} />

            {/* Rug */}
            <ellipse cx="330" cy="402" rx="250" ry="26" fill={C.sage} opacity="0.5" />
            <ellipse cx="330" cy="402" rx="220" ry="20" fill="none" stroke={C.sageDark} strokeWidth="1.2" opacity="0.7" />

            {/* Loveseat (viewed from behind-ish / side facing TV) */}
            <g>
                <rect x="120" y="306" width="420" height="30" rx="14" fill={C.oat} stroke={C.oatLine} strokeWidth="1.5" />
                <rect x="132" y="284" width="190" height="34" rx="12" fill={C.linen} stroke={C.oatLine} strokeWidth="1.2" />
                <rect x="330" y="284" width="190" height="34" rx="12" fill={C.linen} stroke={C.oatLine} strokeWidth="1.2" />
                <rect x="108" y="298" width="26" height="44" rx="10" fill={C.oat} stroke={C.oatLine} strokeWidth="1.2" />
                <rect x="526" y="298" width="26" height="44" rx="10" fill={C.oat} stroke={C.oatLine} strokeWidth="1.2" />
                {/* cushions: sage + clay accents */}
                <rect x="150" y="286" width="42" height="30" rx="8" fill={C.sage} />
                <rect x="452" y="286" width="42" height="30" rx="8" fill={C.clay} opacity="0.9" />
                {/* visible legs */}
                {[140, 260, 400, 516].map((x) => (
                    <line key={x} x1={x} y1="336" x2={x - 4} y2="366" stroke={C.walnut} strokeWidth="5" strokeLinecap="round" />
                ))}
            </g>

            {/* Walnut coffee table */}
            <g>
                <ellipse cx="620" cy="356" rx="66" ry="13" fill={C.walnut} stroke={C.walnutDark} strokeWidth="1.5" />
                {[586, 654].map((x) => (
                    <line key={x} x1={x} y1="366" x2={x} y2="398" stroke={C.walnutDark} strokeWidth="5" strokeLinecap="round" />
                ))}
                <rect x="600" y="342" width="24" height="6" rx="3" fill={C.linen} stroke={C.oatLine} />
            </g>

            {/* Entry bench far left */}
            <g>
                <WoodPanel x={20} y={330} w={76} h={10} tone={C.walnut} dark={C.walnutDark} grain={false} rx={3} />
                <line x1="28" y1="340" x2="26" y2="372" stroke={C.walnutDark} strokeWidth="4" strokeLinecap="round" />
                <line x1="88" y1="340" x2="90" y2="372" stroke={C.walnutDark} strokeWidth="4" strokeLinecap="round" />
                {[34, 52, 70].map((x) => (
                    <circle key={x} cx={x} cy="300" r="3.4" fill={C.black} />
                ))}
            </g>

            <Plant x={756} y={392} s={1.05} />
            <SceneTag x={30} y={34} label="WARM 2700K ONLY" />
        </g>
    );
}

/* ---------------- Bedroom ---------------- */

function BedroomScene() {
    return (
        <g>
            <Defs />
            <Backdrop />

            {/* Slatted built-in doors, right */}
            <g>
                <rect x="628" y="70" width="150" height="292" fill={C.oakLight} stroke={C.oakDark} strokeWidth="1.5" />
                {Array.from({ length: 18 }).map((_, i) => (
                    <line key={i} x1={636 + i * 7.6} y1="74" x2={636 + i * 7.6} y2="358" stroke={C.oakDark} strokeWidth="2" opacity="0.5" />
                ))}
                <line x1="703" y1="70" x2="703" y2="362" stroke={C.oakDark} strokeWidth="2" />
            </g>

            {/* Sconces */}
            {[150, 470].map((x) => (
                <g key={x}>
                    <rect x={x} y="150" width="8" height="34" rx="4" fill={C.black} />
                    <circle cx={x + 4} cy="146" r="10" fill={C.glow} opacity="0.9" />
                    <ellipse cx={x + 4} cy="176" rx="34" ry="46" fill={C.glow} opacity="0.14" />
                </g>
            ))}

            {/* Minimal line art */}
            <rect x="256" y="96" width="110" height="76" rx="2" fill="#FEFCF7" stroke={C.oatLine} strokeWidth="1.5" />
            <path d="M272 152 q22 -34 44 -8 q18 20 34 -18" fill="none" stroke={C.faint} strokeWidth="1.6" />

            {/* Floating shelves as nightstands */}
            <WoodPanel x={96} y={252} w={88} h={10} rx={2} />
            <WoodPanel x={440} y={252} w={88} h={10} rx={2} />
            <rect x="112" y="234" width="18" height="18" rx="9" fill={C.sage} />
            <rect x="466" y="232" width="24" height="20" rx="2" fill={C.stone} stroke={C.oatLine} />

            {/* Low platform bed */}
            <g>
                {/* oak platform */}
                <WoodPanel x={140} y={330} w={344} h={30} rx={4} />
                {/* mattress + layered linen */}
                <rect x="152" y="284" width="320" height="52" rx="10" fill={C.oat} stroke={C.oatLine} strokeWidth="1.5" />
                <path d="M152 314 q160 16 320 0 v20 q-160 12 -320 0 z" fill={C.linen} stroke={C.oatLine} strokeWidth="1" />
                {/* sage throw at foot */}
                <path d="M382 286 h88 q4 24 0 48 h-88 q-6 -24 0 -48 z" fill={C.sage} opacity="0.9" />
                <line x1="404" y1="288" x2="404" y2="332" stroke={C.sageDark} strokeWidth="1.2" opacity="0.7" />
                {/* pillows */}
                <rect x="164" y="264" width="86" height="30" rx="12" fill={C.linen} stroke={C.oatLine} strokeWidth="1.2" />
                <rect x="258" y="264" width="86" height="30" rx="12" fill={C.linen} stroke={C.oatLine} strokeWidth="1.2" />
                <rect x="196" y="276" width="52" height="22" rx="9" fill={C.clay} opacity="0.85" />
            </g>

            {/* Walnut dresser, far left */}
            <g>
                <WoodPanel x={14} y={292} w={98} h={70} tone={C.walnut} dark={C.walnutDark} grain={false} rx={3} />
                <line x1="14" y1="316" x2="112" y2="316" stroke={C.walnutDark} strokeWidth="1.4" />
                <line x1="14" y1="340" x2="112" y2="340" stroke={C.walnutDark} strokeWidth="1.4" />
                {[304, 328, 352].map((y) => (
                    <rect key={y} x="52" y={y} width="22" height="3" rx="1.5" fill={C.black} />
                ))}
            </g>

            <Plant x={580} y={392} s={0.85} />
            <SceneTag x={30} y={34} label="NO TALL HEADBOARD — CEILING READS HIGHER" />
        </g>
    );
}

/* ---------------- Bathroom ---------------- */

function BathScene() {
    return (
        <g>
            <Defs />
            <Backdrop />

            {/* Large-format greige tile, lower wall */}
            <g>
                <rect x="0" y="196" width="800" height="164" fill="#E7DFCF" />
                {[200, 400, 600].map((x) => (
                    <line key={x} x1={x} y1="196" x2={x} y2="360" stroke="#D5C9B2" strokeWidth="1.4" />
                ))}
                <line x1="0" y1="278" x2="800" y2="278" stroke="#D5C9B2" strokeWidth="1.4" />
                <line x1="0" y1="196" x2="800" y2="196" stroke="#D5C9B2" strokeWidth="1.6" />
            </g>

            {/* Shower, left: frameless glass + matte black */}
            <g>
                <rect x="26" y="60" width="230" height="300" fill="url(#glass)" opacity="0.55" />
                <line x1="256" y1="56" x2="256" y2="360" stroke={C.black} strokeWidth="4" />
                <line x1="26" y1="58" x2="256" y2="58" stroke={C.black} strokeWidth="3" />
                {/* rain head + wand */}
                <line x1="120" y1="58" x2="120" y2="86" stroke={C.black} strokeWidth="4" />
                <rect x="88" y="86" width="64" height="7" rx="3.5" fill={C.black} />
                <g stroke={C.black} strokeWidth="3.4" strokeLinecap="round">
                    <line x1="210" y1="180" x2="210" y2="230" />
                    <circle cx="210" cy="172" r="7" fill={C.black} />
                </g>
                {/* linear drain */}
                <rect x="46" y="350" width="190" height="5" rx="2.5" fill={C.black} opacity="0.6" />
            </g>

            {/* Round mirror + sconce */}
            <circle cx="520" cy="150" r="62" fill="#EFF2ED" stroke={C.oakDark} strokeWidth="3" />
            <ellipse cx="500" cy="132" rx="24" ry="34" fill="#FFFFFF" opacity="0.45" />
            <g>
                <rect x="614" y="118" width="8" height="30" rx="4" fill={C.black} />
                <circle cx="618" cy="114" r="9" fill={C.glow} opacity="0.9" />
            </g>

            {/* Floating oak vanity */}
            <g>
                <rect x="416" y="248" width="210" height="12" rx="3" fill={C.stone} stroke={C.oatLine} strokeWidth="1.2" />
                <WoodPanel x={424} y={260} w={194} h={56} rx={3} />
                <rect x="500" y="272" width="44" height="3" rx="1.5" fill={C.black} />
                {/* vessel + matte black faucet */}
                <path d="M478 248 a26 12 0 0 1 52 0 z" fill="#F6F3EA" stroke={C.oatLine} strokeWidth="1.4" />
                <g stroke={C.black} strokeWidth="4" fill="none" strokeLinecap="round">
                    <path d="M548 248 v-26 q0 -9 -11 -9 h-8 v7" />
                </g>
                {/* open floor beneath — floating */}
                <ellipse cx="520" cy="372" rx="110" ry="10" fill={C.ink} opacity="0.07" />
            </g>

            {/* Woven basket + towel */}
            <g>
                <path d="M672 318 h74 l-9 46 h-56 z" fill={C.oak} stroke={C.oakDark} strokeWidth="1.4" />
                {[328, 340, 352].map((y) => (
                    <line key={y} x1="676" y1={y} x2="742" y2={y} stroke={C.oakDark} strokeWidth="1" opacity="0.6" />
                ))}
                <path d="M686 318 q22 -14 46 0 v-8 q-24 -12 -46 0 z" fill={C.linen} stroke={C.oatLine} strokeWidth="1" />
            </g>
            <g>
                <line x1="336" y1="216" x2="396" y2="216" stroke={C.black} strokeWidth="4" strokeLinecap="round" />
                <rect x="344" y="216" width="44" height="58" rx="4" fill={C.linen} stroke={C.oatLine} strokeWidth="1.2" />
                <line x1="344" y1="236" x2="388" y2="236" stroke={C.oatLine} strokeWidth="1.2" />
            </g>

            <Plant x={770} y={392} s={0.75} />
            <SceneTag x={30} y={34} label="MINIMAL GROUT — LARGE FORMAT TILE" />
        </g>
    );
}

function SceneTag({ x, y, label }: { x: number; y: number; label: string }) {
    return (
        <g>
            <text x={x} y={y} fontSize="10" fill={C.brass} fontWeight="600" letterSpacing="2.2">
                {label}
            </text>
            <line x1={x} y1={y + 7} x2={x + label.length * 7.4} y2={y + 7} stroke={C.brass} strokeWidth="1" opacity="0.5" />
        </g>
    );
}
