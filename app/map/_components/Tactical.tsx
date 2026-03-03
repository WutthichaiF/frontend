// app/map/components/Tactical.tsx
"use client";

import type { Map } from "maplibre-gl";
import * as turf from "@turf/turf";
import { v4 as uuidv4 } from "uuid";
import type { Feature, LineString, Point as GPoint } from "geojson";
import type { MapModuleCtx } from "./mapContext";
import { useToolStore } from "@/store/useToolStore";
import { sidcToSvg } from "@/lib/milsymbol";

type LngLat = { lng: number; lat: number };

const COLOR_DEF = "#7a1b6d";
const COLOR_TASK = "#4DAAFF";

const taskPtsRef: { current: LngLat[] } = { current: [] };
const isDrawingTaskRef: { current: boolean } = { current: false };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function samplePointsAlongLine(line: Feature<LineString>, stepKm: number): Feature<GPoint>[] {
  const len = turf.length(line as any, { units: "kilometers" });
  const pts: Feature<GPoint>[] = [];
  if (len <= 0) return pts;

  const n = Math.max(2, Math.floor(len / stepKm));
  for (let i = 0; i <= n; i++) {
    const d = (len * i) / n;
    pts.push(turf.along(line as any, d, { units: "kilometers" }) as any);
  }
  return pts;
}

function lineBearing(a: Feature<GPoint>, b: Feature<GPoint>) {
  return turf.bearing(a as any, b as any);
}

async function svgToImageData(svg: string, size = 32) {
  const svg64 = btoa(unescape(encodeURIComponent(svg)));
  const imgSrc = `data:image/svg+xml;base64,${svg64}`;

  const img = document.createElement("img");
  img.width = size;
  img.height = size;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("img load failed"));
    img.src = imgSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  return ctx.getImageData(0, 0, size, size);
}

function hasImageSafe(map: Map, id: string) {
  const m: any = map as any;
  if (typeof m.hasImage === "function") return !!m.hasImage(id);
  if (m.style && typeof m.style.getImage === "function") return !!m.style.getImage(id);
  if (typeof m.listImages === "function") {
    const imgs = m.listImages();
    return Array.isArray(imgs) ? imgs.includes(id) : false;
  }
  return false;
}

async function ensureDefIcons(map: Map) {
  if (!hasImageSafe(map, "def-x")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M7 7 L25 25" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
      <path d="M25 7 L7 25" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    if (!hasImageSafe(map, "def-x")) map.addImage("def-x", data, { pixelRatio: 2 });
  }

  if (!hasImageSafe(map, "def-tick")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M16 6 L16 20" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    if (!hasImageSafe(map, "def-tick")) map.addImage("def-tick", data, { pixelRatio: 2 });
  }

  if (!hasImageSafe(map, "def-tooth")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M6 24 L16 7 L26 24 Z" fill="${COLOR_DEF}"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    if (!hasImageSafe(map, "def-tooth")) map.addImage("def-tooth", data, { pixelRatio: 2 });
  }
}

