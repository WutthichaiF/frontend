// app/map/components/Formations.tsx
"use client";

import { v4 as uuidv4 } from "uuid";
import type { MapModuleCtx } from "./mapContext";
import { useToolStore } from "@/store/useToolStore";

async function ensureFormationIcons(ctx: MapModuleCtx) {
  const { map, ensureIconFromSvg } = ctx;

  const unknownSvg = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="44" fill="#85e6ff" stroke="#111827" stroke-width="4"/>
    <text x="60" y="78" text-anchor="middle" font-size="64" font-weight="900" fill="#111827">?</text>
  </svg>`;

  const emptySvg = `<svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="18" width="124" height="74" fill="#85e6ff" stroke="#111827" stroke-width="6"/>
  </svg>`;

  await ensureIconFromSvg(map, "unit-unknown", unknownSvg, 110);
  await ensureIconFromSvg(map, "unit-empty", emptySvg, 130);
}

export async function registerFormations(ctx: MapModuleCtx) {
  const { map } = ctx;

  await ensureFormationIcons(ctx);

  const onClick = async (e: any) => {
    const tool = useToolStore.getState().tool;
    if (tool.kind !== "place_formation_unit") return;

    const id = uuidv4();

    await ctx.ensureIconFromSvg(map, tool.iconId, tool.svg ?? "", 110);

    const feat: any = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] },
      properties: {
        gkind: "formation_unit",
        id,
        iconId: tool.iconId,
        iconSize: tool.iconSize ?? 1,
      },
    };

    ctx.setTac({
      type: "FeatureCollection",
      features: [...ctx.tacRef.current.features, feat],
    });
  };

  map.on("click", onClick);

  return () => {
    map.off("click", onClick);
  };
}