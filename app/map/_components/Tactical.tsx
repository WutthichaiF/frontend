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
type Coord = [number, number]; // [lng, lat]

const COLOR_DEF = "#7a1b6d";
const TASK_COLOR = "#4DAAFF";
const TASK_ICON_PX = 96;
const TASK_ICON_SIZE = 1.0;

// Tasks that are drawn as 3-click line graphics (not icons)
const MULTI_DRAW_TASKS = ["block", "breach", "bypass"];

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

// =====================================================
// Feature builder helpers
// =====================================================
function makeTaskLine(id: string, taskId: string, coords: Coord[]): any {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: { gkind: "task_line", color: TASK_COLOR, width: 4, id, taskId },
  };
}

function makeTaskLabel(id: string, taskId: string, text: string, coord: Coord): any {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: coord },
    properties: { gkind: "task_label", text, color: TASK_COLOR, size: 18, id, taskId },
  };
}

function makeCtrlPt(id: string, taskId: string, ptIdx: number, coord: Coord): any {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: coord },
    properties: { gkind: "task_ctrl_pt", id, taskId, ptIdx },
  };
}

// =====================================================
// BLOCK (T-shape): A──────B  with stem mid→C
// =====================================================
function buildBlock(id: string, a: LngLat, b: LngLat, c: LngLat): any[] {
  const midLng = (a.lng + b.lng) / 2;
  const midLat = (a.lat + b.lat) / 2;
  // C is constrained: lng fixed at midLng, only lat changes
  const cCoord: Coord = [midLng, c.lat];

  return [
    makeTaskLine(id, "block", [
      [a.lng, a.lat],
      [b.lng, b.lat],
    ]),
    makeTaskLine(id, "block", [[midLng, midLat], cCoord]),
    makeTaskLabel(id, "block", "B", [midLng - (b.lng - a.lng) * 0.15, midLat]),
    makeCtrlPt(id, "block", 0, [a.lng, a.lat]),
    makeCtrlPt(id, "block", 1, [b.lng, b.lat]),
    makeCtrlPt(id, "block", 2, cCoord),
  ];
}

// =====================================================
// BREACH (U-shape open top): A goes down → across → up to B
// =====================================================
function buildBreach(id: string, a: LngLat, b: LngLat, c: LngLat): any[] {
  const midLng = (a.lng + b.lng) / 2;
  const cLat = c.lat;
  const aBot: Coord = [a.lng, cLat];
  const bBot: Coord = [b.lng, cLat];
  const cCoord: Coord = [midLng, cLat];

  return [
    makeTaskLine(id, "breach", [[a.lng, a.lat], aBot]),
    makeTaskLine(id, "breach", [aBot, bBot]),
    makeTaskLine(id, "breach", [bBot, [b.lng, b.lat]]),
    makeTaskLabel(id, "breach", "B", [
      a.lng + (b.lng - a.lng) * 0.2,
      (a.lat + cLat) / 2,
    ]),
    makeCtrlPt(id, "breach", 0, [a.lng, a.lat]),
    makeCtrlPt(id, "breach", 1, [b.lng, b.lat]),
    makeCtrlPt(id, "breach", 2, cCoord),
  ];
}

// =====================================================
// BYPASS (U-shape + arrowheads at tops of A and B)
// =====================================================
function buildBypass(id: string, a: LngLat, b: LngLat, c: LngLat): any[] {
  const midLng = (a.lng + b.lng) / 2;
  const midLat = (a.lat + b.lat) / 2;
  const cLat = c.lat;
  const aBot: Coord = [a.lng, cLat];
  const bBot: Coord = [b.lng, cLat];
  const cCoord: Coord = [midLng, cLat];

  const feats: any[] = [
    makeTaskLine(id, "bypass", [[a.lng, a.lat], aBot]),
    makeTaskLine(id, "bypass", [aBot, bBot]),
    makeTaskLine(id, "bypass", [bBot, [b.lng, b.lat]]),
    makeCtrlPt(id, "bypass", 0, [a.lng, a.lat]),
    makeCtrlPt(id, "bypass", 1, [b.lng, b.lat]),
    makeCtrlPt(id, "bypass", 2, cCoord),
  ];

  // Arrows: bearing from C midpoint toward AB midpoint = "up" direction
  const heightKm = turf.distance(
    turf.point([midLng, cLat]),
    turf.point([midLng, midLat]),
    { units: "kilometers" }
  );

  if (heightKm > 0.01) {
    const upBrg = turf.bearing(
      turf.point([midLng, cLat]),
      turf.point([midLng, midLat])
    );
    const arrowLen = clamp(heightKm * 0.3, 0.08, 5);

    const addArrow = (tip: LngLat) => {
      const tipPt = turf.point([tip.lng, tip.lat]);
      const wL = turf.destination(tipPt, arrowLen, upBrg + 150, {
        units: "kilometers",
      });
      const wR = turf.destination(tipPt, arrowLen, upBrg - 150, {
        units: "kilometers",
      });
      feats.push(
        makeTaskLine(id, "bypass", [
          wL.geometry.coordinates as Coord,
          [tip.lng, tip.lat],
          wR.geometry.coordinates as Coord,
        ])
      );
    };

    addArrow(a);
    addArrow(b);
  }

  feats.push(
    makeTaskLabel(id, "bypass", "B", [
      a.lng + (b.lng - a.lng) * 0.2,
      (midLat + cLat) / 2,
    ])
  );

  return feats;
}

