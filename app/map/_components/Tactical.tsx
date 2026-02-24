// app/map/components/Tactical.tsx
"use client";

import type { Map } from "maplibre-gl";
import * as turf from "@turf/turf";
import { v4 as uuidv4 } from "uuid";
import type { Feature, LineString, Point as GPoint } from "geojson";
import type { MapModuleCtx } from "./mapContext";
import { useToolStore } from "@/store/useToolStore";

type LngLat = { lng: number; lat: number };

const COLOR_WP = "#2f7fff";
const COLOR_R = "#7a1b6d";
const COLOR_DEF = "#7a1b6d";
const COLOR_CATK = "#7a1b6d";

function getTaskColor(taskId: string) {
  if (taskId === "WP") return COLOR_WP;
  if (taskId === "R") return COLOR_R;
  if (taskId === "CATK") return COLOR_CATK;
  return COLOR_WP;
}

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

function bearingDeg(a: [number, number], b: [number, number]) {
  return turf.bearing(turf.point(a), turf.point(b));
}

/** ===== CATK corridor arrow ===== */
function buildCATK2525(start: [number, number], end: [number, number]) {
  const base = turf.lineString([start, end]);
  const lenKm = turf.length(base, { units: "kilometers" });
  if (lenKm <= 0.001) return null;

  const brg = turf.bearing(turf.point(start), turf.point(end));
  const widthKm = clamp(lenKm * 0.18, 1.0, 25);
  const headLenKm = clamp(lenKm * 0.28, widthKm * 1.2, widthKm * 3.0);
  const headWidthKm = clamp(widthKm * 1.8, widthKm * 1.4, widthKm * 2.4);

  const tip = turf.point(end);
  const back = turf.destination(tip, headLenKm, brg + 180, { units: "kilometers" });

  const leftStart = turf.destination(turf.point(start), widthKm / 2, brg + 90, { units: "kilometers" });
  const rightStart = turf.destination(turf.point(start), widthKm / 2, brg - 90, { units: "kilometers" });

  const leftHeadCorner = turf.destination(back, headWidthKm / 2, brg + 90, { units: "kilometers" });
  const rightHeadCorner = turf.destination(back, headWidthKm / 2, brg - 90, { units: "kilometers" });

  const neckLenKm = clamp(headLenKm * 0.35, 0.6, headLenKm * 0.6);
  const neck = turf.destination(back, neckLenKm, brg + 180, { units: "kilometers" });
  const leftNeck = turf.destination(neck, widthKm / 2, brg + 90, { units: "kilometers" });
  const rightNeck = turf.destination(neck, widthKm / 2, brg - 90, { units: "kilometers" });

  const leftLine: [number, number][] = [
    leftStart.geometry.coordinates as any,
    leftNeck.geometry.coordinates as any,
    leftHeadCorner.geometry.coordinates as any,
    tip.geometry.coordinates as any,
  ];

  const rightLine: [number, number][] = [
    rightStart.geometry.coordinates as any,
    rightNeck.geometry.coordinates as any,
    rightHeadCorner.geometry.coordinates as any,
    tip.geometry.coordinates as any,
  ];

  const mid = turf.along(base, lenKm * 0.55, { units: "kilometers" });

  const vertex = [
    leftStart.geometry.coordinates,
    leftHeadCorner.geometry.coordinates,
    tip.geometry.coordinates,
    rightHeadCorner.geometry.coordinates,
    rightStart.geometry.coordinates,
  ] as [number, number][];

  return {
    geometry: {
      type: "MultiLineString" as const,
      coordinates: [leftLine, rightLine],
    },
    rot: brg,
    mid,
    vertex,
  };
}

/** ===== Hook arc builder (screen space) ===== */
function rot90(v: { x: number; y: number }) {
  return { x: -v.y, y: v.x };
}
function norm(v: { x: number; y: number }) {
  const m = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / m, y: v.y / m };
}
function dot(a: { x: number; y: number }, b: { x: number; y: number }) {
  return a.x * b.x + a.y * b.y;
}

