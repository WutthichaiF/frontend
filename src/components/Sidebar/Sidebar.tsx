"use client";

import React, { useMemo, useState } from "react";
import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";
import { sidcToSvg } from "@/lib/milsymbol";
import {
  MdAir,
  MdAltRoute,
  MdConstruction,
  MdFavoriteBorder,
  MdGroups,
  MdPlace,
} from "react-icons/md";
import { FORMATION_GROUPS, FormationItem } from "../../lib/formations";
import { EQUIPMENT_GROUPS } from "../../lib/equipmentIcons";
import { title } from "process";
type TopTab = "gallery" | "search";
type CategoryTab =
  | "favorites"
  | "formations"
  | "equipment"
  | "tactical"
  | "functionSpecific"
  | "metoc";

type SectionKey =
  | "tasks"
  | "commando"
  | "sector"
  | "coordination"
  | "baseDeploy"
  | "defensive"
  | "offensive"
  | "mines"
  | "tactical3d"
  | "passages"
  | "areal"
  | "capabilities";

const SECTION_LABEL: Record<SectionKey, string> = {
  tasks: "Tasks",
  commando: "Commando Points",
  sector: "Sector Boundaries",
  coordination: "Lines of Coordination",
  baseDeploy: "Base Deployments",
  defensive: "Defensive Lines",
  offensive: "Offensive Lines",
  mines: "Mines and Obstacles",
  tactical3d: "Tactical Graphics with Volume (3D)",
  passages: "Passages",
  areal: "Areal Symbols",
  capabilities: "Capabilities, Range",
};

/** ===== Non-tactical headings (ตามรูป) ===== */
const FAVORITES_HEADINGS = [
  "Favorite Symbols (1-Point)",
  "Favorite Tactical Graphics",
  "Recent used Symbols (1-Point)",
  "Recent used Tactical Graphics",
] as const;

const FORMATIONS_HEADINGS = [
  "Unit Symbols (empty)",
  "Large Formations, Command and Control",
  "Infantry, Tanks and Artillery",
  "Aviation and Ground Based Air Defense",
  "Engineer",
  "Command, Transmission and EW",
  "Logistics and Medical",
  "Special Forces",
] as const;

const EQUIPMENT_HEADINGS = [
  "Installations",
  "Weapons",
  "Aircraft",
  "Drone (RPV / UAV)",
  "Ground Vehicle",
  "Sea Surface (Ships)",
  "Subservice (Submarines)",
] as const;

const FUNCTION_HEADINGS = [
  "Generic Graphics",
  "Symbol with Emoji Support",
  "Emergency Management Symbols (EMS)",
  "Stability Operations (SO)",
  "Mine Warfare (Bottom Descriptors)",
] as const;

const METOC_HEADINGS = [
  "Atmosphere",
  "Weather Symbols",
  "Wind",
  "Lines",
  "Oceanic",
  "Geophysics/Acoustics",
  "State of the Ground",
] as const;

/** ===== Tactical content ที่มีอยู่แล้ว ===== */
const BASE_DEPLOY_SYMBOLS = [
  { label: "PBX", sidc: "GFPGOAP--------" },
  { label: "ATK", sidc: "GFPGOAK--------" },
  { label: "OBJ", sidc: "GFPGOAO--------" },
  { label: "AA", sidc: "GFGPGAA--------" },
  { label: "ASLT", sidc: "GFPGPOAA--------" },
];

