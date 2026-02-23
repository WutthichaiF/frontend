"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map } from "maplibre-gl";
import * as turf from "@turf/turf";
import { v4 as uuidv4 } from "uuid";

import { useMapInit } from "@/hooks/useMapInit";
import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";

import { MdCheck, MdDelete, MdDeleteOutline } from "react-icons/md";

import type {
    Feature,
    FeatureCollection,
    LineString,
    Point as GPoint,
    Geometry,
} from "geojson";

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

async function ensureIconFromSvg(map: Map, iconId: string, svg: string, size = 96) {
    if (map.hasImage(iconId)) return;
    const data = await svgToImageData(svg, size);
    map.addImage(iconId, data, { pixelRatio: 2 });
}

async function ensureFormationIcons(map: Map) {
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
function ensureSourcesAndLayers(map: Map) {
    if (!map.getSource("tac-src")) {
        map.addSource("tac-src", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: [],
            },
        });
    }

    if (!map.getSource("draw-src")) {
        map.addSource("draw-src", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
        });
    }

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

    if (!map.getLayer("tac-area")) {
        map.addLayer({
            id: "tac-area",
            type: "fill",
            source: "tac-src",
            filter: ["==", ["get", "gkind"], "area"],
            paint: {
                "fill-color": "#000000",
                "fill-opacity": 0,
            },
        });
    }

    if (!map.getLayer("tac-area-outline")) {
        map.addLayer({
            id: "tac-area-outline",
            type: "line",
            source: "tac-src",
            filter: ["==", ["get", "gkind"], "area"],
            paint: {
                "line-color": ["get", "color"],
                "line-width": 3,
            },
        });
    }

    if (!map.getLayer("tac-area-label")) {
        map.addLayer({
            id: "tac-area-label",
            type: "symbol",
            source: "tac-src",
            filter: ["==", ["get", "gkind"], "area_label"],
            layout: {
                "text-field": ["get", "text"],
                "text-size": 12,
                "text-allow-overlap": true,
            },
            paint: { "text-color": ["get", "color"], "text-halo-color": "#fff", "text-halo-width": 1 },
        });
    }

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

    if (!map.getLayer("tac-commando")) {
        map.addLayer({
            id: "tac-commando",
            type: "symbol",
            source: "tac-src",
            filter: ["==", ["get", "gkind"], "commando_icon"],
            layout: {
                "icon-image": ["get", "iconId"],
                "icon-size": ["coalesce", ["get", "iconSize"], 1.4],
                "icon-allow-overlap": true,
                "icon-rotation-alignment": "map",
            },
        });
    }
    //  Formation units
    if (!map.getLayer("tac-formation")) {
        map.addLayer({
            id: "tac-formation",
            type: "symbol",
            source: "tac-src",
            filter: ["==", ["get", "gkind"], "formation_unit"],
            layout: {
                "icon-image": ["get", "iconId"],
                "icon-size": ["coalesce", ["get", "iconSize"], 1],
                "icon-allow-overlap": true,
                "icon-rotation-alignment": "map",
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

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

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

function bearingDeg(a: [number, number], b: [number, number]) {
    return turf.bearing(turf.point(a), turf.point(b));
}

function buildWpRFeatures(
    map: Map,
    taskId: "WP" | "R",
    id: string,
    pts: [number, number][],
    color: string
) {
    const [p0, p1, p2] = pts;
    const baseBrg = bearingDeg(p0, p1);

    const P1 = map.project({ lng: p1[0], lat: p1[1] });
    const P2 = map.project({ lng: p2[0], lat: p2[1] });
    const Cx = (P1.x + P2.x) / 2;
    const Cy = (P1.y + P2.y) / 2;
    const R = Math.hypot(P2.x - P1.x, P2.y - P1.y) / 2;

    const P0 = map.project({ lng: p0[0], lat: p0[1] });
    const dx = P1.x - P0.x;
    const dy = P1.y - P0.y;

    const crossZ = dx * (Cy - P1.y) - dy * (Cx - P1.x);
    const a1 = Math.atan2(P1.y - Cy, P1.x - Cx);
    const a2 = Math.atan2(P2.y - Cy, P2.x - Cx);

    const STEPS = 64;
    const arcPts: [number, number][] = [];

    const ccw = crossZ > 0;
    let startAng = a1;
    let endAng = a2;

    if (ccw) while (endAng < startAng) endAng += Math.PI * 2;
    else while (endAng > startAng) endAng -= Math.PI * 2;

    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const ang = startAng + (endAng - startAng) * t;
        const x = Cx + Math.cos(ang) * R;
        const y = Cy + Math.sin(ang) * R;
        const ll = map.unproject([x, y]);
        arcPts.push([ll.lng, ll.lat]);
    }

    const coords: [number, number][] = [p0, p1, ...arcPts.slice(1)];
    const lx = (p0[0] + p1[0]) / 2;
    const ly = (p0[1] + p1[1]) / 2;
    const arrowBearing = bearingDeg(p1, p0);

    const lineFeat: any = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: { gkind: "line", taskId, id, color, width: 4, dash: 0 },
    };

    const labelFeat: any = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lx, ly] },
        properties: { gkind: "label", text: taskId, color, rot: baseBrg, id, taskId },
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

function getAnchorOfGeometry(geom: Geometry): [number, number] | null {
    try {
        if (geom.type === "Point") return geom.coordinates as any;
        if (geom.type === "LineString") {
            const mid = turf.along(turf.lineString(geom.coordinates as any), 0.5 * turf.length(turf.lineString(geom.coordinates as any), { units: "kilometers" }), { units: "kilometers" });
            return mid.geometry.coordinates as any;
        }
        if (geom.type === "MultiLineString") {
            const all = (geom.coordinates as any).flat();
            if (!all?.length) return null;
            const ls = turf.lineString(all);
            const mid = turf.along(ls, 0.5 * turf.length(ls, { units: "kilometers" }), { units: "kilometers" });
            return mid.geometry.coordinates as any;
        }
        if (geom.type === "Polygon") {
            const c = turf.centroid(turf.polygon(geom.coordinates as any));
            return c.geometry.coordinates as any;
        }
        if (geom.type === "MultiPolygon") {
            const c = turf.centroid(turf.multiPolygon(geom.coordinates as any));
            return c.geometry.coordinates as any;
        }
        return null;
    } catch {
        return null;
    }
}

export default function MapCanvas() {
    const tac = useFeatureStore((s) => s.tac);
    const draw = useFeatureStore((s) => s.draw);
    const setTacStore = useFeatureStore((s) => s.setTac);
    const setDrawStore = useFeatureStore((s) => s.setDraw);
    const clearStore = useFeatureStore((s) => s.clear);

    const clearAll = () => {
        setTac({ type: "FeatureCollection", features: [] });
        setDraw({ type: "FeatureCollection", features: [] });

        // reset state ที่ค้าง
        taskStartRef.current = null;
        isDraggingCATKRef.current = false;
        catkStartRef.current = null;
        isDrawingDefRef.current = false;
        defPtsRef.current = [];
        setSelectedId(null);
        hideFloating();

        useToolStore.getState().setTool({ kind: "none" });
    };
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<Map | null>(null);

    const tacRef = useRef<FC>({ type: "FeatureCollection", features: [] });
    const drawRef = useRef<FC>({ type: "FeatureCollection", features: [] });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    // WP/R (2 clicks)
    const taskStartRef = useRef<LngLat | null>(null);

    // DEF
    const defPtsRef = useRef<LngLat[]>([]);
    const isDrawingDefRef = useRef(false);

    // CATK (drag)
    const catkStartRef = useRef<LngLat | null>(null);
    const isDraggingCATKRef = useRef(false);

    useMapInit(containerRef, mapRef);

    const setTac = (next: FC) => {
        tacRef.current = next;
        const map = mapRef.current;
        if (!map) return;
        ensureSourcesAndLayers(map);
        (map.getSource("tac-src") as any)?.setData(next);
    };

    const setDraw = (next: FC) => {
        drawRef.current = next;
        const map = mapRef.current;
        if (!map) return;
        ensureSourcesAndLayers(map);
        (map.getSource("draw-src") as any)?.setData(next);
    };

    // ===== Floating Toolbar state =====
    const [floating, setFloating] = useState<{
        show: boolean;
        id: string | null;
        x: number;
        y: number;
    }>({ show: false, id: null, x: 0, y: 0 });

    const hideFloating = () => setFloating({ show: false, id: null, x: 0, y: 0 });

    const positionFloatingAbove = (lnglat: [number, number]) => {
        const map = mapRef.current;
        if (!map) return;

        const p = map.project({ lng: lnglat[0], lat: lnglat[1] });
        // ✅ ยกขึ้นด้านบนเหมือนรูป (ปรับได้)
        const offsetY = 46;

        setFloating((prev) => ({
            ...prev,
            show: true,
            x: p.x,
            y: p.y - offsetY,
        }));
    };

    const deleteById = (id: string) => {
        const next = tacRef.current.features.filter((f: any) => String(f?.properties?.id) !== id);
        setTac({ type: "FeatureCollection", features: next });
        hideFloating();
    };

    // init
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const onLoad = async () => {
            await ensureFormationIcons(map);
            await ensureIcons(map);
            ensureSourcesAndLayers(map);
            setTac(tacRef.current);
            setDraw(drawRef.current);
        };

        if (map.loaded()) onLoad();
        else map.once("load", onLoad);
    }, []);

    // ✅ คลิกเลือกชิ้นงาน เพื่อโชว์ toolbar ด้านบน
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const PICK_LAYERS = [
            "tac-area-outline",
            "tac-line",
            "tac-label",
            "tac-arrow",
            "tac-commando",
            // ไม่ให้ ctrl point เป็นตัวเลือกหลัก (แต่จะเลือกได้ถ้าต้องการก็เพิ่ม "tac-task-pts")
        ];

        const onClickPick = (e: any) => {
            const tool = useToolStore.getState().tool;

            // ถ้าอยู่ในโหมดวาดอยู่ ให้ไม่ pick (กันชนกับการวาด)
            if (tool.kind === "draw_task" || tool.kind === "draw_defensive") return;

            const hits = map.queryRenderedFeatures(e.point, { layers: PICK_LAYERS as any });
            const hit = hits?.[0] as any;

            if (!hit) {
                hideFloating();
                return;
            }

            const id = String(hit?.properties?.id ?? "");
            if (!id) {
                hideFloating();
                return;
            }

            // หา anchor จาก geometry ของ hit (centroid/midpoint)
            const anchor = getAnchorOfGeometry(hit.geometry as any) ?? [e.lngLat.lng, e.lngLat.lat];

            setFloating((prev) => ({
                ...prev,
                show: true,
                id,
            }));
            positionFloatingAbove(anchor as any);
        };

        map.on("click", onClickPick);

        // ถ้า map ขยับ/zoom ให้ toolbar ตามไปด้วย
        const onMove = () => {
            if (!floating.show || !floating.id) return;

            const one = tacRef.current.features.find((f: any) => String(f?.properties?.id) === floating.id) as any;
            if (!one) return hideFloating();

            const anchor = getAnchorOfGeometry(one.geometry as any);
            if (!anchor) return;

            positionFloatingAbove(anchor as any);
        };

        map.on("move", onMove);

        return () => {
            map.off("click", onClickPick);
            map.off("move", onMove);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floating.show, floating.id]);

    // cursor + disable zoom/pan while drawing
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

            if (t.kind === "draw_task" && t.taskId === "CATK" && isDraggingCATKRef.current) map.dragPan.disable();
            else map.dragPan.enable();
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

            const feat: any = {
                type: "Feature",
                geometry: { type: "Point", coordinates: [lng, lat] },
                properties: {
                    gkind: "symbol",
                    id,
                    sidc: tool.sidc,
                    label: tool.label ?? "",
                },
            };

            setTac({
                type: "FeatureCollection",
                features: [...tacRef.current.features, feat],
            });
        };

        map.on("click", onClick);
        return () => { map.off("click", onClick); };
    }, []);

    // place_commando
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const onClick = async (e: any) => {
            const tool = useToolStore.getState().tool;
            if (tool.kind !== "place_commando") return;

            const id = uuidv4();
            const lng = e.lngLat.lng;
            const lat = e.lngLat.lat;

            await ensureIconFromSvg(map, (tool as any).iconId, (tool as any).svg, 110);

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

            setTac({
                type: "FeatureCollection",
                features: [...tacRef.current.features, feat],
            });
        };

        map.on("click", onClick);
        return () => { map.off("click", onClick); };
    }, []);

    // ===== WP/R preview (mousemove) =====
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const onMove = (e: any) => {
            const tool = useToolStore.getState().tool;

            if (tool.kind === "draw_task" && tool.taskId !== "CATK") {
                if (!taskStartRef.current) return;

                const start = taskStartRef.current;
                const end = { lng: e.lngLat.lng, lat: e.lngLat.lat };
                const color = getTaskColor(tool.taskId);

                setDraw({
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

        map.on("mousemove", onMove);
        return () => { map.off("mousemove", onMove); };
    }, []);

    // ===== DEF preview mousemove =====
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const onMove = (e: any) => {
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

            setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
        };

        map.on("mousemove", onMove);
        return () => { map.off("mousemove", onMove); };
    }, []);

    // ===== CLICK logic (WP/R + DEF add points) =====
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const onClick = (e: any) => {
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

                const p2 = turf.destination(
                    turf.point(p1),
                    dist,
                    baseBrg - 90,
                    { units: "kilometers" }
                ).geometry.coordinates as [number, number];

                const id = uuidv4();
                const color = getTaskColor(tool.taskId);

                const feats = buildWpRFeatures(map, tool.taskId as "WP" | "R", id, [p0, p1, p2], color);

                setTac({
                    type: "FeatureCollection",
                    features: [...tacRef.current.features, ...feats],
                });

                taskStartRef.current = null;
                setDraw({ type: "FeatureCollection", features: [] });
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

                setDraw({ type: "FeatureCollection", features: [previewLine, ...previewPts] });
            }
        };

        map.on("click", onClick);
        return () => { map.off("click", onClick); };
    }, []);

    // ===== CATK drag: mousedown/mousemove/mouseup =====
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const previewCATK = (start: LngLat, end: LngLat) => {
            const built = buildCATK2525([start.lng, start.lat], [end.lng, end.lat]);
            if (!built) return;

            const preview: any = {
                type: "Feature",
                geometry: built.geometry,
                properties: { gkind: "draw_line", color: COLOR_CATK },
            };

            setDraw({ type: "FeatureCollection", features: [preview] });
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

            setTac({
                type: "FeatureCollection",
                features: [...tacRef.current.features, lineFeat, labelFeat, ...vertexPts],
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
            setDraw({ type: "FeatureCollection", features: [] });
        };

        map.on("mousedown", onMouseDown);
        map.on("mousemove", onMouseMove);
        map.on("mouseup", onMouseUp);

        return () => {
            map.off("mousedown", onMouseDown);
            map.off("mousemove", onMouseMove);
            map.off("mouseup", onMouseUp);
        };
    }, []);

    // ===== RIGHT CLICK finish defensive =====
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

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
                properties: { gkind: "line", color: COLOR_DEF, width: 4, dash: 0, defId: toolDefId, id },
            } as any;

            const ptsAlong = samplePointsAlongLine(baseLine as any, Math.max(0.3, turf.length(baseLine) / 40));
            const patternPts: any[] = [];

            for (let i = 0; i < ptsAlong.length - 1; i++) {
                const a = ptsAlong[i];
                const b = ptsAlong[i + 1];
                const brg = lineBearing(a as any, b as any);

                if (toolDefId === "xline") {
                    patternPts.push({ type: "Feature", geometry: a.geometry, properties: { gkind: "def_pt", pt: "x", rot: brg, color: COLOR_DEF, id } });
                }
                if (toolDefId === "trench") {
                    patternPts.push({ type: "Feature", geometry: a.geometry, properties: { gkind: "def_pt", pt: "tick", rot: brg + 90, color: COLOR_DEF, id } });
                }
                if (toolDefId === "teeth") {
                    const p = a.geometry.coordinates as [number, number];
                    const offset = turf.destination(turf.point(p), 0.8, brg + 90, { units: "kilometers" });
                    patternPts.push({ type: "Feature", geometry: offset.geometry, properties: { gkind: "def_pt", pt: "tooth", rot: brg, color: COLOR_DEF, id } });
                }
            }

            setTac({ type: "FeatureCollection", features: [...tacRef.current.features, base, ...patternPts] });

            isDrawingDefRef.current = false;
            defPtsRef.current = [];
            setDraw({ type: "FeatureCollection", features: [] });
        };

        const onRightClick = (e: any) => {
            e.originalEvent?.preventDefault?.();
            const tool = useToolStore.getState().tool;
            if (tool.kind === "draw_defensive") finishDEF(tool.defId);
        };

        map.on("contextmenu", onRightClick);
        return () => { map.off("contextmenu", onRightClick); };
    }, []);

    // ESC cancel
    useEffect(() => {
        const map = mapRef.current;

        const onKeyDown = (ev: KeyboardEvent) => {
            if (ev.key !== "Escape") return;

            taskStartRef.current = null;

            isDraggingCATKRef.current = false;
            catkStartRef.current = null;

            isDrawingDefRef.current = false;
            defPtsRef.current = [];

            setDraw({ type: "FeatureCollection", features: [] });
            useToolStore.getState().setTool({ kind: "none" });

            map?.dragPan.enable();
            hideFloating();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const onClick = async (e: any) => {
            const tool = useToolStore.getState().tool;
            if (tool.kind !== "place_formation_unit") return;

            const id = uuidv4();

            // ✅ เพิ่ม: สร้าง icon จาก svg ที่เลือก
            await ensureIconFromSvg(map, tool.iconId, tool.svg, 110);

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

            setTac({
                type: "FeatureCollection",
                features: [...tacRef.current.features, feat],
            });
        };

        map.on("click", onClick);
        return () => {map.off("click", onClick);}
    }, []);

    // =========================
    // ✅ (A) CLICK เพื่อ “เลือก” symbol บนแผนที่
    // =========================
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const pickEditable = (e: any) => {
            // 🔧 เลือกเฉพาะ layer ที่เป็น “สัญลักษณ์จุด” ของคุณ
            // เพิ่ม/ลดได้ตามที่คุณอยากให้แก้ได้
            const layers = [
                "tac-formation",
                "tac-commando",
                // ถ้าจะให้เลือก label/line ได้ด้วย ค่อยเพิ่ม:
                // "tac-label", "tac-line"
            ];

            const hits = map.queryRenderedFeatures(e.point, { layers });
            const hit = hits?.[0];
            if (!hit) return null;

            const pid = hit?.properties?.id;
            if (!pid) return null;

            return String(pid);
        };

        const onClick = (e: any) => {
            // ถ้ากำลังอยู่ในโหมดวาง/วาด ให้ไม่ไป “เลือกแก้ไข” (กันชนกัน)
            const tool = useToolStore.getState().tool;
            const busy =
                tool.kind === "draw_task" ||
                tool.kind === "draw_defensive" ||
                tool.kind === "draw_area" ||
                tool.kind === "place_symbol" ||
                tool.kind === "place_commando" ||
                (tool as any).kind === "place_formation_unit";

            if (busy) return;

            const id = pickEditable(e);
            setSelectedId(id); // ถ้า null = click พื้นที่ว่าง จะปิด toolbar
        };

        map.on("click", onClick);
        return () => {
            map.off("click", onClick);
        };
    }, []);
    const deleteSelected = () => {
        if (!selectedId) return;

        const next = tacRef.current.features.filter((f: any) => String(f?.properties?.id) !== selectedId);
        setTac({ type: "FeatureCollection", features: next });
        setSelectedId(null);
    };

    // =========================
    // ✅ (C) Done: ออกจากการแก้ไข
    // =========================
    const doneSelected = () => {
        setSelectedId(null);
        useToolStore.getState().setTool({ kind: "none" }); // กลับ pointer
    };
    useEffect(() => { tacRef.current = tac; }, [tac]);
    useEffect(() => { drawRef.current = draw; }, [draw]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const apply = () => {
            ensureSourcesAndLayers(map);
            (map.getSource("tac-src") as any)?.setData(tac);
        };

        if (map.isStyleLoaded()) apply();
        else map.once("load", apply);
    }, [tac]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const apply = () => {
            ensureSourcesAndLayers(map);
            (map.getSource("draw-src") as any)?.setData(draw);
        };

        if (map.isStyleLoaded()) apply();
        else map.once("load", apply);
    }, [draw]);

    useEffect(() => {
        const onClear = () => {
            taskStartRef.current = null;

            isDraggingCATKRef.current = false;
            catkStartRef.current = null;

            isDrawingDefRef.current = false;
            defPtsRef.current = [];

            setSelectedId(null);
            hideFloating();

            const map = mapRef.current;
            map?.dragPan.enable();
        };

        window.addEventListener("map:clear", onClear);
        return () => window.removeEventListener("map:clear", onClear);
    }, []);
    useEffect(() => {
        if (tac.features.length === 0 && draw.features.length === 0) {
            setSelectedId(null);
            hideFloating();
            taskStartRef.current = null;
            isDraggingCATKRef.current = false;
            catkStartRef.current = null;
            isDrawingDefRef.current = false;
            defPtsRef.current = [];
            useToolStore.getState().setTool({ kind: "none" });
        }
    }, [tac, draw]);
    return (
        <div className="relative h-full w-full">
            {/* ✅ toolbar โผล่เฉพาะตอนเลือกสัญลักษณ์ */}
            {selectedId ? (
                <div className="pointer-events-none absolute left-1/2 top-3 z-[9999] -translate-x-1/2">
                    <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-2 py-2 shadow-lg ring-1 ring-black/10 backdrop-blur">
                        <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:scale-95"
                            onClick={doneSelected}
                            title="Done"
                        >
                            <MdCheck size={22} />
                        </button>

                        <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:scale-95"
                            onClick={deleteSelected}
                            title="Delete"
                        >
                            <MdDeleteOutline size={22} />
                        </button>
                    </div>
                </div>
            ) : null}

            {/* map */}
            <div ref={containerRef} className="h-full w-full" onContextMenu={(e) => e.preventDefault()} />
        </div>
    );
}