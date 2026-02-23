// src/lib/formationIcons.ts
export type FormationItem = {
  id: string;
  echelon: "x" | "xx";
  label: string;
  svg: string;
  iconSize?: number;
};

const BOX = (inner: string) => `
<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
  <rect x="14" y="18" width="92" height="60" rx="0" fill="#85e6ff" stroke="#111827" stroke-width="4"/>
  ${inner}
</svg>`;

const TXT = (t: string) => `
<text x="60" y="58" text-anchor="middle" font-size="22" font-weight="900" fill="#111827">${t}</text>`;

export const FORMATION_GROUPS: Record<string, FormationItem[]> = {
  "Combat Units": [
    { id: "CBT", echelon: "xx", label: "CBT", svg: BOX(TXT("CBT")), iconSize: 0.9 },
    { id: "ARC", echelon: "x", label: "ARC", svg: BOX(`<path d="M26 60 C 42 40, 78 40, 94 60" fill="none" stroke="#111827" stroke-width="3"/>`) },
    { id: "BOWTIE", echelon: "x", label: "BOWTIE", svg: BOX(`<path d="M38 50 L56 40 L56 60 Z" fill="#111827"/><path d="M82 50 L64 40 L64 60 Z" fill="#111827"/>`) },
    { id: "XBOX", echelon: "x", label: "X", svg: BOX(`<path d="M30 30 L90 78" stroke="#111827" stroke-width="3"/><path d="M90 30 L30 78" stroke="#111827" stroke-width="3"/>`) },
    { id: "TRI", echelon: "x", label: "TRI", svg: BOX(`<path d="M28 32 L92 78" stroke="#111827" stroke-width="3"/><path d="M60 66 L72 78 L48 78 Z" fill="#111827"/>`) },

    { id: "CAPSULE", echelon: "x", label: "CAPSULE", svg: BOX(`<rect x="34" y="44" width="52" height="18" rx="9" fill="none" stroke="#111827" stroke-width="3"/>`) },
    { id: "DOT", echelon: "x", label: "DOT", svg: BOX(`<circle cx="60" cy="54" r="5" fill="#111827"/>`) },
    { id: "U", echelon: "x", label: "U", svg: BOX(`<path d="M46 44 V64 C46 72 74 72 74 64 V44" fill="none" stroke="#111827" stroke-width="3"/>`) },
    { id: "SLASH", echelon: "x", label: "SLASH", svg: BOX(`<path d="M30 76 L90 32" stroke="#111827" stroke-width="3"/>`) },
    { id: "GATE", echelon: "x", label: "GATE", svg: BOX(`<path d="M50 76 V50 C50 42 70 42 70 50 V76" fill="none" stroke="#111827" stroke-width="3"/>`) },

    { id: "SEC", echelon: "x", label: "SEC", svg: BOX(TXT("SEC")), iconSize: 0.9 },
  ],

  "Combat Support Units": [
    { id: "CS", echelon: "xx", label: "CS", svg: BOX(TXT("CS")), iconSize: 0.9 },
    { id: "BRANCH", echelon: "x", label: "BRANCH", svg: BOX(`<circle cx="45" cy="50" r="4" fill="#111827"/><circle cx="75" cy="50" r="4" fill="#111827"/><path d="M45 50 C55 40,65 40,75 50" fill="none" stroke="#111827" stroke-width="3"/>`) },
    { id: "MI", echelon: "x", label: "MI", svg: BOX(TXT("MI")), iconSize: 0.9 },
    { id: "MP", echelon: "x", label: "MP", svg: BOX(`<path d="M60 34 C52 34 44 32 40 30 V48 C40 64 50 74 60 78 C70 74 80 64 80 48 V30 C76 32 68 34 60 34 Z" fill="none" stroke="#111827" stroke-width="3"/><text x="60" y="58" text-anchor="middle" font-size="18" font-weight="900" fill="#111827">MP</text>`) },
    { id: "ZIGZAG", echelon: "x", label: "ZIGZAG", svg: BOX(`<path d="M34 44 L56 56 L44 66 L86 48" fill="none" stroke="#111827" stroke-width="3"/>`) },
    { id: "IW", echelon: "x", label: "IW", svg: BOX(TXT("IW")), iconSize: 0.9 },
    { id: "LS", echelon: "x", label: "LS", svg: BOX(`<path d="M30 62 C38 54,46 70,54 62 C62 54,70 70,78 62 C86 54,94 70,102 62" fill="none" stroke="#111827" stroke-width="3"/><text x="60" y="50" text-anchor="middle" font-size="14" font-weight="900" fill="#111827">LS</text>`) },
    { id: "EOD", echelon: "x", label: "EOD", svg: BOX(TXT("EOD")), iconSize: 0.9 },
  ],

  "Combat Service Support Units": [
    { id: "CSS", echelon: "xx", label: "CSS", svg: BOX(TXT("CSS")), iconSize: 0.9 },
    { id: "ADM", echelon: "x", label: "ADM", svg: BOX(TXT("ADM")), iconSize: 0.9 },
    { id: "GRID", echelon: "x", label: "GRID", svg: BOX(`<path d="M60 18 V78" stroke="#111827" stroke-width="3"/><path d="M14 48 H106" stroke="#111827" stroke-width="3"/>`) },
    { id: "HLINE", echelon: "x", label: "HLINE", svg: BOX(`<path d="M14 56 H106" stroke="#111827" stroke-width="3"/>`) },
    { id: "WHEEL", echelon: "x", label: "WHEEL", svg: BOX(`<circle cx="60" cy="52" r="16" fill="none" stroke="#111827" stroke-width="3"/><path d="M60 36 V68" stroke="#111827" stroke-width="2"/><path d="M44 52 H76" stroke="#111827" stroke-width="2"/><path d="M49 41 L71 63" stroke="#111827" stroke-width="2"/><path d="M71 41 L49 63" stroke="#111827" stroke-width="2"/>`) },
  ],

  "Command and Control": [
    { id: "C2HQ", echelon: "x", label: "C2 HQ", svg: BOX(TXT("C2 HQ")), iconSize: 0.85 },
  ],
};