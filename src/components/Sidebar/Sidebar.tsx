"use client";

import { useMemo, useState } from "react";
import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";
import { sidcToSvg } from "@/lib/milsymbol";

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

const BASE_DEPLOY_SYMBOLS = [
  { label: "ATK", sidc: "SFGPUCI----K---" },
  { label: "OBJ", sidc: "SFGPUCI----K---" },
  { label: "AA", sidc: "SFGPUCI----K---" },
  { label: "ASU", sidc: "SFGPUCI----K---" },
];

// ===== Tasks (แสดง thumbnail แบบ SVG) =====
const TASKS = [
  {
    id: "WP" as const,
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M40 35 L150 35" stroke="#2f7fff" stroke-width="5" stroke-linecap="round"/>
      <path d="M150 35 L138 27" stroke="#2f7fff" stroke-width="5" stroke-linecap="round"/>
      <path d="M150 35 L138 43" stroke="#2f7fff" stroke-width="5" stroke-linecap="round"/>
      <text x="88" y="29" font-size="18" font-weight="700" fill="#2f7fff">WP</text>
    </svg>`,
  },
  {
    id: "R" as const,
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M40 35 L150 35" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      <path d="M150 35 L138 27" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      <path d="M150 35 L138 43" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      <text x="98" y="29" font-size="18" font-weight="700" fill="#7a1b6d">R</text>
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

// ===== Defensive Lines =====
const DEFENSIVE = [
  {
    id: "xline" as const,
    label: "XXXXXX",
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M30 35 L190 35" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      ${Array.from({ length: 8 }).map((_,i)=>{
        const x=45+i*18;
        return `<path d="M${x-6} 28 L${x+6} 42" stroke="#7a1b6d" stroke-width="4"/>
                <path d="M${x-6} 42 L${x+6} 28" stroke="#7a1b6d" stroke-width="4"/>`;
      }).join("")}
    </svg>`,
  },
  {
    id: "trench" as const,
    label: "Trench",
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M30 35 L190 35" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      ${Array.from({ length: 9 }).map((_,i)=>{
        const x=45+i*18;
        return `<path d="M${x} 20 L${x} 32" stroke="#7a1b6d" stroke-width="4"/>`;
      }).join("")}
    </svg>`,
  },
  {
    id: "teeth" as const,
    label: "Teeth",
    thumbSvg: `<svg viewBox="0 0 220 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="208" height="58" rx="10" fill="white" stroke="#d1d5db"/>
      <path d="M30 40 L190 40" stroke="#7a1b6d" stroke-width="5" stroke-linecap="round"/>
      ${Array.from({ length: 9 }).map((_,i)=>{
        const x=42+i*18;
        return `<path d="M${x} 40 L${x+9} 25 L${x+18} 40 Z" fill="#7a1b6d"/>`;
      }).join("")}
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

export default function Sidebar() {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  const clear = useFeatureStore((s) => s.clear);
  const count = useFeatureStore((s) => s.features.length);

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
        <IconTab active={catTab === "favorites"} label="My Favorites" icon="🔖" onClick={() => setCatTab("favorites")} />
        <IconTab active={catTab === "formations"} label="Formations" icon="🧩" onClick={() => setCatTab("formations")} />
        <IconTab active={catTab === "equipment"} label="Equipment" icon="🛠️" onClick={() => setCatTab("equipment")} />
        <IconTab active={catTab === "tactical"} label="Tactical" icon="↪️" onClick={() => setCatTab("tactical")} />
        <IconTab active={catTab === "functionSpecific"} label="Function" icon="📍" onClick={() => setCatTab("functionSpecific")} />
        <IconTab active={catTab === "metoc"} label="Metoc" icon="🏳️" onClick={() => setCatTab("metoc")} />
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
            {catTab !== "tactical" ? (
              <div className="p-3 text-sm text-gray-600">
                ตอนนี้เดโมเฉพาะแท็บ <b>Tactical</b> ก่อน
              </div>
            ) : (
              <>
                {sections.map((key) => (
                  <AccordionSection
                    key={key}
                    title={SECTION_LABEL[key]}
                    open={openSection === key}
                    onToggle={() => setOpenSection(openSection === key ? null : key)}
                  >
                    {/* TASKS */}
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
                              title="คลิกเพื่อเข้าสู่โหมดวาด: คลิกจุดเริ่ม + จุดจบ (ดับเบิลคลิกยกเลิกไม่ได้ ใช้ ESC)"
                            >
                              <div className="w-full" dangerouslySetInnerHTML={{ __html: t.thumbSvg }} />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {/* BASE DEPLOYMENTS */}
                    {key === "baseDeploy" ? (
                      <div className="grid grid-cols-4 gap-2">
                        {BASE_DEPLOY_SYMBOLS.map((s) => {
                          const svg = sidcToSvg(s.sidc, { size: 30 });
                          return (
                            <button
                              key={s.label}
                              onClick={() => setTool({ kind: "place_symbol", sidc: s.sidc, label: s.label })}
                              className={[
                                "rounded-lg border px-2 py-2 text-center text-xs font-semibold",
                                tool.kind === "place_symbol" && (tool as any).label === s.label
                                  ? "border-sky-500 bg-sky-50"
                                  : "hover:bg-gray-50",
                              ].join(" ")}
                              type="button"
                            >
                              <div className="mx-auto h-[34px] w-[34px]" dangerouslySetInnerHTML={{ __html: svg }} />
                              <div className="mt-1">{s.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {/* DEFENSIVE LINES */}
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
                              title="โหมดวาด: คลิกหลายจุด, ดับเบิลคลิกเพื่อจบ"
                            >
                              <div dangerouslySetInnerHTML={{ __html: d.thumbSvg }} />
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {/* placeholders */}
                    {key !== "tasks" && key !== "baseDeploy" && key !== "defensive" ? (
                      <div className="text-xs text-gray-500">(ยังไม่ทำ content หมวดนี้)</div>
                    ) : null}
                  </AccordionSection>
                ))}
              </>
            )}
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
          <button
            className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => setTool({ kind: "none" })}
            type="button"
          >
            Pointer
          </button>
          <button
            className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
            onClick={clear}
            type="button"
          >
            Clear
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          • Tasks: คลิก 2 จุด<br />
          • Defensive: คลิกหลายจุด แล้ว “คลิกขวา” เพื่อจบ (กด ESC เพื่อยกเลิก)
        </div>
      </div>
    </div>
  );
}
