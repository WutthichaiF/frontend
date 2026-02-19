"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";
import * as turf from "@turf/turf";
import { v4 as uuidv4 } from "uuid";

import { useMapInit } from "@/hooks/useMapInit";
import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";

import type { Feature, FeatureCollection, LineString, Point as GPoint } from "geojson";

type LngLat = { lng: number; lat: number };
type FC = FeatureCollection;

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

// ======= helpers: svg -> map image =======
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

async function ensureIcons(map: Map) {
  // X
  if (!map.hasImage("def-x")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M7 7 L25 25" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
      <path d="M25 7 L7 25" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    map.addImage("def-x", data, { pixelRatio: 2 });
  }

  // trench tick
  if (!map.hasImage("def-tick")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M16 6 L16 20" stroke="${COLOR_DEF}" stroke-width="4" stroke-linecap="round"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    map.addImage("def-tick", data, { pixelRatio: 2 });
  }

  // teeth triangle
  if (!map.hasImage("def-tooth")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
      <path d="M6 24 L16 7 L26 24 Z" fill="${COLOR_DEF}"/>
    </svg>`;
    const data = await svgToImageData(svg, 32);
    map.addImage("def-tooth", data, { pixelRatio: 2 });
  }
}

function ensureSourcesAndLayers(map: Map) {
  if (!map.getSource("tac-src")) {
    map.addSource("tac-src", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  if (!map.getSource("draw-src")) {
    map.addSource("draw-src", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }

  // base line (tasks + defensive)
  if (!map.getLayer("tac-line")) {
    map.addLayer({
      id: "tac-line",
      type: "line",
      source: "tac-src",
      filter: ["==", ["get", "gkind"], "line"],
      paint: {
        "line-width": ["coalesce", ["get", "width"], 4],
        "line-color": ["get", "color"],
        "line-dasharray": [
          "case",
          ["==", ["get", "dash"], 1],
          ["literal", [2, 2]],
          ["literal", [1, 0]],
        ],
      },
    });
  }

  // label
  if (!map.getLayer("tac-label")) {
    map.addLayer({
      id: "tac-label",
      type: "symbol",
      source: "tac-src",
      filter: ["==", ["get", "gkind"], "label"],
      layout: {
        "text-field": ["get", "text"],
        "text-size": 14,
        "text-allow-overlap": true,
        "text-rotation-alignment": "map",
        "text-rotate": ["coalesce", ["get", "rot"], 0],
      },
      paint: { "text-color": ["get", "color"], "text-halo-color": "#fff", "text-halo-width": 1 },
    });
  }

  // arrow head (WP/R) - ใช้ glyph ▶
  if (!map.getLayer("tac-arrow")) {
    map.addLayer({
      id: "tac-arrow",
      type: "symbol",
      source: "tac-src",
      filter: ["==", ["get", "gkind"], "arrow"],
      layout: {
        "text-field": "▶",
        "text-size": 18,
        "text-rotate": ["get", "bearing"],
        "text-allow-overlap": true,
        "text-rotation-alignment": "map",
      },
      paint: { "text-color": ["get", "color"], "text-halo-color": "#fff", "text-halo-width": 1 },
    });
  }

  // CATK vertices (red points)
  if (!map.getLayer("tac-task-pts")) {
    map.addLayer({
      id: "tac-task-pts",
      type: "circle",
      source: "tac-src",
      filter: ["==", ["get", "gkind"], "task_pt"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ff3b30",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
  }

  // Defensive points
  if (!map.getLayer("def-x")) {
    map.addLayer({
      id: "def-x",
      type: "symbol",
      source: "tac-src",
      filter: ["all", ["==", ["get", "gkind"], "def_pt"], ["==", ["get", "pt"], "x"]],
      layout: {
        "icon-image": "def-x",
        "icon-allow-overlap": true,
        "icon-rotate": ["get", "rot"],
        "icon-rotation-alignment": "map",
        "icon-size": 1,
      },
    });
  }

  if (!map.getLayer("def-tick")) {
    map.addLayer({
      id: "def-tick",
      type: "symbol",
      source: "tac-src",
      filter: ["all", ["==", ["get", "gkind"], "def_pt"], ["==", ["get", "pt"], "tick"]],
      layout: {
        "icon-image": "def-tick",
        "icon-allow-overlap": true,
        "icon-rotate": ["get", "rot"],
        "icon-rotation-alignment": "map",
        "icon-size": 1,
      },
    });
  }

  if (!map.getLayer("def-tooth")) {
    map.addLayer({
      id: "def-tooth",
      type: "symbol",
      source: "tac-src",
      filter: ["all", ["==", ["get", "gkind"], "def_pt"], ["==", ["get", "pt"], "tooth"]],
      layout: {
        "icon-image": "def-tooth",
        "icon-allow-overlap": true,
        "icon-rotate": ["get", "rot"],
        "icon-rotation-alignment": "map",
        "icon-size": 1,
      },
    });
  }

  // draw preview line
  if (!map.getLayer("draw-line")) {
    map.addLayer({
      id: "draw-line",
      type: "line",
      source: "draw-src",
      filter: ["==", ["get", "gkind"], "draw_line"],
      paint: {
        "line-width": 4,
        "line-color": ["get", "color"],
        "line-dasharray": ["literal", [2, 2]],
      },
    });
  }

  // draw preview points
  if (!map.getLayer("draw-pts")) {
    map.addLayer({
      id: "draw-pts",
      type: "circle",
      source: "draw-src",
      filter: ["==", ["get", "gkind"], "draw_pt"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ff3b30",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
  }
}

// ===== defensive geometry generator =====
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

// ===== CATK helpers =====
function getLabelPointAndRotation(coords: [number, number][]) {
  // เอากลางของ segment ที่ยาวสุด เพื่อให้ rot ดูเหมือนในรูป
  let bestIdx = 0;
  let bestLen = -1;

  for (let i = 0; i < coords.length - 1; i++) {
    const seg = turf.lineString([coords[i], coords[i + 1]]);
    const l = turf.length(seg, { units: "kilometers" });
    if (l > bestLen) {
      bestLen = l;
      bestIdx = i;
    }
  }

  const a = turf.point(coords[bestIdx]);
  const b = turf.point(coords[bestIdx + 1]);
  const brg = turf.bearing(a, b);

  const mid = turf.midpoint(a, b);
  return { mid, rot: brg };
}

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const addFeature = useFeatureStore((s) => s.addFeature);

  const tacRef = useRef<FC>({ type: "FeatureCollection", features: [] });
  const drawRef = useRef<FC>({ type: "FeatureCollection", features: [] });

  // WP/R (2 clicks)
  const taskStartRef = useRef<LngLat | null>(null);

  // DEF (many clicks)
  const defPtsRef = useRef<LngLat[]>([]);
  const isDrawingDefRef = useRef(false);

  // CATK (many clicks)
  const catkPtsRef = useRef<LngLat[]>([]);
  const isDrawingCatkRef = useRef(false);

  useMapInit(containerRef, mapRef);

  const setTac = (next: FC) => {
    tacRef.current = next;
    const map = mapRef.current;
    if (!map) return;
    ensureSourcesAndLayers(map);
    const src = map.getSource("tac-src") as any;
    src?.setData(next);
  };

  const setDraw = (next: FC) => {
    drawRef.current = next;
    const map = mapRef.current;
    if (!map) return;
    ensureSourcesAndLayers(map);
    const src = map.getSource("draw-src") as any;
    src?.setData(next);
  };

  // init layers/icons
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onLoad = async () => {
      await ensureIcons(map);
      ensureSourcesAndLayers(map);
      setTac(tacRef.current);
      setDraw(drawRef.current);
    };

    if (map.loaded()) {
      onLoad();
    } else {
      map.once("load", onLoad);
    }
  }, []);

  // cursor + disable doubleclick zoom when drawing
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const t = useToolStore.getState().tool;
      const canvas = map.getCanvas();

      const drawing = t.kind === "draw_task" || t.kind === "draw_defensive" || t.kind === "place_symbol";
      canvas.style.cursor = drawing ? "crosshair" : "";

      if (t.kind === "draw_defensive" || t.kind === "draw_task") map.doubleClickZoom.disable();
      else map.doubleClickZoom.enable();
    };

    apply();
    const unsub = useToolStore.subscribe(apply);
    return () => unsub();
  }, []);

  // place_symbol
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: any) => {
      const tool = useToolStore.getState().tool;
      if (tool.kind !== "place_symbol") return;

      const id = uuidv4();
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;

      new maplibregl.Marker({ draggable: false }).setLngLat([lng, lat]).addTo(map);

      addFeature({
        id,
        type: "symbol",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: { sidc: tool.sidc, label: tool.label ?? "" },
      });
    };

    map.on("click", onClick);
    return () => map.off("click", onClick);
  }, [addFeature]);

  // preview mousemove (TASK + CATK + DEF)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMove = (e: any) => {
      const tool = useToolStore.getState().tool;

      // ===== CATK preview =====
      if (tool.kind === "draw_task" && tool.taskId === "CATK") {
        if (!isDrawingCatkRef.current) return;
        if (catkPtsRef.current.length === 0) return;

        const pts = catkPtsRef.current;
        const color = getTaskColor("CATK");

        const coords = [...pts.map((p) => [p.lng, p.lat] as [number, number]), [e.lngLat.lng, e.lngLat.lat] as [number, number]];

        const previewLine = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
          properties: { gkind: "draw_line", color },
        } as any;

        const previewPts = pts.map((p) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
          properties: { gkind: "draw_pt" },
        })) as any[];

        setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
        return;
      }

      // ===== WP/R preview (2 points) =====
      if (tool.kind === "draw_task" && tool.taskId !== "CATK") {
        if (!taskStartRef.current) return;

        const start = taskStartRef.current;
        const end = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        const color = getTaskColor(tool.taskId);

        setDraw({
          type: "FeatureCollection",
          features: [
            ...drawRef.current.features.filter((f: any) => f?.properties?.gkind !== "draw_line"),
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: [[start.lng, start.lat], [end.lng, end.lat]] },
              properties: { gkind: "draw_line", color },
            } as any,
          ],
        });
        return;
      }

      // ===== DEF preview =====
      if (tool.kind === "draw_defensive") {
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

        setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
      }
    };

    map.on("mousemove", onMove);
    return () => map.off("mousemove", onMove);
  }, []);

  // CLICK logic (WP/R + CATK add point + DEF add point)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: any) => {
      const tool = useToolStore.getState().tool;

      // ===== TASKS =====
      if (tool.kind === "draw_task") {
        const now: LngLat = { lng: e.lngLat.lng, lat: e.lngLat.lat };

        // --- CATK: add many points ---
        if (tool.taskId === "CATK") {
          if (!isDrawingCatkRef.current) {
            isDrawingCatkRef.current = true;
            catkPtsRef.current = [now];
          } else {
            catkPtsRef.current = [...catkPtsRef.current, now];
          }

          // show draw pts immediately
          const pts = catkPtsRef.current;
          const color = getTaskColor("CATK");

          const previewLine = {
            type: "Feature",
            geometry: { type: "LineString", coordinates: pts.map((p) => [p.lng, p.lat]) },
            properties: { gkind: "draw_line", color },
          } as any;

          const previewPts = pts.map((p) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [p.lng, p.lat] },
            properties: { gkind: "draw_pt" },
          })) as any[];

          setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
          return;
        }

        // --- WP/R: click 2 points ---
        if (!taskStartRef.current) {
          taskStartRef.current = now;
          return;
        }

        const start = taskStartRef.current;
        const end = now;
        const color = getTaskColor(tool.taskId);

        const line = turf.lineString([
          [start.lng, start.lat],
          [end.lng, end.lat],
        ]);

        const length = turf.length(line);
        const mid = turf.along(line, length / 2);

        const bearing = turf.bearing(turf.point([start.lng, start.lat]), turf.point([end.lng, end.lat]));

        const newFeatures: any[] = [
          {
            type: "Feature",
            geometry: line.geometry,
            properties: { gkind: "line", color, width: 4, dash: 0 },
          },
          { type: "Feature", geometry: mid.geometry, properties: { gkind: "label", text: tool.taskId, color, rot: bearing } },
          { type: "Feature", geometry: { type: "Point", coordinates: [end.lng, end.lat] }, properties: { gkind: "arrow", bearing, color } },
        ];

        setTac({ type: "FeatureCollection", features: [...tacRef.current.features, ...newFeatures] });

        taskStartRef.current = null;
        setDraw({ type: "FeatureCollection", features: [] });
        return;
      }

      // ===== DEFENSIVE: add many points =====
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

        setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
      }
    };

    map.on("click", onClick);
    return () => map.off("click", onClick);
  }, []);

  // RIGHT CLICK to finish (CATK first, then DEF)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const finishCATK = () => {
      const pts = catkPtsRef.current;
      if (pts.length < 3) {
        // ต้องมีอย่างน้อย 3 จุดถึงจะเหมือนรูป
        isDrawingCatkRef.current = false;
        catkPtsRef.current = [];
        setDraw({ type: "FeatureCollection", features: [] });
        return;
      }

      const color = getTaskColor("CATK");

      // ปิดรูป: ต่อกลับจุดแรก
      const coords = pts.map((p) => [p.lng, p.lat] as [number, number]);
      const closed = [...coords, coords[0]];

      const id = uuidv4();

      const lineFeat: any = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: closed },
        properties: {
          gkind: "line",
          color,
          width: 4,
          dash: 1, // เส้นประ
          taskId: "CATK",
          id,
        },
      };

      // จุดมุมแดง
      const vertexPts: any[] = coords.map((c, idx) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: c },
        properties: { gkind: "task_pt", taskId: "CATK", idx, id },
      }));

      // label "CATK" หมุนตามแนวเส้น (ใช้ segment ที่ยาวสุด)
      const { mid, rot } = getLabelPointAndRotation(closed);
      const labelFeat: any = {
        type: "Feature",
        geometry: mid.geometry,
        properties: { gkind: "label", text: "CATK", color, rot },
      };

      setTac({
        type: "FeatureCollection",
        features: [...tacRef.current.features, lineFeat, labelFeat, ...vertexPts],
      });

      isDrawingCatkRef.current = false;
      catkPtsRef.current = [];
      setDraw({ type: "FeatureCollection", features: [] });
    };

    const finishDEF = (toolDefId: string) => {
      const pts = defPtsRef.current;
      if (pts.length < 2) {
        isDrawingDefRef.current = false;
        defPtsRef.current = [];
        setDraw({ type: "FeatureCollection", features: [] });
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
            properties: { gkind: "def_pt", pt: "x", rot: brg, color: COLOR_DEF },
          });
        }

        if (toolDefId === "trench") {
          patternPts.push({
            type: "Feature",
            geometry: a.geometry,
            properties: { gkind: "def_pt", pt: "tick", rot: brg + 90, color: COLOR_DEF },
          });
        }

        if (toolDefId === "teeth") {
          const p = a.geometry.coordinates as [number, number];
          const offset = turf.destination(turf.point(p), 0.8, brg + 90, { units: "kilometers" });
          patternPts.push({
            type: "Feature",
            geometry: offset.geometry,
            properties: { gkind: "def_pt", pt: "tooth", rot: brg, color: COLOR_DEF },
          });
        }
      }

      setTac({
        type: "FeatureCollection",
        features: [...tacRef.current.features, base, ...patternPts],
      });

      isDrawingDefRef.current = false;
      defPtsRef.current = [];
      setDraw({ type: "FeatureCollection", features: [] });
    };

    const onRightClick = (e: any) => {
      // กัน context menu
      e.originalEvent?.preventDefault?.();

      const tool = useToolStore.getState().tool;

      // 1) ถ้า CATK กำลังวาด → จบ CATK ก่อน
      if (tool.kind === "draw_task" && tool.taskId === "CATK" && isDrawingCatkRef.current) {
        finishCATK();
        return;
      }

      // 2) ถ้า Defensive กำลังวาด → จบ Defensive
      if (tool.kind === "draw_defensive") {
        finishDEF(tool.defId);
        return;
      }
    };

    map.on("contextmenu", onRightClick);
    return () => map.off("contextmenu", onRightClick);
  }, []);

  // ESC cancel
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;

      taskStartRef.current = null;

      isDrawingCatkRef.current = false;
      catkPtsRef.current = [];

      isDrawingDefRef.current = false;
      defPtsRef.current = [];

      setDraw({ type: "FeatureCollection", features: [] });
      useToolStore.getState().setTool({ kind: "none" });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
