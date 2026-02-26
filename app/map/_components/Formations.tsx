// app/map/components/Formations.tsx
"use client";

import { v4 as uuidv4 } from "uuid";
import type { MapModuleCtx } from "./mapContext";
import { useToolStore } from "@/store/useToolStore";

async function ensureIconFromUrl(map: any, iconId: string, url: string, size = 110) {
  if (map.hasImage(iconId)) return;

  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  img.width = size;
  img.height = size;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image load failed: " + url));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  const data = ctx.getImageData(0, 0, size, size);
  map.addImage(iconId, data, { pixelRatio: 2 });
}

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
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "place_formation_unit") return;

    const id = uuidv4();

    if (tool.thumb) {
      await ensureIconFromUrl(map, tool.iconId, tool.thumb, 110);
    }
    else if (map.hasImage(tool.iconId)) {
      
    }
    else if (tool.svg && String(tool.svg).trim().length > 0) {
      await ctx.ensureIconFromSvg(map, tool.iconId, tool.svg, 110);
    }
    else {
      console.warn("Formation icon has no thumb/svg:", tool.iconId);
      return;
    }

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
  return () => map.off("click", onClick);
}