function buildHookArcLngLat(map: Map, p0: [number, number], p1: [number, number], p2: [number, number], steps = 56): [number, number][] {
  const P0 = map.project({ lng: p0[0], lat: p0[1] });
  const P1 = map.project({ lng: p1[0], lat: p1[1] });
  const P2 = map.project({ lng: p2[0], lat: p2[1] });

  const t = norm({ x: P1.x - P0.x, y: P1.y - P0.y });
  let r1 = rot90(t);

  const d = { x: P2.x - P1.x, y: P2.y - P1.y };
  let denom = 2 * dot(d, r1);

  if (Math.abs(denom) < 1e-6) {
    r1 = { x: -r1.x, y: -r1.y };
    denom = 2 * dot(d, r1);
  }

  let R = dot(d, d) / denom;
  if (!isFinite(R) || R <= 0) {
    r1 = { x: -r1.x, y: -r1.y };
    denom = 2 * dot(d, r1);
    R = dot(d, d) / denom;
  }

  if (!isFinite(R) || R <= 1) return [p1, p2];

  const C = { x: P1.x + r1.x * R, y: P1.y + r1.y * R };
  const a1 = Math.atan2(P1.y - C.y, P1.x - C.x);
  const a2 = Math.atan2(P2.y - C.y, P2.x - C.x);

  const vStart = norm({ x: P1.x - C.x, y: P1.y - C.y });
  const tanCCW = rot90(vStart);
  const sameDir = dot(tanCCW, t) > 0;

  let start = a1;
  let end = a2;
  const twoPi = Math.PI * 2;

  if (sameDir) while (end < start) end += twoPi;
  else while (end > start) end -= twoPi;

  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const tt = i / steps;
    const ang = start + (end - start) * tt;
    const x = C.x + Math.cos(ang) * Math.abs(R);
    const y = C.y + Math.sin(ang) * Math.abs(R);
    const ll = map.unproject([x, y]);
    pts.push([ll.lng, ll.lat]);
  }
  return pts;
}

function buildWpRFeatures(map: Map, taskId: "WP" | "R", id: string, pts: [number, number][], color: string) {
  const [p0, p1, p2] = pts;

  const straight: [number, number][] = [p0, p1];
  const arc = buildHookArcLngLat(map, p0, p1, p2, 56);
  const coords: [number, number][] = [...straight, ...arc.slice(1)];

  const P0 = map.project({ lng: p0[0], lat: p0[1] });
  const P1 = map.project({ lng: p1[0], lat: p1[1] });
  const lx = P0.x + (P1.x - P0.x) * 0.55;
  const ly = P0.y + (P1.y - P0.y) * 0.55;
  const llLabel = map.unproject([lx, ly]);

  const arrowBearing = bearingDeg(p1, p0);

  const lineFeat: any = {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: { gkind: "line", taskId, id, color, width: 4, dash: 0 },
  };

  const labelFeat: any = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [llLabel.lng, llLabel.lat] },
    properties: { gkind: "label", text: taskId, color, rot: bearingDeg(p0, p1), id, taskId },
  };

  const arrowFeat: any = {
    type: "Feature",
    geometry: { type: "Point", coordinates: p0 },
    properties: { gkind: "arrow", bearing: arrowBearing, color, id, taskId },
  };

  const ctrlPts: any[] = pts.map((c, idx) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: c },
    properties: { gkind: "task_pt", taskId, id, idx, isCtrl: true },
  }));

  return [lineFeat, labelFeat, arrowFeat, ...ctrlPts];
}

/** ===== defensive icons ===== */
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

async function ensureDefIcons(map: Map) {
  if (!map.hasImage("def-x")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M7 7 L25 25" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
      <path d="M25 7 L7 25" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    map.addImage("def-x", data, { pixelRatio: 2 });
  }

  if (!map.hasImage("def-tick")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M16 6 L16 20" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    map.addImage("def-tick", data, { pixelRatio: 2 });
  }

  if (!map.hasImage("def-tooth")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M6 24 L16 7 L26 24 Z" fill="${COLOR_DEF}"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    map.addImage("def-tooth", data, { pixelRatio: 2 });
  }
}