const TASKS = [
  {
    id: "WP" as const,
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M52 35 L152 35" fill="none" stroke="#2f7fff" stroke-width="5"/>
      <path d="M52 35 L66 27" fill="none" stroke="#2f7fff" stroke-width="5"/>
      <path d="M52 35 L66 43" fill="none" stroke="#2f7fff" stroke-width="5"/>
      <path d="M152 35 C 188 35, 190 10, 166 10 C 148 10, 148 26, 152 35" fill="none" stroke="#2f7fff" stroke-width="5"/>
      <circle cx="52" cy="35" r="4.2" fill="#ff3b30" stroke="#fff" stroke-width="2"/>
      <circle cx="152" cy="35" r="4.2" fill="#ff3b30" stroke="#fff" stroke-width="2"/>
      <circle cx="166" cy="10" r="4.2" fill="#ff3b30" stroke="#fff" stroke-width="2"/>
      <text x="110" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#2f7fff">WP</text>
    </svg>`,
  },
  {
    id: "R" as const,
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M52 35 L152 35" fill="none" stroke="#7a1b6d" stroke-width="5"/>
      <path d="M52 35 L66 27" fill="none" stroke="#7a1b6d" stroke-width="5"/>
      <path d="M52 35 L66 43" fill="none" stroke="#7a1b6d" stroke-width="5"/>
      <path d="M152 35 C 188 35, 190 10, 166 10 C 148 10, 148 26, 152 35" fill="none" stroke="#7a1b6d" stroke-width="5"/>
      <circle cx="52" cy="35" r="4.2" fill="#ff3b30" stroke="#fff" stroke-width="2"/>
      <circle cx="152" cy="35" r="4.2" fill="#ff3b30" stroke="#fff" stroke-width="2"/>
      <circle cx="166" cy="10" r="4.2" fill="#ff3b30" stroke="#fff" stroke-width="2"/>
      <text x="110" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#7a1b6d">R</text>
    </svg>`,
  },
  {
    id: "CATK" as const,
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M40 35 L150 35" stroke="#7a1b6d" stroke-width="5" stroke-dasharray="9 6" stroke-linecap="round"/>
      <path d="M150 35 L138 27" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      <path d="M150 35 L138 43" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      <text x="78" y="29" font-size="16" font-weight="800" fill="#7a1b6d">CATK</text>
    </svg>`,
  },
];

const DEFENSIVE = [
  {
    id: "xline" as const,
    label: "XXXXXX",
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M30 35 L190 35" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      ${Array.from({ length: 8 })
        .map((_, i) => {
          const x = 45 + i * 18;
          return `<path d="M${x - 6} 28 L${x + 6} 42" stroke="#7a1b6d" stroke-width="4"/>
                <path d="M${x - 6} 42 L${x + 6} 28" stroke="#7a1b6d" stroke-width="4"/>`;
        })
        .join("")}
    </svg>`,
  },
  {
    id: "trench" as const,
    label: "Trench",
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M30 35 L190 35" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      ${Array.from({ length: 9 })
        .map((_, i) => {
          const x = 45 + i * 18;
          return `<path d="M${x} 20 L${x} 32" stroke="#7a1b6d" stroke-width="4"/>`;
        })
        .join("")}
    </svg>`,
  },
  {
    id: "teeth" as const,
    label: "Teeth",
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M30 40 L190 40" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      ${Array.from({ length: 9 })
        .map((_, i) => {
          const x = 42 + i * 18;
          return `<path d="M${x} 40 L${x + 9} 25 L${x + 18} 40 Z" fill="#7a1b6d"/>`;
        })
        .join("")}
    </svg>`,
  },
  {
    id: "arc" as const,
    label: "Arc",
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M40 48 C 90 10, 140 10, 190 48" fill="none" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
    </svg>`,
  },
];

const COMMANDO_POINTS = [
  {
    id: "cmd-square-pole",
    label: "Square",
    thumbSvg: `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="46" y="14" width="28" height="28" fill="none" stroke="#2f7fff" stroke-width="3"/>
      <path d="M60 42 L60 78" stroke="#2f7fff" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "cmd-circle-x",
    label: "CircleX",
    thumbSvg: `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="42" r="22" fill="none" stroke="#2f7fff" stroke-width="3"/>
      <path d="M46 28 L74 56" stroke="#2f7fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M74 28 L46 56" stroke="#2f7fff" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "cmd-star",
    label: "Star",
    thumbSvg: `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 18 L67 34 L85 34 L70 45 L76 62 L60 52 L44 62 L50 45 L35 34 L53 34 Z"
        fill="none" stroke="#2f7fff" stroke-width="3" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: "cmd-x",
    label: "X",
    thumbSvg: `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 22 L80 62" stroke="#2f7fff" stroke-width="4" stroke-linecap="round"/>
      <path d="M80 22 L40 62" stroke="#2f7fff" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  ...(["CKP", "PP", "RLY", "RP", "SP", "AMN"] as const).map((txt) => ({
    id: `cmd-${txt}`,
    label: txt,
    thumbSvg: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M38 12 H82 V55 L60 86 L38 55 Z" fill="#8fe3ff" stroke="#111827" stroke-width="2" />
      <rect x="42" y="18" width="36" height="22" fill="#8fe3ff" stroke="#111827" stroke-width="2"/>
      <text x="60" y="34" text-anchor="middle" font-size="14" font-weight="800" fill="#111827">${txt}</text>
    </svg>`,
  })),
];
const LARGE_FORMATIONS = {
  combatUnits: [
    { id: "cbt", top: "xx", label: "CBT", inner: "dot" },
    { id: "arc", top: "x", label: "", inner: "arc" },
    { id: "bow", top: "x", label: "", inner: "bowtie" },
    { id: "boxx", top: "x", label: "", inner: "x" },
    { id: "tri", top: "x", label: "", inner: "tri" },
    { id: "oval", top: "x", label: "", inner: "oval" },
    { id: "dot", top: "x", label: "", inner: "dot" },
    { id: "gate", top: "x", label: "", inner: "gate" },
    { id: "diag", top: "x", label: "", inner: "diag" },
    { id: "arch2", top: "x", label: "", inner: "arc" },
    { id: "sec", top: "x", label: "SEC", inner: "dot" },
  ],
  combatSupport: [
    { id: "cs", top: "xx", label: "CS", inner: "dot" },
    { id: "mi", top: "x", label: "MI", inner: "dot" },
    { id: "mp", top: "x", label: "", inner: "shieldMp" },
    { id: "iw", top: "x", label: "IW", inner: "dot" },
    { id: "ls", top: "x", label: "LS", inner: "waveLs" },
    { id: "eod", top: "x", label: "EOD", inner: "dot" },
  ],
  serviceSupport: [
    { id: "css", top: "xx", label: "CSS", inner: "dot" },
    { id: "adm", top: "x", label: "ADM", inner: "dot" },
    { id: "grid", top: "x", label: "", inner: "gate" },
    { id: "bar", top: "x", label: "", inner: "diag" },
    { id: "wheel", top: "x", label: "", inner: "wheel" },
  ],
  c2: [{ id: "c2hq", top: "x", label: "C2 HQ", inner: "dot" }],
} as const;

