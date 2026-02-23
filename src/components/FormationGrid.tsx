"use client";

import React from "react";
import { useToolStore } from "@/store/useToolStore";
import { FormationItem } from "./Sidebar/formations";

type Props = {
  title: string;
  items: FormationItem[];
};

export default function FormationGrid({ title, items }: Props) {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  return (
    <div className="mb-4">
      <div className="mb-2 text-sm font-semibold text-gray-900">{title}</div>

      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {items.map((it) => {
          const active =
            tool.kind === "place_formation_unit" && tool.iconId === it.id;

          return (
            <button
              key={it.id}
              type="button"
              onClick={() =>
                setTool({
                  kind: "place_formation_unit",
                  iconId: it.id,
                  svg: it.svg,
                  iconSize: it.iconSize ?? 1,
                })
              }
              className={[
                "rounded-md p-1 hover:bg-sky-50",
                active ? "ring-2 ring-sky-400 bg-sky-50" : "",
              ].join(" ")}
              title={it.label}
            >
              {/* x / xx เหมือนรูป */}
              <div className="h-4 text-center text-[11px] font-black leading-4 text-gray-900">
                {it.echelon}
              </div>

              <div
                className="h-[60px] w-[86px]"
                dangerouslySetInnerHTML={{ __html: it.svg }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}