// =====================================================
// Rebuild dispatcher
// =====================================================
function rebuildTask(
  id: string,
  taskId: string,
  a: LngLat,
  b: LngLat,
  c: LngLat
): any[] {
  if (taskId === "block") return buildBlock(id, a, b, c);
  if (taskId === "breach") return buildBreach(id, a, b, c);
  if (taskId === "bypass") return buildBypass(id, a, b, c);
  return [];
}

// =====================================================
// SVG → ImageData (for simple SVGs without xlink)
// =====================================================
async function svgToImageData(svg: string, size = 32) {
  const imgSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
  if (m.style && typeof m.style.getImage === "function")
    return !!m.style.getImage(id);
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
    if (!hasImageSafe(map, "def-tick"))
      map.addImage("def-tick", data, { pixelRatio: 2 });
  }
  if (!hasImageSafe(map, "def-tooth")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M6 24 L16 7 L26 24 Z" fill="${COLOR_DEF}"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    if (!hasImageSafe(map, "def-tooth"))
      map.addImage("def-tooth", data, { pixelRatio: 2 });
  }
}

function getTaskSvg(
  tool: any
): { svg: string; iconId: string } | null {
  const sidcRaw = typeof tool.sidc === "string" ? tool.sidc.trim() : "";
  const safeSidc = sidcRaw.replace(/\s+/g, "");
  if (!safeSidc) return null;
  try {
    const svg = sidcToSvg(safeSidc, { size: TASK_ICON_PX });
    const iconId = `sidc:${safeSidc}:${TASK_ICON_PX}`;
    return { svg, iconId };
  } catch {
    return null;
  }
}