function IconTab({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[11px]",
        active ? "bg-sky-500/20 text-sky-700" : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
      title={label}
      type="button"
    >
      <div className="text-lg leading-none">{icon}</div>
      <div className="leading-none">{label}</div>
    </button>
  );
}

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50"
        type="button"
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        <span className="text-xl leading-none text-gray-700">{open ? "▾" : "▸"}</span>
      </button>
      {open ? <div className="px-3 pb-3">{children}</div> : null}
    </div>
  );
}

/** ✅ สัญลักษณ์ Formations ตามรูป */
function FormationUnitPicker() {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  const unknownSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="44" fill="#85e6ff" stroke="#111827" stroke-width="4"/>
    <text x="60" y="78" text-anchor="middle" font-size="64" font-weight="900" fill="#111827">?</text>
  </svg>`;

  const emptySvg = `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="18" width="124" height="74" fill="#85e6ff" stroke="#111827" stroke-width="6"/>
  </svg>`;

  const activeVar =
    tool.kind === "place_formation_unit" ? tool.iconId : null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() =>
          setTool({
            kind: "place_formation_unit",
            iconId: "unit-unknown",
            svg: "",
            iconSize: 0.9,
          })
        }
        className={[
          "rounded-xl border p-3 transition hover:bg-gray-50",
          activeVar === "unknown"
            ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
            : "border-gray-300",
        ].join(" ")}
      >
        <div className="text-[12px] font-medium text-gray-700 text-center leading-tight">
          Unknown Warfighting Symbol
        </div>

        <div
          className="mt-2 flex justify-center h-[90px]"
          dangerouslySetInnerHTML={{ __html: unknownSvg }}
        />
      </button>

      <button
        type="button"
        onClick={() => setTool({ kind: "place_formation_unit", iconId: "unit-empty", svg: "", iconSize: 0.9 })}
        className={[
          "rounded-xl border p-3 transition hover:bg-gray-50",
          activeVar === "empty"
            ? "border-sky-500 bg-sky-50 ring-2 ring-sky-200"
            : "border-gray-300",
        ].join(" ")}
      >
        <div className="text-[12px] font-medium text-gray-700 text-center leading-tight">
          Unit Symbol (empty)
        </div>

        <div
          className="mt-2 flex justify-center h-[80px]"
          dangerouslySetInnerHTML={{ __html: emptySvg }}
        />
      </button>

      <div className="col-span-2 text-[11px] text-gray-500 pt-1">
        • เลือกสัญลักษณ์ แล้วคลิกบนแผนที่เพื่อวาง
      </div>
    </div>
  );
}

function HeadingList({
  headings,
  renderByTitle,
}: {
  headings: readonly string[];
  renderByTitle?: Record<string, React.ReactNode>;
}) {
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set([headings[0] ?? ""]));

  const toggle = (h: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h);
      else next.add(h);
      return next;
    });
  };

  return (
    <>
      {headings.map((h) => (
        <AccordionSection
          key={h}
          title={h}
          open={openSet.has(h)}
          onToggle={() => toggle(h)}
        >
          {renderByTitle?.[h] ?? (
            <div className="text-xs text-gray-500">(ยังไม่มี content ในหัวข้อนี้)</div>
          )}
        </AccordionSection>
      ))}
    </>
  );
}

type FormationGridProps = {
  title: string;
  items: FormationItem[];
};

function FormationGrid({ title, items }: FormationGridProps) {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  const activeId = tool.kind === "place_formation_unit" ? tool.iconId : null;

  return (
    <div className="mb-4">
      <div className="mb-2 text-sm font-medium text-gray-900">{title}</div>

      <div className="grid grid-cols-5 gap-3">
        {items.map((it) => {
          const active = activeId === it.id;

          return (
            <button
              key={it.id}
              type="button"
              onClick={() =>
                setTool({
                  kind: "place_formation_unit",
                  iconId: it.id,
                  svg: it.svg ?? "",
                  thumb: it.thumb,
                  iconSize: it.iconSize ?? 1,
                })
              }
              className={[
                active ? "border-sky-500 ring-2 ring-sky-200" : "border-gray-300",
              ].join(" ")}
            >
              <div className="mt-1 flex items-center justify-center">
                {it.thumb ? (
                  <img
                    src={it.thumb}
                    alt={it.id}
                    className="h-96px] w-[96px] object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="scale-125" dangerouslySetInnerHTML={{ __html: it.svg ?? "" }} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EquipmentGrid({ items, canRotate = true }: { items: any[]; canRotate?: boolean }) {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  const activeId = tool.kind === "place_equipment_symbol" ? (tool as any).iconId : null;

  return (
    <div className="mb-4">
      <div className="grid grid-cols-5 gap-3">
        {items.map((it) => {
          const active = activeId === it.id;

          return (
            <button
              key={it.id}
              type="button"
              onClick={() =>
                setTool({
                  kind: "place_equipment_symbol",
                  iconId: it.id,
                  thumb: it.thumb,
                  svg: it.svg ?? "",
                  iconSize: it.iconSize ?? 1.6,
                  canRotate: it.canRotate ?? canRotate,
                } as any)
              }
              className={[
                active ? "border-sky-500 ring-2 ring-sky-200" : "border-gray-300",
              ].join(" ")}
            >
              <div className="mt-1 flex items-center justify-center">
                <img
                  src={it.thumb}
                  alt={it.id}
                  className="h-[96px] w-[96px] object-contain"
                  draggable={false}
                />
              </div>
              <div className="scale-125" dangerouslySetInnerHTML={{ __html: it.svg ?? "" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  const clear = useFeatureStore((s) => s.clear);
  const count = useFeatureStore((s) => s.tac.features.length);

  const [topTab, setTopTab] = useState<TopTab>("gallery");
  const [catTab, setCatTab] = useState<CategoryTab>("tactical");
  const [openSection, setOpenSection] = useState<SectionKey | null>("tasks");

  const sections = useMemo(
    () =>
      [
        "tasks",
        "commando",
        "sector",
        "coordination",
        "baseDeploy",
        "defensive",
        "offensive",
        "mines",
        "tactical3d",
        "passages",
        "areal",
        "capabilities",
      ] as SectionKey[],
    []
  );

  return (
    <div className="flex h-full flex-col bg-white text-gray-900">
      {/* top tabs */}
      <div className="flex items-center gap-2 border-b p-2">
        <button
          onClick={() => setTopTab("gallery")}
          className={[
            "flex-1 rounded px-3 py-2 text-sm font-semibold",
            topTab === "gallery"
              ? "bg-sky-400/30 text-sky-900"
              : "hover:bg-gray-100 text-gray-700",
          ].join(" ")}
          type="button"
        >
          Symbol Gallery
        </button>
        <button
          onClick={() => setTopTab("search")}
          className={[
            "flex-1 rounded px-3 py-2 text-sm font-semibold",
            topTab === "search"
              ? "bg-sky-400/30 text-sky-900"
              : "hover:bg-gray-100 text-gray-700",
          ].join(" ")}
          type="button"
        >
          MSS Symbol Search
        </button>
      </div>

      {/* category icon tabs */}
      <div className="grid grid-cols-6 gap-1 border-b p-2">
        <IconTab active={catTab === "favorites"} label="My Favorites" icon={<MdFavoriteBorder />} onClick={() => setCatTab("favorites")} />
        <IconTab active={catTab === "formations"} label="Formations" icon={<MdGroups />} onClick={() => setCatTab("formations")} />
        <IconTab active={catTab === "equipment"} label="Equipment" icon={<MdConstruction />} onClick={() => setCatTab("equipment")} />
        <IconTab active={catTab === "tactical"} label="Tactical" icon={<MdAltRoute />} onClick={() => setCatTab("tactical")} />
        <IconTab active={catTab === "functionSpecific"} label="Function" icon={<MdPlace />} onClick={() => setCatTab("functionSpecific")} />
        <IconTab active={catTab === "metoc"} label="Metoc" icon={<MdAir />} onClick={() => setCatTab("metoc")} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {topTab === "search" ? (
          <div className="p-3">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <input className="mt-2 w-full rounded border px-3 py-2 text-sm" placeholder="Search symbol..." />
            <div className="mt-3 text-xs text-gray-500">(เดี๋ยวค่อยต่อค้นหา SIDC/ชื่อสัญลักษณ์)</div>
          </div>
        ) : (
          <>
            {catTab === "favorites" ? <HeadingList headings={FAVORITES_HEADINGS} /> : null}

            {catTab === "formations" ? (
              <HeadingList
                headings={FORMATIONS_HEADINGS}
                renderByTitle={{
                  "Unit Symbols (empty)": <FormationUnitPicker />,
                  "Large Formations, Command and Control": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Combat Support Units</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Combat Support Units"]} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Combat Service Support Units</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Combat Service Support Units"]} />
                      </div>
                      <div className="border-t pt-1"><div className="mb-2 text-[14px] font-medium text-gray-900">Command and Control</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Command and Control"]} />
                      </div>
                    </div>
                  ),
                  "Infantry, Tanks and Artillery": (
                    <div className="space-y-1">
                      <div>
                        <div>
                          <div className="mb-2 text-[14px] font-medium text-gray-900">Infantry</div>
                          <FormationGrid title="" items={FORMATION_GROUPS["Infantry"]} />
                        </div>
                        <div className="border-t pt-1">
                          <div className="mb-2 text-[14px] font-medium text-gray-900">Armored / Tracked</div>
                          <FormationGrid title="" items={FORMATION_GROUPS["Armored / Tracked"]} />
                        </div>
                        <div className="border-t pt-1">
                          <div className="mb-2 text-[14px] font-medium text-gray-900">Artillery</div>
                          <FormationGrid title="" items={FORMATION_GROUPS["Artillery"]} />
                        </div>
                      </div>
                    </div>
                  ),
                  "Aviation and Ground Based Air Defense": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Aviation</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Aviation"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Unmanned Aerial Vehicle (UAV)</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["UAV"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Air Base Unit</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Air_base"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Ground Based Air Defense (GBAD)</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["GBAD"] ?? []} />
                      </div>
                    </div>
                  ),
                  "Engineer": (
                    <div className="space-y-1">
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Combat</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Combat Engineer"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Construction </div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Construction"] ?? []} />
                      </div>
                    </div>
                  ),
                  "Command, Transmission and EW": (
                    <div className="space-y-1">
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Command Support </div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Command Support"] ?? []} />
                      </div>
                      <div className=" border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Transmission</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Transmission"] ?? []} />
                      </div>
                      <div className="border-t pt-1"></div>
                      <div className="mb-2 text-[14px] font-medium text-gray-900">Command, Transmission and EW </div>
                      <FormationGrid title="" items={FORMATION_GROUPS["Command, Transmission and EW"] ?? []} />
                    </div>
                  ),
                  "Logistics and Medical": (
                    <div className="space-y-1">
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Logistics</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Logistics"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Transportation</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Transportation"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Maintenance</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Maintenance"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Medical</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Medical"] ?? []} />
                      </div>
                    </div>
                  ),
                  "Special Forces": (
                    <div className="space-y-1">
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Military Security</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Military Security"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">NBC Defense (Nuclear-Biological-Chemical)</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["NBC Defense"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Special Forces</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Special Forces"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Military Justice</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Military Justice"] ?? []} />
                      </div>
                    </div>
                  ),
                }}
              />
            ) : null}

            {catTab === "equipment" ? (
              <HeadingList
                headings={EQUIPMENT_HEADINGS}
                renderByTitle={{
                  "Installations": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Installation</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Installation"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Raw Material Production / Storage</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Raw Material Production / Storage"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Processing Facility</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Processing Facility"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Service, Research, Utility Facility</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Service, Research, Utility Facility"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Military Materiel Facility</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Military Materiel Facility"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Actions Points</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Actions Points"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Post</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Post"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Medical and Supply Points </div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Medical and Supply Points"] ?? []} />
                      </div>
                    </div>
                  ),
                  "Weapons": (
                    <div className="space-y-1">
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Fire Weapons and Artillery</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Fire Weapons and Artillery"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Antitank</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Antitank"] ?? []} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Air Defense</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Air Defense"] ?? []} />
                      </div>
                    </div>
                  ),
                  
                }}
              />
            ) : null}

            {catTab === "functionSpecific" ? <HeadingList headings={FUNCTION_HEADINGS} /> : null}
            {catTab === "metoc" ? <HeadingList headings={METOC_HEADINGS} /> : null}

            {catTab === "tactical" ? (
              <>
                {sections.map((key) => (
                  <AccordionSection
                    key={key}
                    title={SECTION_LABEL[key]}
                    open={openSection === key}
                    onToggle={() => setOpenSection(openSection === key ? null : key)}
                  >
                    {key === "tasks" ? (
                      <div className="grid grid-cols-2 gap-2">
                        {TASKS.map((t) => {
                          const active = tool.kind === "draw_task" && (tool as any).taskId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setTool({ kind: "draw_task", taskId: t.id })}
                              className={[
                                "rounded-lg border p-2 text-left hover:bg-gray-50",
                                active ? "border-sky-500 bg-sky-50" : "border-gray-300",
                              ].join(" ")}
                            >
                              <div className="w-full" dangerouslySetInnerHTML={{ __html: t.thumbSvg }} />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {key === "baseDeploy" ? (
                      <div className="grid grid-cols-4 gap-2">
                        {BASE_DEPLOY_SYMBOLS.map((s) => {
                          const svg = sidcToSvg(s.sidc, { size: 30 });
                          return (
                            <button
                              key={s.label}
                              onClick={() => setTool({ kind: "draw_area", sidc: s.sidc, label: s.label } as any)}
                              className="rounded-lg border px-2 py-2 text-center text-xs font-semibold hover:bg-gray-50"
                              type="button"
                            >
                              <div className="mx-auto h-[34px] w-[34px]" dangerouslySetInnerHTML={{ __html: svg }} />
                              <div className="mt-1">{s.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {key === "defensive" ? (
                      <div className="grid grid-cols-2 gap-2">
                        {DEFENSIVE.map((d) => {
                          const active = tool.kind === "draw_defensive" && (tool as any).defId === d.id;
                          return (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => setTool({ kind: "draw_defensive", defId: d.id })}
                              className={[
                                "rounded-lg border p-2 hover:bg-gray-50",
                                active ? "border-sky-500 bg-sky-50" : "border-gray-300",
                              ].join(" ")}
                            >
                              <div dangerouslySetInnerHTML={{ __html: d.thumbSvg }} />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {key === "commando" ? (
                      <div className="grid grid-cols-5 gap-2">
                        {COMMANDO_POINTS.map((c) => {
                          const active = tool.kind === "place_commando" && (tool as any).iconId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setTool({ kind: "place_commando", iconId: c.id, svg: c.thumbSvg, label: c.label } as any)}
                              className={[
                                active ? "border-sky-500 bg-sky-50" : "border-gray-300",
                              ].join(" ")}
                            >
                              <div dangerouslySetInnerHTML={{ __html: c.thumbSvg }} />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {key !== "tasks" && key !== "commando" && key !== "baseDeploy" && key !== "defensive" ? (
                      <div className="text-xs text-gray-500">(ยังไม่ทำ content หมวดนี้)</div>
                    ) : null}
                  </AccordionSection>
                ))}
              </>
            ) : null}

          </>
        )}
      </div>

      {/* footer */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Tool: <b>{tool.kind}</b>
          </span>
          <span>
            Features: <b>{count}</b>
          </span>
        </div>

        <div className="mt-2 flex gap-2">
          <button className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setTool({ kind: "none" })} type="button">
            Pointer
          </button>
          <button
            className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
            onClick={() => {
              clear();
              useToolStore.getState().setTool({ kind: "none" });
              window.dispatchEvent(new Event("map:clear"));
            }}
            type="button"
          >
            Clear
          </button>
        </div>
      </div>
    </div >
  );
}