export async function registerTactical(ctx: MapModuleCtx) {
  const { map, ensureIconFromSvg } = ctx;

  await ensureDefIcons(map);
  ctx.ensureSourcesAndLayers(map);

  const defPtsRef: { current: LngLat[] } = { current: [] };
  const isDrawingDefRef: { current: boolean } = { current: false };

  const applyCursor = () => {
    const t: any = useToolStore.getState().tool;
    const canvas = map.getCanvas();

    const drawing =
      t.kind === "draw_task" ||
      t.kind === "draw_defensive" ||
      t.kind === "place_commando" ||
      t.kind === "place_symbol" ||
      t.kind === "draw_area";

    canvas.style.cursor = drawing ? "crosshair" : "";

    if (drawing) map.dragPan.disable();
    else map.dragPan.enable();

    if (t.kind === "draw_defensive" || t.kind === "draw_task") map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  };

  applyCursor();
  const unsubTool = useToolStore.subscribe(applyCursor);

  const makeIconId = (sidc: string) => `sidc:${sidc}`;

  // ========= PLACE SYMBOL (single click) =========
  const onClickPlaceSymbol = async (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "place_symbol") return;
    if (!tool.sidc) return;

    const p: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    const id = uuidv4();

    const iconId = makeIconId(tool.sidc);
    const svg = sidcToSvg(tool.sidc);
    await ensureIconFromSvg(map, iconId, svg);

    const f = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: {
        gkind: "symbol",
        id,
        sidc: tool.sidc,
        iconId,
        iconSize: tool.iconSize ?? 1.4,
        canRotate: true,
        rot: 0,
      },
    } as any;

    ctx.setTac({
      type: "FeatureCollection",
      features: [...ctx.tacRef.current.features, f],
    });
  };

  // ========= DEFENSIVE preview =========
  const onMoveDef = (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "draw_defensive") return;
    if (!isDrawingDefRef.current) return;
    if (defPtsRef.current.length === 0) return;

    const pts = defPtsRef.current;

    const previewLine = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [...pts.map((p) => [p.lng, p.lat]), [e.lngLat.lng, e.lngLat.lat]],
      },
      properties: { gkind: "draw_line", color: COLOR_DEF },
    } as any;

    const previewPts = pts.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { gkind: "draw_pt" },
    })) as any[];

    ctx.setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
  };

  const onClickDefensive = (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "draw_defensive") return;

    const p: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };

    if (!isDrawingDefRef.current) {
      isDrawingDefRef.current = true;
      defPtsRef.current = [p];
    } else {
      defPtsRef.current = [...defPtsRef.current, p];
    }

    const pts = defPtsRef.current;

    const previewLine = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: pts.map((x) => [x.lng, x.lat]) },
      properties: { gkind: "draw_line", color: COLOR_DEF },
    } as any;

    const previewPts = pts.map((x) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [x.lng, x.lat] },
      properties: { gkind: "draw_pt" },
    })) as any[];

    ctx.setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
  };

  const finishDEF = (toolDefId: string) => {
    const pts = defPtsRef.current;
    if (pts.length < 2) {
      isDrawingDefRef.current = false;
      defPtsRef.current = [];
      ctx.setDraw({ type: "FeatureCollection", features: [] });
      return;
    }

    const coords = pts.map((p) => [p.lng, p.lat]) as [number, number][];
    const baseLine = turf.lineString(coords);

    const id = uuidv4();

    const base = {
      type: "Feature",
      geometry: baseLine.geometry,
      properties: { gkind: "line", color: COLOR_DEF, width: 4, dash: 0, defId: toolDefId, id },
    } as any;

    const step = Math.max(0.3, turf.length(baseLine) / 40);
    const ptsAlong = samplePointsAlongLine(baseLine as any, step);
    const patternPts: any[] = [];

    for (let i = 0; i < ptsAlong.length - 1; i++) {
      const a = ptsAlong[i];
      const b = ptsAlong[i + 1];
      const brg = lineBearing(a as any, b as any);

      if (toolDefId === "xline") {
        patternPts.push({
          type: "Feature",
          geometry: a.geometry,
          properties: { gkind: "def_pt", pt: "x", rot: brg, color: COLOR_DEF, id },
        });
      }

      if (toolDefId === "trench") {
        patternPts.push({
          type: "Feature",
          geometry: a.geometry,
          properties: { gkind: "def_pt", pt: "tick", rot: brg + 90, color: COLOR_DEF, id },
        });
      }

      if (toolDefId === "teeth") {
        const p = a.geometry.coordinates as [number, number];
        const offset = turf.destination(turf.point(p), clamp(step * 2.0, 0.6, 1.2), brg + 90, {
          units: "kilometers",
        });
        patternPts.push({
          type: "Feature",
          geometry: offset.geometry,
          properties: { gkind: "def_pt", pt: "tooth", rot: brg, color: COLOR_DEF, id },
        });
      }
    }

    ctx.setTac({
      type: "FeatureCollection",
      features: [...ctx.tacRef.current.features, base, ...patternPts],
    });

    isDrawingDefRef.current = false;
    defPtsRef.current = [];
    ctx.setDraw({ type: "FeatureCollection", features: [] });
  };

  // ========= TASK preview =========
  const onClickTask = (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "draw_task") return;

    const p: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };

    if (!isDrawingTaskRef.current) {
      isDrawingTaskRef.current = true;
      taskPtsRef.current = [p];
    } else {
      taskPtsRef.current = [...taskPtsRef.current, p];
    }

    const pts = taskPtsRef.current;

    const previewLine = {
      type: "Feature",
      geometry: { type: "LineString", coordinates: pts.map((x) => [x.lng, x.lat]) },
      properties: { gkind: "draw_line", color: COLOR_TASK },
    } as any;

    const previewPts = pts.map((x) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [x.lng, x.lat] },
      properties: { gkind: "draw_pt" },
    })) as any[];

    ctx.setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
  };

  const onMoveTask = (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "draw_task") return;
    if (!isDrawingTaskRef.current) return;
    if (taskPtsRef.current.length === 0) return;

    const pts = taskPtsRef.current;

    const previewLine = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [...pts.map((p) => [p.lng, p.lat]), [e.lngLat.lng, e.lngLat.lat]],
      },
      properties: { gkind: "draw_line", color: COLOR_TASK },
    } as any;

    const previewPts = pts.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { gkind: "draw_pt" },
    })) as any[];

    ctx.setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
  };

  // ✅ แก้ตรงนี้: finishTask ให้สร้าง “1 symbol ต่อ 1 งาน” (ไม่ปูเป็นพรืด)
  const finishTask = async () => {
    const tool: any = useToolStore.getState().tool;
    const pts = taskPtsRef.current;

    if (pts.length < 2) {
      isDrawingTaskRef.current = false;
      taskPtsRef.current = [];
      ctx.setDraw({ type: "FeatureCollection", features: [] });
      return;
    }

    const coords = pts.map((p) => [p.lng, p.lat]) as [number, number][];
    const baseLine = turf.lineString(coords);

    const id = uuidv4();

    const base = {
      type: "Feature",
      geometry: baseLine.geometry,
      properties: { gkind: "line", color: COLOR_TASK, width: 4, id },
    } as any;

    // icon สำหรับ task
    const taskSvg: string | undefined =
      typeof tool.thumbSvg === "string" && tool.thumbSvg.trim() ? tool.thumbSvg : undefined;

    const taskSidc: string | undefined =
      typeof tool.sidc === "string" && tool.sidc.trim() ? tool.sidc : undefined;

    // ถ้าไม่มี icon ก็เซฟแค่เส้น
    if (!taskSvg && !taskSidc) {
      ctx.setTac({
        type: "FeatureCollection",
        features: [...ctx.tacRef.current.features, base],
      });

      isDrawingTaskRef.current = false;
      taskPtsRef.current = [];
      ctx.setDraw({ type: "FeatureCollection", features: [] });
      return;
    }

    const iconId = taskSidc ? makeIconId(taskSidc) : `task:${tool.taskId || "unknown"}`;
    const svg = taskSvg ?? sidcToSvg(taskSidc!);
    await ensureIconFromSvg(map, iconId, svg);

    // วาง 1 จุดที่ “กึ่งกลางเส้น”
    const lenKm = turf.length(baseLine as any, { units: "kilometers" });
    const mid = turf.along(baseLine as any, lenKm / 2, { units: "kilometers" }) as any;

    // หามุมจากจุดแรก -> จุดสุดท้าย (กันเส้นหักหลายท่อน)
    const a = turf.point(coords[0]) as any;
    const b = turf.point(coords[coords.length - 1]) as any;
    const brg = turf.bearing(a, b);

    const sym = {
      type: "Feature",
      geometry: mid.geometry,
      properties: {
        gkind: "tac_task_symbol",
        id,
        iconId,
        rot: brg,
        iconSize: tool.iconSize ?? 1.4,
      },
    } as any;

    ctx.setTac({
      type: "FeatureCollection",
      features: [...ctx.tacRef.current.features, base, sym],
    });

    isDrawingTaskRef.current = false;
    taskPtsRef.current = [];
    ctx.setDraw({ type: "FeatureCollection", features: [] });
  };

  const onContextMenu = (e: any) => {
    e.originalEvent?.preventDefault?.();
    const tool: any = useToolStore.getState().tool;

    if (tool.kind === "draw_defensive") finishDEF(String(tool.defId));
    if (tool.kind === "draw_task") void finishTask();

    if (
      tool.kind === "place_symbol" ||
      tool.kind === "place_commando" ||
      tool.kind === "place_formation_unit" ||
      tool.kind === "place_equipment_symbol"
    ) {
      useToolStore.getState().setTool({ kind: "none" } as any);
    }
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== "Escape") return;

    isDrawingDefRef.current = false;
    defPtsRef.current = [];

    isDrawingTaskRef.current = false;
    taskPtsRef.current = [];

    ctx.setDraw({ type: "FeatureCollection", features: [] });
    useToolStore.getState().setTool({ kind: "none" } as any);

    map.dragPan.enable();
  };

  // ✅ ใช้ handler ตัวเดียวตอน on/off (สำคัญมาก)
  const onDblClickFinishTask = (e: any) => {
    e?.preventDefault?.();
    void finishTask();
  };

  // listeners
  map.on("mousemove", onMoveDef);
  map.on("click", onClickDefensive);

  map.on("click", onClickTask);
  map.on("mousemove", onMoveTask);
  map.on("dblclick", onDblClickFinishTask);

  map.on("click", onClickPlaceSymbol);

  map.on("contextmenu", onContextMenu);
  window.addEventListener("keydown", onKeyDown);

  return () => {
    unsubTool?.();

    map.off("mousemove", onMoveDef);
    map.off("click", onClickDefensive);

    map.off("click", onClickTask);
    map.off("mousemove", onMoveTask);
    map.off("dblclick", onDblClickFinishTask);

    map.off("click", onClickPlaceSymbol);

    map.off("contextmenu", onContextMenu);
    window.removeEventListener("keydown", onKeyDown);
  };
}