export async function registerTactical(ctx: MapModuleCtx) {
  const { map } = ctx;

  await ensureDefIcons(map);
  ctx.ensureSourcesAndLayers(map);

  // local refs (อยู่ใน module)
  const taskStartRef: { current: LngLat | null } = { current: null };

  const defPtsRef: { current: LngLat[] } = { current: [] };
  const isDrawingDefRef: { current: boolean } = { current: false };

  const catkStartRef: { current: LngLat | null } = { current: null };
  const isDraggingCATKRef: { current: boolean } = { current: false };

  // ===== cursor + disable zoom/pan while drawing =====
  const applyCursor = () => {
    const t = useToolStore.getState().tool;
    const canvas = map.getCanvas();

    const drawing =
      t.kind === "draw_task" ||
      t.kind === "draw_defensive" ||
      t.kind === "place_commando" ||
      t.kind === "place_symbol";

    canvas.style.cursor = drawing ? "crosshair" : "";

    if (t.kind === "draw_defensive" || t.kind === "draw_task") map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();

    if (t.kind === "draw_task" && t.taskId === "CATK" && isDraggingCATKRef.current) map.dragPan.disable();
    else map.dragPan.enable();
  };

  applyCursor();
  const unsubTool = useToolStore.subscribe(applyCursor);

  // ===== place_commando =====
  const onClickCommando = async (e: any) => {
    const tool = useToolStore.getState().tool;
    if (tool.kind !== "place_commando") return;

    const id = uuidv4();
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;

    await ctx.ensureIconFromSvg(map, (tool as any).iconId, (tool as any).svg, 110);

    const feat: any = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties: {
        gkind: "commando_icon",
        id,
        iconId: (tool as any).iconId,
        label: (tool as any).label ?? "",
        iconSize: 1.4,
      },
    };

    ctx.setTac({
      type: "FeatureCollection",
      features: [...ctx.tacRef.current.features, feat],
    });
  };

  // ===== WP/R preview mousemove =====
  const onMoveWpR = (e: any) => {
    const tool = useToolStore.getState().tool;

    if (tool.kind === "draw_task" && tool.taskId !== "CATK") {
      if (!taskStartRef.current) return;

      const start = taskStartRef.current;
      const end = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      const color = getTaskColor(tool.taskId);

      ctx.setDraw({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "LineString", coordinates: [[start.lng, start.lat], [end.lng, end.lat]] },
            properties: { gkind: "draw_line", color },
          } as any,
        ],
      });
    }
  };

  // ===== DEF preview =====
  const onMoveDef = (e: any) => {
    const tool = useToolStore.getState().tool;
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

  // ===== CLICK logic: WP/R + DEF add points =====
  const onClickMain = (e: any) => {
    const tool = useToolStore.getState().tool;

    // WP/R (2 clicks)
    if (tool.kind === "draw_task" && (tool.taskId === "WP" || tool.taskId === "R")) {
      const now: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };

      if (!taskStartRef.current) {
        taskStartRef.current = now;
        return;
      }

      const p0: [number, number] = [taskStartRef.current.lng, taskStartRef.current.lat];
      const p1: [number, number] = [now.lng, now.lat];

      const baseBrg = bearingDeg(p0, p1);
      const dist = turf.distance(turf.point(p0), turf.point(p1), { units: "kilometers" });

      const p2 = turf
        .destination(turf.point(p1), dist, baseBrg - 90, { units: "kilometers" })
        .geometry.coordinates as [number, number];

      const id = uuidv4();
      const color = getTaskColor(tool.taskId);

      const feats = buildWpRFeatures(map, tool.taskId as "WP" | "R", id, [p0, p1, p2], color);

      ctx.setTac({
        type: "FeatureCollection",
        features: [...ctx.tacRef.current.features, ...feats],
      });

      taskStartRef.current = null;
      ctx.setDraw({ type: "FeatureCollection", features: [] });
      return;
    }

    // Defensive add points
    if (tool.kind === "draw_defensive") {
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
    }
  };

  // ===== CATK drag =====
  const previewCATK = (start: LngLat, end: LngLat) => {
    const built = buildCATK2525([start.lng, start.lat], [end.lng, end.lat]);
    if (!built) return;

    const preview: any = {
      type: "Feature",
      geometry: built.geometry,
      properties: { gkind: "draw_line", color: COLOR_CATK },
    };

    ctx.setDraw({ type: "FeatureCollection", features: [preview] });
  };

  const commitCATK = (start: LngLat, end: LngLat) => {
    const built = buildCATK2525([start.lng, start.lat], [end.lng, end.lat]);
    if (!built) return;

    const id = uuidv4();

    const lineFeat: any = {
      type: "Feature",
      geometry: built.geometry,
      properties: { gkind: "line", color: COLOR_CATK, width: 4, dash: 1, taskId: "CATK", id },
    };

    const labelFeat: any = {
      type: "Feature",
      geometry: built.mid.geometry,
      properties: { gkind: "label", text: "CATK", color: COLOR_CATK, rot: built.rot, id },
    };

    const vertexPts: any[] = built.vertex.map((c, idx) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: c },
      properties: { gkind: "task_pt", taskId: "CATK", idx, id },
    }));

    ctx.setTac({
      type: "FeatureCollection",
      features: [...ctx.tacRef.current.features, lineFeat, labelFeat, ...vertexPts],
    });
  };

  const onMouseDown = (e: any) => {
    const tool = useToolStore.getState().tool;
    if (!(tool.kind === "draw_task" && tool.taskId === "CATK")) return;

    isDraggingCATKRef.current = true;
    catkStartRef.current = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    map.dragPan.disable();
  };

  const onMouseMove = (e: any) => {
    const tool = useToolStore.getState().tool;
    if (!(tool.kind === "draw_task" && tool.taskId === "CATK")) return;
    if (!isDraggingCATKRef.current) return;
    if (!catkStartRef.current) return;

    previewCATK(catkStartRef.current, { lng: e.lngLat.lng, lat: e.lngLat.lat });
  };

  const onMouseUp = (e: any) => {
    const tool = useToolStore.getState().tool;
    if (!(tool.kind === "draw_task" && tool.taskId === "CATK")) return;
    if (!isDraggingCATKRef.current) return;
    if (!catkStartRef.current) return;

    const start = catkStartRef.current;
    const end = { lng: e.lngLat.lng, lat: e.lngLat.lat };

    isDraggingCATKRef.current = false;
    catkStartRef.current = null;

    map.dragPan.enable();
    commitCATK(start, end);
    ctx.setDraw({ type: "FeatureCollection", features: [] });
  };

  // ===== RIGHT CLICK finish defensive =====
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

    const ptsAlong = samplePointsAlongLine(baseLine as any, Math.max(0.3, turf.length(baseLine) / 40));
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
        const offset = turf.destination(turf.point(p), 0.8, brg + 90, { units: "kilometers" });
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

  const onRightClick = (e: any) => {
    e.originalEvent?.preventDefault?.();
    const tool = useToolStore.getState().tool;
    if (tool.kind === "draw_defensive") finishDEF((tool as any).defId);
  };

  // ===== ESC cancel =====
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== "Escape") return;

    taskStartRef.current = null;

    isDraggingCATKRef.current = false;
    catkStartRef.current = null;

    isDrawingDefRef.current = false;
    defPtsRef.current = [];

    ctx.setDraw({ type: "FeatureCollection", features: [] });
    useToolStore.getState().setTool({ kind: "none" } as any);

    map.dragPan.enable();
  };

  // register all listeners
  map.on("click", onClickCommando);
  map.on("mousemove", onMoveWpR);
  map.on("mousemove", onMoveDef);
  map.on("click", onClickMain);

  map.on("mousedown", onMouseDown);
  map.on("mousemove", onMouseMove);
  map.on("mouseup", onMouseUp);

  map.on("contextmenu", onRightClick);
  window.addEventListener("keydown", onKeyDown);

  // cleanup
  return () => {
    unsubTool?.();

    map.off("click", onClickCommando);
    map.off("mousemove", onMoveWpR);
    map.off("mousemove", onMoveDef);
    map.off("click", onClickMain);

    map.off("mousedown", onMouseDown);
    map.off("mousemove", onMouseMove);
    map.off("mouseup", onMouseUp);

    map.off("contextmenu", onRightClick);
    window.removeEventListener("keydown", onKeyDown);
  };
}