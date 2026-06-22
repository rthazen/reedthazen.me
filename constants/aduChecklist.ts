export type ItemType = 'text' | 'yes_no';

export type ChecklistItem = {
    id: string;
    label: string;
    note?: string;
    type?: ItemType;
};

export type ChecklistSubsection = {
    id: string;
    title: string;
    items: ChecklistItem[];
};

export type ChecklistSection = {
    id: string;
    title: string;
    note?: string;
    subsections: ChecklistSubsection[];
};

export const aduChecklist: ChecklistSection[] = [
    {
        id: 'exterior',
        title: 'Exterior',
        subsections: [
            {
                id: 'exterior-finish',
                title: 'Exterior Finish',
                items: [
                    {
                        id: 'stucco-color',
                        label: 'Stucco color',
                        note: 'Two coats of stucco; paint matched to the existing house as closely as possible'
                    },
                    { id: 'fascia-trim-color', label: 'Fascia/trim color' },
                    {
                        id: 'roof-color',
                        label: 'Roof color/material',
                        note: 'Plywood, Sharkskin underlayment, and Owens Corning asphalt shingles — matched to the existing house roof as closely as possible'
                    },
                    { id: 'house-numbers', label: 'House numbers', note: 'Client to purchase, we can install' }
                ]
            },
            {
                id: 'exterior-lighting',
                title: 'Exterior Lighting & Utilities',
                items: [
                    { id: 'exterior-light-fixtures', label: 'Exterior light fixtures' },
                    { id: 'exterior-outlet-locations', label: 'Exterior outlet locations' },
                    { id: 'exterior-hose-bib', label: 'Exterior hose bib locations' },
                    {
                        id: 'tankless-water-heater',
                        label: 'Tankless water heater location',
                        note: 'Supplied and installed by us; $1,000 allowance'
                    },
                    {
                        id: 'utility-meter-separation',
                        label: 'Utility meter separation with LADWP/Edison',
                        note: 'If applicable',
                        type: 'yes_no'
                    }
                ]
            }
        ]
    },
    {
        id: 'doors-windows',
        title: 'Doors & Windows',
        subsections: [
            {
                id: 'windows',
                title: 'Windows',
                items: [
                    {
                        id: 'window-color',
                        label: 'Window color',
                        note: 'Black or white, within $500/window budget; black windows are typically much more expensive'
                    },
                    {
                        id: 'window-grid-style',
                        label: 'Window grid style',
                        note: 'Grids are typically more expensive, or plain glass'
                    }
                ]
            },
            {
                id: 'front-entrance-door',
                title: 'Front Entrance Door',
                items: [
                    {
                        id: 'front-door',
                        label: 'Front entrance door selection',
                        note: 'Pre-hung is best; please send us a link. Must remain within the $500 allowance'
                    }
                ]
            },
            {
                id: 'interior-doors',
                title: 'Interior Doors',
                items: [
                    { id: 'interior-room-doors', label: 'Interior room doors', note: 'Pre-hung is best; $400/door allowance' },
                    {
                        id: 'interior-closet-doors',
                        label: 'Interior closet doors',
                        note: 'Typically mirrored sliders; $400/door allowance'
                    },
                    { id: 'laundry-room-door', label: 'Laundry room door', note: 'Typically bi-fold; $400/door allowance' },
                    { id: 'interior-door-hardware-finish', label: 'Interior door hardware finish' },
                    { id: 'door-stop-style', label: 'Door stop style' }
                ]
            },
            {
                id: 'sliding-doors',
                title: 'Sliding Doors',
                items: [
                    {
                        id: 'sliding-door-style',
                        label: 'Sliding door style/design',
                        note: 'Not included in base contract — $1,800 added cost per 6 ft sliding door'
                    },
                    { id: 'sliding-door-hardware-finish', label: 'Sliding door hardware finish' }
                ]
            }
        ]
    },
    {
        id: 'kitchen',
        title: 'Kitchen',
        note: 'We will create a full 3D kitchen design before ordering materials. You may wait until the design meeting before selecting cabinets, countertops, and backsplash materials.',
        subsections: [
            {
                id: 'cabinets',
                title: 'Cabinets',
                items: [
                    {
                        id: 'cabinet-style',
                        label: 'Cabinet style',
                        note: 'Up to 20 linear feet of semi-custom / pre-fabricated cabinets included'
                    },
                    { id: 'cabinet-color', label: 'Cabinet color' },
                    { id: 'cabinet-handles', label: 'Cabinet handles' },
                    {
                        id: 'soft-close',
                        label: 'Soft-close drawers and doors',
                        note: 'Included on all cabinet doors and drawers per contract',
                        type: 'yes_no'
                    }
                ]
            },
            {
                id: 'countertops',
                title: 'Countertops',
                items: [
                    { id: 'countertop-color', label: 'Countertop color' },
                    {
                        id: 'countertop-material',
                        label: 'Countertop material',
                        note: 'Quartz or granite; quartz allowance $500/slab, up to 3 slabs'
                    },
                    { id: 'edge-profile', label: 'Edge profile' },
                    {
                        id: 'countertop-holes',
                        label: 'Number of countertop holes',
                        note: 'Soap dispenser, RO faucet, etc.'
                    }
                ]
            },
            {
                id: 'sink-faucet',
                title: 'Sink & Faucet',
                items: [
                    { id: 'kitchen-sink-style', label: 'Kitchen sink style', note: 'Owner-supplied; we install' },
                    { id: 'kitchen-sink-material', label: 'Kitchen sink material/color' },
                    { id: 'kitchen-faucet', label: 'Kitchen faucet', note: 'Owner-supplied; we install' }
                ]
            },
            {
                id: 'backsplash',
                title: 'Backsplash',
                items: [
                    { id: 'backsplash-tile', label: 'Backsplash tile', note: 'Tile allowance $5/sq ft' },
                    { id: 'backsplash-grout-color', label: 'Grout color' },
                    { id: 'backsplash-schluter-color', label: 'Schluter/trim color' }
                ]
            },
            {
                id: 'kitchen-appliances',
                title: 'Appliances',
                items: [
                    { id: 'refrigerator', label: 'Refrigerator', note: 'Owner-supplied; we install' },
                    { id: 'range-stove', label: 'Range/stove', note: 'Owner-supplied; we install' },
                    { id: 'oven', label: 'Oven', note: 'Owner-supplied; we install' },
                    { id: 'microwave', label: 'Microwave', note: 'Owner-supplied; we install' },
                    { id: 'hood', label: 'Hood', note: 'Owner-supplied; we install' },
                    { id: 'dishwasher', label: 'Dishwasher', note: 'Owner-supplied; we install' },
                    { id: 'garbage-disposal', label: 'Garbage disposal', note: 'Owner-supplied; we install', type: 'yes_no' }
                ]
            },
            {
                id: 'kitchen-lighting',
                title: 'Lighting',
                items: [
                    {
                        id: 'under-cabinet-lighting',
                        label: 'Under-cabinet lighting',
                        note: 'Optional, additional $750',
                        type: 'yes_no'
                    }
                ]
            }
        ]
    },
    {
        id: 'bathroom',
        title: 'Bathroom',
        subsections: [
            {
                id: 'vanity',
                title: 'Vanity Area',
                items: [
                    { id: 'vanity', label: 'Vanity', note: 'Owner-supplied (Wayfair recommended); we install' },
                    { id: 'mirror', label: 'Mirror', note: 'Owner-supplied; we install' },
                    { id: 'bathroom-faucet', label: 'Faucet', note: 'Owner-supplied; we install' },
                    { id: 'bathroom-sink', label: 'Sink', note: 'Owner-supplied; we install' }
                ]
            },
            {
                id: 'toilet',
                title: 'Toilet',
                items: [{ id: 'toilet-selection', label: 'Toilet selection', note: 'Owner-supplied; we install' }]
            },
            {
                id: 'shower',
                title: 'Shower',
                items: [
                    { id: 'shower-wall-tile', label: 'Shower wall tile', note: 'Tile allowance $5/sq ft' },
                    { id: 'shower-floor-tile', label: 'Shower floor tile', note: 'Tile allowance $5/sq ft' },
                    { id: 'shower-niche-tile', label: 'Shower niche tile', note: 'Tile allowance $5/sq ft' },
                    { id: 'niche-size', label: 'Niche size' },
                    { id: 'niche-location', label: 'Niche location' },
                    { id: 'shower-bench', label: 'Shower bench', note: 'If desired', type: 'yes_no' },
                    { id: 'shower-head', label: 'Shower head' },
                    { id: 'shower-valve-trim', label: 'Shower valve/trim' },
                    {
                        id: 'shower-glass-door-style',
                        label: 'Shower glass door style',
                        note: 'We will finalize the design with the glass company during field measurements. $1,000 allowance (prefabricated)'
                    },
                    { id: 'shower-glass-hardware-finish', label: 'Shower glass hardware finish' },
                    { id: 'shower-door-swing', label: 'Shower door swing direction' }
                ]
            },
            {
                id: 'bathroom-flooring',
                title: 'Bathroom Flooring',
                items: [
                    { id: 'bathroom-floor-tile', label: 'Bathroom floor tile or vinyl', note: 'Tile allowance $5/sq ft; SPC vinyl is the lower-cost option' },
                    { id: 'bathroom-grout-color', label: 'Grout color' },
                    { id: 'bathroom-schluter-edge-color', label: 'Schluter edge color' }
                ]
            },
            {
                id: 'bathroom-accessories',
                title: 'Accessories',
                items: [
                    { id: 'towel-bars', label: 'Towel bars', note: 'Owner-supplied; we install' },
                    { id: 'towel-rings', label: 'Towel rings', note: 'Owner-supplied; we install' },
                    { id: 'robe-hooks', label: 'Robe hooks', note: 'Owner-supplied; we install' },
                    { id: 'toilet-paper-holder', label: 'Toilet paper holder', note: 'Owner-supplied; we install' }
                ]
            }
        ]
    },
    {
        id: 'flooring-trim',
        title: 'Flooring & Trim',
        subsections: [
            {
                id: 'flooring',
                title: 'Flooring',
                items: [
                    { id: 'flooring-material', label: 'Flooring material', note: 'Typically SPC vinyl; $4/sq ft allowance' },
                    { id: 'flooring-color', label: 'Flooring color/style' },
                    { id: 'flooring-direction', label: 'Flooring direction/layout' },
                    {
                        id: 'flooring-selection',
                        label: 'Flooring selection',
                        note: 'Must remain within the $4/sq ft contract allowance'
                    }
                ]
            },
            {
                id: 'trim',
                title: 'Trim',
                items: [
                    { id: 'base-molding-style', label: 'Base molding style', note: 'Baseboard molding allowance $2/sq ft' },
                    { id: 'base-molding-color', label: 'Base molding color' }
                ]
            }
        ]
    },
    {
        id: 'paint',
        title: 'Paint',
        subsections: [
            {
                id: 'interior-paint',
                title: 'Interior Paint',
                items: [
                    { id: 'wall-color', label: 'Wall color' },
                    { id: 'ceiling-color', label: 'Ceiling color', note: 'If different from walls' },
                    { id: 'trim-paint-color', label: 'Trim color' },
                    {
                        id: 'paint-sheen',
                        label: 'Paint sheen',
                        note: 'Flat, eggshell, satin, or semi-gloss'
                    }
                ]
            }
        ]
    },
    {
        id: 'electrical',
        title: 'Electrical',
        subsections: [
            {
                id: 'electrical-lighting',
                title: 'Lighting',
                items: [
                    {
                        id: 'recessed-light-locations',
                        label: 'Recessed light locations',
                        note: 'We will typically select locations based on standard ADU layouts we have successfully completed'
                    }
                ]
            },
            {
                id: 'electrical-fixtures',
                title: 'Fixtures',
                items: [
                    {
                        id: 'decorative-light-fixtures',
                        label: 'Decorative light fixtures',
                        note: 'Client may purchase and we can install'
                    },
                    {
                        id: 'pendant-lights',
                        label: 'Pendant lights',
                        note: 'Client may purchase and we can install'
                    }
                ]
            },
            {
                id: 'power-devices',
                title: 'Power & Devices',
                items: [
                    { id: 'additional-outlet-locations', label: 'Additional outlet locations' },
                    { id: 'tv-locations', label: 'TV locations' },
                    { id: 'internet-data-jack-locations', label: 'Internet/data jack locations' },
                    { id: 'usb-outlets', label: 'USB outlets', note: 'If desired', type: 'yes_no' }
                ]
            }
        ]
    },
    {
        id: 'hvac',
        title: 'HVAC',
        subsections: [
            {
                id: 'mini-split',
                title: 'Mini Split System',
                items: [
                    { id: 'indoor-head-locations', label: 'Indoor head locations', note: '1–2 mini-split units included; $1,000/unit allowance' },
                    { id: 'outdoor-condenser-location', label: 'Outdoor condenser location' },
                    { id: 'thermostat-location', label: 'Thermostat/control location' }
                ]
            }
        ]
    },
    {
        id: 'laundry',
        title: 'Laundry',
        subsections: [
            {
                id: 'laundry-appliances',
                title: 'Appliances',
                items: [
                    { id: 'washer', label: 'Washer', note: 'Owner-supplied; we install' },
                    { id: 'dryer', label: 'Dryer', note: 'Owner-supplied; we install' },
                    {
                        id: 'laundry-configuration',
                        label: 'Configuration',
                        note: 'Stacked or side-by-side'
                    }
                ]
            }
        ]
    },
    {
        id: 'closets-storage',
        title: 'Closets & Storage',
        note: 'We will provide one hanging rod and one shelf across each closet unless otherwise requested.',
        subsections: [
            {
                id: 'closets',
                title: 'Closets',
                items: [
                    {
                        id: 'closet-customization',
                        label: 'Closet customization requests',
                        note: 'Any requests beyond standard one hanging rod and one shelf'
                    }
                ]
            }
        ]
    },
    {
        id: 'plumbing',
        title: 'Plumbing',
        subsections: [
            {
                id: 'plumbing-water',
                title: 'Water',
                items: [
                    {
                        id: 'refrigerator-water-line',
                        label: 'Refrigerator water line',
                        type: 'yes_no'
                    }
                ]
            }
        ]
    },
    {
        id: 'final-design',
        title: 'Final Design Decisions',
        subsections: [
            {
                id: 'general-final',
                title: 'General',
                items: [
                    {
                        id: 'appliance-finish-color',
                        label: 'Appliance finish color',
                        note: 'Stainless steel, black, white, panel-ready, etc.'
                    },
                    {
                        id: 'plumbing-fixture-finish',
                        label: 'Plumbing fixture finish throughout home',
                        note: 'Chrome, brushed nickel, matte black, brass, etc.'
                    },
                    { id: 'door-hardware-finish-final', label: 'Door hardware finish throughout home' },
                    { id: 'cabinet-hardware-finish-final', label: 'Cabinet hardware finish throughout home' }
                ]
            }
        ]
    }
];

// ─── Editable-structure helpers ─────────────────────────────────────────────────
// The checklist structure (sections/groups/items/labels/notes) is editable and
// stored in the saved document. These build the default/legacy structure and are
// shared by the API (server-side migration) and the component (client fallback).

type LegacyCustomItem = { id: string; label: string; type?: ItemType };

export function defaultStructure(): ChecklistSection[] {
    return JSON.parse(JSON.stringify(aduChecklist));
}

// Build an editable structure from an older document that only stored selection
// data: fold its custom items into their groups and drop any hidden built-ins.
export function buildStructureFromLegacy(
    customItems?: Record<string, LegacyCustomItem[]>,
    removedItems?: string[]
): ChecklistSection[] {
    const removed = new Set(removedItems ?? []);
    return defaultStructure().map((section) => ({
        ...section,
        subsections: section.subsections.map((sub) => {
            const base = sub.items.filter((it) => !removed.has(it.id));
            const extra = (customItems?.[sub.id] ?? []).map((it) => ({ id: it.id, label: it.label, type: it.type }));
            return { ...sub, items: [...base, ...extra] };
        })
    }));
}
