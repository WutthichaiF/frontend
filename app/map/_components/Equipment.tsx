// app/map/components/Equipment.tsx
"use client";

import { v4 as uuidv4 } from "uuid";
import type { MapModuleCtx } from "./mapContext";
import { useToolStore } from "@/store/useToolStore";

async function ensureIconFromUrl(map: any, iconId: string, url: string, size = 384) {
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
  map.addImage(iconId, data, { pixelRatio: window.devicePixelRatio || 2 });
}

export async function registerEquipment(ctx: MapModuleCtx) {
  const { map } = ctx;

  const onClick = async (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "place_equipment_symbol") return;

    const id = uuidv4();

    if (tool.thumb) {
      await ensureIconFromUrl(map, tool.iconId, tool.thumb, 384);
    } else if (tool.svg && String(tool.svg).trim().length > 0) {
      await ctx.ensureIconFromSvg(map, tool.iconId, tool.svg, 384);
    } else {
      console.warn("Equipment icon has no thumb/svg:", tool.iconId);
      return;
    }

    const feat: any = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] },
      properties: {
        gkind: "equipment_symbol",
        id,
        iconId: tool.iconId,
        iconSize: tool.iconSize ?? 1.6,
        rot: 0,
        canRotate: tool.canRotate === false ? 0 : 1,
        selected: 0,
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