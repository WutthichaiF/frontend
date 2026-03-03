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
import { DiVim } from "react-icons/di";
import { count } from "console";
import { TASKS } from "@/lib/Tactical";
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
  items?: FormationItem[];
};

function FormationGrid({ title, items }: FormationGridProps) {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  const activeId = tool.kind === "place_formation_unit" ? tool.iconId : null;

  return (
    <div className="mb-4">
      {title ? <div className="mb-2 text-sm font-medium text-gray-900">{title}</div> : null}

      <div className="grid grid-cols-5 gap-3">
        {(items ?? []).map((it) => {
          const active = activeId === it.id;
          const previewSvg =
            it.svg?.trim()
              ? it.svg
              : it.symbolCode
                ? sidcToSvg(it.symbolCode, { size: 96 })
                : "";

          return (
            <button
              key={it.id}
              type="button"
              onClick={() =>
                setTool({
                  kind: "place_formation_unit",
                  iconId: it.id,
                  iconSize: it.iconSize ?? 1,
                  symbolCode: it.symbolCode ?? "",
                  shortName: it.shortName ?? "",
                  abbreviation: it.abbreviation ?? "",
                  fullName: it.fullName ?? "",
                  svg: it.svg ?? "",
                } as any)
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
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                ) : it.svg ? (
                  <div className="h-[96px] w-[96px] overflow-hidden flex items-center justify-center">
                    <div
                      className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:block"
                      dangerouslySetInnerHTML={{ __html: it.svg }}
                    />
                  </div>
                ) : it.symbolCode ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sidcToSvg(it.symbolCode, { size: 40 },),
                    }}
                  />
                ) : (
                  <div className="h-full w-full rounded border border-gray-300" />
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
                iconSize: it.iconSize ?? 1,
                symbolCode: it.symbolCode ?? "",
                canRotate: it.canRotate ?? canRotate,
              } as any)
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
                  className="h-[96px] w-[96px] object-contain"
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
  );
}

/** แก้ปัญหา SVG id ชนกันเวลา render หลายตัวในหน้าเดียว */
function uniquifySvgIds(svg: string, prefix: string): string {
  const idRegex = /\bid="([^"]+)"/g;
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = idRegex.exec(svg)) !== null) ids.push(m[1]);

  let out = svg;
  for (const id of ids) {
    const newId = `${prefix}__${id}`;
    out = out.replaceAll(`id="${id}"`, `id="${newId}"`);
    out = out.replaceAll(`xlink:href="#${id}"`, `xlink:href="#${newId}"`);
    out = out.replaceAll(`href="#${id}"`, `href="#${newId}"`);
    out = out.replaceAll(`url(#${id})`, `url(#${newId})`);
  }
  return out;
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
                  "Unit Symbols (empty)": (
                    <div className="space-y-1">
                      <div >
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Unknown Warfighting Symbol</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Unknown Warfighting Symbol"]} />
                      </div>
                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Unit Symbol (empty)</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Unit Symbol (empty)"]} />
                      </div>
                    </div>
                  ),
                  "Large Formations, Command and Control": (
                    <div className="space-y-1">
                      <div >
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Combat Units</div>
                        <FormationGrid title="" items={FORMATION_GROUPS["Combat Units"]} />
                      </div>
                      <div className="border-t pt-1">
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
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Installation"] ?? []} canRotate={false} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Raw Material Production / Storage</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Raw Material Production / Storage"] ?? []} canRotate={false} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Processing Facility</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Processing Facility"] ?? []} canRotate={false} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Service, Research, Utility Facility</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Service, Research, Utility Facility"] ?? []} canRotate={false} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Military Materiel Facility</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Military Materiel Facility"] ?? []} canRotate={false} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Actions Points</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Actions Points"] ?? []} canRotate={false} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Post</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Post"] ?? []} canRotate={false} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Medical and Supply Points </div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Medical and Supply Points"] ?? []} canRotate={false} />
                      </div>
                    </div>
                  ),
                  "Weapons": (
                    <div className="space-y-1">
                      <div >
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
                  "Aircraft": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Fixed Wings</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Fixed Wings"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Rotary Wing</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Rotary Wing"] ?? []} />
                      </div>
                    </div>
                  ),
                  "Drone (RPV / UAV)": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Fixed Wing</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Fixed Wings Drone"] ?? []} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Rotary Wing</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Rotary Wing Drone"] ?? []} />
                      </div>
                    </div>
                  ),
                  "Ground Vehicle": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Armored</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Armored Vehicle"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Utility Vehicle</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Utility Vehicle"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Engineer</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Engineer Vehicle"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Civilian Vehicle</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Civilian Vehicle"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Other</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Other Vehicle"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Missile Support</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Missile Support Vehicle"] ?? []} canRotate={true} />
                      </div>
                    </div>
                  ),
                  "Sea Surface (Ships)": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Combatant</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Combatant Ship"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Amphibious warfare ship</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Amphibious Warfare Ship"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Mine Warfare Vessel</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Mine Warfare Vessel"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Patrol</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Patrol Ship"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Unmanned Surface Vehicle</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Unmanned Surface Vehicle"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Navy Group</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Navy Group"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Noncombatant</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Noncombatant Ship"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Other</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Other Ship"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Non-Military </div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Non-Military Ship"] ?? []} canRotate={true} />
                      </div>

                    </div>
                  ),
                  "Subservice (Submarines)": (
                    <div className="space-y-1">
                      <div>
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Submarines</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Submarine"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Non-Submarine</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Non-Submarine"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Underwater Weapons</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Underwater Weapons"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Sea Mine</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Sea Mine"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Sea Mine (Ground)</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Sea Mine (Ground)"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Sea Mine (Moored)</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Sea Mine (Moored) "] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Sea Mine (Floating)</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Sea Mine (Floating)"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Sea Mine Rising Mine</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Sea Mine Rising Mine"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Sea Mine (other position)</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Sea Mine (other position)"] ?? []} canRotate={true} />
                      </div>

                      <div className="border-t pt-1">
                        <div className="mb-2 text-[14px] font-medium text-gray-900">Decoy</div>
                        <EquipmentGrid items={EQUIPMENT_GROUPS["Decoy"] ?? []} canRotate={true} />
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
                      <div className="grid grid-cols-5 gap-2">
                        {TASKS.map((t) => {
                          const active =
                            tool.kind === "draw_task" && (tool as any).taskId === t.id;

                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() =>
                                setTool({
                                  kind: "draw_task",
                                  taskId: t.id,
                                  sidc: t.symbolCode,
                                  shortName: t.shortName,
                                  abbreviation: t.abbreviation,
                                  fullName: t.fullName,
                                } as any)
                              }
                              className={[
                                "rounded-lg border bg-white p-2",
                                active ? "border-sky-500 ring-2 ring-sky-200" : "border-gray-300",
                              ].join(" ")}
                              title={`Short Name: ${t.shortName}\nAbbreviation: ${t.abbreviation}\nFull Name: ${t.fullName}\nSymbol Code: ${t.symbolCode}`}
                            >
                              <div
                                className="flex h-[110px] w-full items-center justify-center overflow-hidden
                       [&>svg]:h-full [&>svg]:w-full [&>svg]:block"
                                dangerouslySetInnerHTML={{ __html: uniquifySvgIds(t.thumbSvg, t.id) }}
                              />
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