// =====================================================
export async function registerTactical(ctx: MapModuleCtx) {
  const { map, ensureIconFromSvg } = ctx;

  await ensureDefIcons(map);
  ctx.ensureSourcesAndLayers(map);

  // ── multi-click draw state (block / breach / bypass) ──
  const multiRef: {
    current: { active: boolean; taskId: string; pts: LngLat[] };
  } = { current: { active: false, taskId: "", pts: [] } };

  // ── ctrl-point drag state ──
  const ctrlDragRef: {
    current: { active: boolean; id: string; ptIdx: number };
  } = { current: { active: false, id: "", ptIdx: -1 } };

  // ── defensive draw state ──
  const defPtsRef: { current: LngLat[] } = { current: [] };
  const isDrawingDefRef: { current: boolean } = { current: false };

  // ── cursor ──
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
    if (t.kind === "draw_defensive" || t.kind === "draw_task")
      map.doubleClickZoom.disable();
    else map.doubleClickZoom.enable();
  };
  applyCursor();
  const unsubTool = useToolStore.subscribe(applyCursor);

  // ── click: place task (multi-draw or icon) ──
  const onClickPlaceTask = async (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "draw_task") return;

    const tId = String(tool.id ?? tool.taskId ?? "");
    const p: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };

    if (MULTI_DRAW_TASKS.includes(tId)) {
      const state = multiRef.current;

      // Reset if different task
      if (state.active && state.taskId !== tId) {
        multiRef.current = { active: true, taskId: tId, pts: [p] };
        ctx.setDraw({ type: "FeatureCollection", features: [] });
        return;
      }

      if (!state.active) {
        multiRef.current = { active: true, taskId: tId, pts: [p] };
        return;
      }

      // Append point
      const newPts = [...state.pts, p];
      multiRef.current = { ...state, pts: newPts };

      if (newPts.length < 3) return; // wait for 3rd click

      // Commit on 3rd click
      const [ptA, ptB, ptC] = newPts;
      const id = uuidv4();
      const newFeats = rebuildTask(id, tId, ptA, ptB, ptC);

      ctx.setTac({
        type: "FeatureCollection",
        features: [...ctx.tacRef.current.features, ...newFeats],
      });

      multiRef.current = { active: false, taskId: "", pts: [] };
      ctx.setDraw({ type: "FeatureCollection", features: [] });
      useToolStore.getState().setTool({ kind: "none" } as any);
      return;
    }

    // Non-multi-draw tasks → place as SIDC icon
    const pack = getTaskSvg(tool);
    if (!pack) return;
    const { svg, iconId } = pack;
    await ensureIconFromSvg(map, iconId, svg, TASK_ICON_PX);

    const feat: any = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] },
      properties: {
        gkind: "tactical_task_point",
        id: uuidv4(),
        iconId,
        iconSize: TASK_ICON_SIZE,
        canRotate: true,
        rot: 0,
        taskId: tId,
      },
    };

    ctx.setTac({
      type: "FeatureCollection",
      features: [...ctx.tacRef.current.features, feat],
    });
    useToolStore.getState().setTool({ kind: "none" } as any);
  };

  // ── mousemove preview for multi-draw tasks ──
  const onMoveTask = (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "draw_task") return;
    const tId = String(tool.id ?? tool.taskId ?? "");
    if (!MULTI_DRAW_TASKS.includes(tId)) return;

    const state = multiRef.current;
    if (!state.active || state.pts.length === 0) return;

    const mouse: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    const pts = state.pts;
    const previewFeats: any[] = [];

    if (pts.length === 1) {
      // Stage 1: A → mouse line
      previewFeats.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [pts[0].lng, pts[0].lat],
            [mouse.lng, mouse.lat],
          ],
        },
        properties: { gkind: "draw_line", color: TASK_COLOR },
      } as any);
      previewFeats.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [pts[0].lng, pts[0].lat],
        },
        properties: { gkind: "draw_pt" },
      } as any);
    } else if (pts.length === 2) {
      // Stage 2: full shape preview
      const tmpFeats = rebuildTask(
        "__preview",
        tId,
        pts[0],
        pts[1],
        mouse
      );
      const lines = tmpFeats.filter(
        (f: any) => f.properties.gkind === "task_line"
      );
      previewFeats.push(
        ...lines.map((f: any) => ({
          ...f,
          properties: { ...f.properties, gkind: "draw_line" },
        }))
      );
      previewFeats.push(
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [pts[0].lng, pts[0].lat],
          },
          properties: { gkind: "draw_pt" },
        } as any,
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [pts[1].lng, pts[1].lat],
          },
          properties: { gkind: "draw_pt" },
        } as any
      );
    }

    ctx.setDraw({ type: "FeatureCollection", features: previewFeats });
  };

  // ── mousemove preview for defensive ──
  const onMoveDef = (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "draw_defensive") return;
    if (!isDrawingDefRef.current || defPtsRef.current.length === 0) return;

    const pts = defPtsRef.current;
    const previewLine = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          ...pts.map((p) => [p.lng, p.lat]),
          [e.lngLat.lng, e.lngLat.lat],
        ],
      },
      properties: { gkind: "draw_line", color: COLOR_DEF },
    } as any;
    const previewPts = pts.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { gkind: "draw_pt" },
    })) as any[];
    ctx.setDraw({
      type: "FeatureCollection",
      features: [previewLine, ...previewPts],
    });
  };

  // ── click: defensive add point ──
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
      geometry: {
        type: "LineString",
        coordinates: pts.map((x) => [x.lng, x.lat]),
      },
      properties: { gkind: "draw_line", color: COLOR_DEF },
    } as any;
    const previewPts = pts.map((x) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [x.lng, x.lat] },
      properties: { gkind: "draw_pt" },
    })) as any[];
    ctx.setDraw({
      type: "FeatureCollection",
      features: [previewLine, ...previewPts],
    });
  };

  // ── right-click: finish defensive ──
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
      properties: {
        gkind: "line",
        color: COLOR_DEF,
        width: 4,
        dash: 0,
        defId: toolDefId,
        id,
      },
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
        const offset = turf.destination(
          turf.point(p),
          clamp(step * 2.0, 0.6, 1.2),
          brg + 90,
          { units: "kilometers" }
        );
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
    const tool: any = useToolStore.getState().tool;
    if (tool.kind === "draw_defensive") finishDEF(String((tool as any).defId));
  };

  // ── ESC cancel ──
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== "Escape") return;
    multiRef.current = { active: false, taskId: "", pts: [] };
    isDrawingDefRef.current = false;
    defPtsRef.current = [];
    ctrlDragRef.current = { active: false, id: "", ptIdx: -1 };
    ctx.setDraw({ type: "FeatureCollection", features: [] });
    useToolStore.getState().setTool({ kind: "none" } as any);
    map.dragPan.enable();
  };

  // ── ctrl-point drag ──
  const onMouseDownCtrlPt = (e: any) => {
    const tool: any = useToolStore.getState().tool;
    if (tool.kind !== "none") return;

    const hits = map.queryRenderedFeatures(e.point, {
      layers: ["tac-task-ctrl-pts"] as any,
    });
    const hit = hits?.[0] as any;
    if (!hit?.properties?.id) return;

    e.preventDefault();
    ctrlDragRef.current = {
      active: true,
      id: String(hit.properties.id),
      ptIdx: Number(hit.properties.ptIdx),
    };
    map.dragPan.disable();
  };

  const onMouseMoveCtrlPt = (e: any) => {
    if (!ctrlDragRef.current.active) return;
    const { id, ptIdx } = ctrlDragRef.current;

    const group = ctx.tacRef.current.features.filter(
      (f: any) => f.properties?.id === id
    );

    const getCtrl = (idx: number): LngLat | null => {
      const f = group.find(
        (f: any) =>
          f.properties?.gkind === "task_ctrl_pt" &&
          f.properties?.ptIdx === idx
      ) as any;
      return f
        ? {
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
          }
        : null;
    };

    let a = getCtrl(0);
    let b = getCtrl(1);
    let c = getCtrl(2);
    if (!a || !b || !c) return;

    const taskId = String((group[0] as any)?.properties?.taskId ?? "");
    const newLng = e.lngLat.lng;
    const newLat = e.lngLat.lat;

    if (ptIdx === 0) {
      a = { lng: newLng, lat: newLat };
    } else if (ptIdx === 1) {
      b = { lng: newLng, lat: newLat };
    } else if (ptIdx === 2) {
      // C constrained: only lat changes, lng stays at midpoint(A,B)
      const midLng = (a.lng + b.lng) / 2;
      c = { lng: midLng, lat: newLat };
    }

    const newFeats = rebuildTask(id, taskId, a, b, c);
    const others = ctx.tacRef.current.features.filter(
      (f: any) => f.properties?.id !== id
    );
    ctx.setTac({
      type: "FeatureCollection",
      features: [...others, ...newFeats],
    });
  };

  const onMouseUpCtrlPt = () => {
    if (!ctrlDragRef.current.active) return;
    ctrlDragRef.current = { active: false, id: "", ptIdx: -1 };
    map.dragPan.enable();
  };

  // ── register events ──
  map.on("mousemove", onMoveDef);
  map.on("mousemove", onMoveTask);
  map.on("click", onClickPlaceTask);
  map.on("click", onClickDefensive);
  map.on("contextmenu", onRightClick);
  map.on("mousedown", onMouseDownCtrlPt);
  map.on("mousemove", onMouseMoveCtrlPt);
  map.on("mouseup", onMouseUpCtrlPt);
  window.addEventListener("keydown", onKeyDown);

  return () => {
    unsubTool?.();
    map.off("mousemove", onMoveDef);
    map.off("mousemove", onMoveTask);
    map.off("click", onClickPlaceTask);
    map.off("click", onClickDefensive);
    map.off("contextmenu", onRightClick);
    map.off("mousedown", onMouseDownCtrlPt);
    map.off("mousemove", onMouseMoveCtrlPt);
    map.off("mouseup", onMouseUpCtrlPt);
    window.removeEventListener("keydown", onKeyDown);
  };
}