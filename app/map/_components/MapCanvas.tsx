// app/map/components/MapCanvas.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import { useMapInit } from "@/hooks/useMapInit";
import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";

import type { FC, MapModuleCtx } from "./mapContext";

import { registerTactical } from "./Tactical";
import { registerFormations } from "./Formations";
import { registerEquipment } from "./Equipment";

import { MdDelete } from "react-icons/md";
import { FaCheck } from "react-icons/fa";

import MssSymbolEditor from "./MssSymbolEditor";
import { sidcToSvg } from "@/lib/milsymbol";
import { v4 as uuidv4 } from "uuid";

/* =========================
   Icon helpers
========================= */
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

async function ensureIconFromSvg(map: Map, iconId: string, svg: string, size = 96) {
  if (map.hasImage(iconId)) return;
  const data = await svgToImageData(svg, size);
  map.addImage(iconId, data, { pixelRatio: 2 });
}

/* =========================
   Sources & Layers
========================= */
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

  // ✅ Selection box overlay
  if (!map.getSource("sel-src")) {
    map.addSource("sel-src", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
  }
  if (!map.getLayer("sel-box")) {
    map.addLayer({
      id: "sel-box",
      type: "line",
      source: "sel-src",
      paint: {
        "line-color": "#facc15", // yellow-400
        "line-width": 3,
      },
    });
  }

  // commando icons
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
        "icon-rotate": ["coalesce", ["get", "rot"], 0],
      },
    });
  }

  // formation units
  if (!map.getLayer("tac-formation")) {
    map.addLayer({
      id: "tac-formation",
      type: "symbol",
      source: "tac-src",
      filter: ["==", ["get", "gkind"], "formation_unit"],
      layout: {
        "icon-image": ["get", "iconId"],
        "icon-size": ["coalesce", ["get", "iconSize"], 1.4],
        "icon-allow-overlap": true,
        "icon-rotation-alignment": "map",
        "icon-rotate": ["coalesce", ["get", "rot"], 0],
      },
    });
  }

  // equipment symbols
  if (!map.getLayer("tac-equipment")) {
    map.addLayer({
      id: "tac-equipment",
      type: "symbol",
      source: "tac-src",
      filter: ["==", ["get", "gkind"], "equipment_symbol"],
      layout: {
        "icon-image": ["get", "iconId"],
        "icon-size": ["coalesce", ["get", "iconSize"], 1.6],
        "icon-allow-overlap": true,
        "icon-rotation-alignment": "map",
        // ✅ หมุนได้/ไม่ได้ จะควบคุมตอน UI ไม่ใช่ layer (layer รับค่าจาก rot ได้เหมือนเดิม)
        "icon-rotate": ["coalesce", ["get", "rot"], 0],
      },
    });
  }

}

export default function MapCanvas() {
  const tac = useFeatureStore((s) => s.tac);
  const draw = useFeatureStore((s) => s.draw);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const tacRef = useRef<FC>({ type: "FeatureCollection", features: [] });
  const drawRef = useRef<FC>({ type: "FeatureCollection", features: [] });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // drag state
  const isDraggingSymbolRef = useRef(false);
  const draggingIdRef = useRef<string | null>(null);

  // rotate ui
  const [rotDeg, setRotDeg] = useState(0);

  // editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorDraft, setEditorDraft] = useState<any>(null);

  useMapInit(containerRef, mapRef);

  /* ---------- setters ---------- */
  const setTac = (next: FC) => {
    tacRef.current = next;
    const map = mapRef.current;
    if (!map) return;
    ensureSourcesAndLayers(map);
    (map.getSource("tac-src") as any)?.setData(next);
    useFeatureStore.getState().setTac(next);
  };

  const setDraw = (next: FC) => {
    drawRef.current = next;
    const map = mapRef.current;
    if (!map) return;
    ensureSourcesAndLayers(map);
    (map.getSource("draw-src") as any)?.setData(next);
    useFeatureStore.getState().setDraw(next);
  };

  const updateFeatureById = (id: string, patch: (f: any) => any) => {
    const next = tacRef.current.features.map((f: any) => {
      if (String(f?.properties?.id) !== id) return f;
      return patch(f);
    });
    setTac({ type: "FeatureCollection", features: next });
  };

  const selectedFeature = useMemo(() => {
    if (!selectedId) return null;
    return tacRef.current.features.find((f: any) => String(f?.properties?.id) === selectedId) as any;
  }, [selectedId, tac]);

  const selectedCanRotate = !!selectedFeature?.properties?.canRotate;

  /* ---------- selection box (yellow) ---------- */
  const setSelectedBox = (id: string | null) => {
    const map = mapRef.current;
    if (!map) return;

    ensureSourcesAndLayers(map);
    const src = map.getSource("sel-src") as any;
    if (!src) return;

    if (!id) {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const f = tacRef.current.features.find((x: any) => String(x?.properties?.id) === id) as any;
    if (!f || f.geometry?.type !== "Point") {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const [lng, lat] = f.geometry.coordinates;
    const p = map.project({ lng, lat });

    // ✅ ปรับขนาดกรอบไฮไลท์ได้ตรงนี้
    const half = 46;

    const tl = map.unproject([p.x - half, p.y - half]);
    const tr = map.unproject([p.x + half, p.y - half]);
    const br = map.unproject([p.x + half, p.y + half]);
    const bl = map.unproject([p.x - half, p.y + half]);

    src.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [tl.lng, tl.lat],
              [tr.lng, tr.lat],
              [br.lng, br.lat],
              [bl.lng, bl.lat],
              [tl.lng, tl.lat],
            ],
          },
          properties: {},
        },
      ],
    });
  };

  /* ---------- sync store -> refs ---------- */
  useEffect(() => {
    tacRef.current = tac as any;
  }, [tac]);
  useEffect(() => {
    drawRef.current = draw as any;
  }, [draw]);

  /* ---------- init + register modules ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // กัน dblclick zoom เพราะเราใช้ dblclick เปิด editor
    map.doubleClickZoom.disable();

    let cleanups: Array<() => void> = [];

    const onLoad = async () => {
      ensureSourcesAndLayers(map);

      (map.getSource("tac-src") as any)?.setData(tacRef.current);
      (map.getSource("draw-src") as any)?.setData(drawRef.current);

      const ctx: MapModuleCtx = {
        map,
        tacRef,
        drawRef,
        setTac,
        setDraw,
        ensureSourcesAndLayers,
        ensureIconFromSvg,
      };

      cleanups.push(await registerTactical(ctx));
      cleanups.push(await registerFormations(ctx));
      cleanups.push(await registerEquipment(ctx));
    };

    if (map.loaded()) onLoad();
    else map.once("load", onLoad);

    return () => {
      cleanups.forEach((fn) => fn?.());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- click select ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const PICK_LAYERS = ["tac-formation", "tac-commando", "tac-equipment"];

    const pick = (e: any) => {
      const hits = map.queryRenderedFeatures(e.point, { layers: PICK_LAYERS as any });
      const hit = hits?.[0] as any;
      if (!hit?.properties?.id) return null;
      return String(hit.properties.id);
    };

    const onClick = async (e: any) => {
      const tool = useToolStore.getState().tool;

      // ถ้ากำลังวาง/วาดอยู่ ไม่ต้อง select
      const busy =
        tool.kind === "draw_task" ||
        tool.kind === "draw_defensive" ||
        tool.kind === "draw_area" ||
        tool.kind === "place_symbol" ||
        tool.kind === "place_commando" ||
        (tool as any).kind === "place_formation_unit" ||
        (tool as any).kind === "place_equipment_symbol";

      if (busy) return;

      const id = pick(e);
      setSelectedId(id);
      setSelectedBox(id);

      if (id) {
        const f = tacRef.current.features.find((x: any) => String(x?.properties?.id) === id) as any;
        setRotDeg(Number(f?.properties?.rot ?? 0));
      } else {
        setRotDeg(0);
      }
      if (tool.kind === "place_formation_unit") {
        const sidc = tool.symbolCode?.trim();
        if (sidc) {
          const iconId = makeIconId(sidc);
          const svg = sidcToSvg(sidc, { size: 96 });
          await ensureIconFromSvg(map, iconId, svg, 96);

          const feat: any = {
            type: "Feature",
            geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] },
            properties: {
              gkind: "formation_unit",
              id: uuidv4(),
              iconId,
              iconSize: tool.iconSize ?? 1.4,
              symbolCode: sidc,
              rot: 0,
              canRotate: true,
            },
          };

          setTac({ type: "FeatureCollection", features: [...tacRef.current.features, feat] });
          return;
        }

        // fallback: ถ้าไม่มี sidc ค่อยไปใช้ svg/thumb แบบเดิม
      }
    };

    map.on("click", onClick);
    return () => { map.off("click", onClick); };
  }, []);

  /* ---------- keep box in place while moving map ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMove = () => {
      if (!selectedId) return;
      setSelectedBox(selectedId);
    };

    map.on("move", onMove);
    return () => { map.off("move", onMove); }
  }, [selectedId]);

  /* ---------- drag move selected ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const DRAG_LAYERS = ["tac-formation", "tac-commando", "tac-equipment"];

    const onMouseDown = (e: any) => {
      if (!selectedId) return;

      const hits = map.queryRenderedFeatures(e.point, { layers: DRAG_LAYERS as any });
      const hit = hits?.[0] as any;
      const id = String(hit?.properties?.id ?? "");
      if (!id || id !== selectedId) return;

      e.preventDefault();
      isDraggingSymbolRef.current = true;
      draggingIdRef.current = id;
      map.dragPan.disable();
    };

    const onMouseMove = (e: any) => {
      if (!isDraggingSymbolRef.current) return;
      const id = draggingIdRef.current;
      if (!id) return;

      updateFeatureById(id, (f) => ({
        ...f,
        geometry: { type: "Point", coordinates: [e.lngLat.lng, e.lngLat.lat] },
      }));

      // update highlight box realtime
      setSelectedBox(id);
    };

    const onMouseUp = () => {
      if (!isDraggingSymbolRef.current) return;
      isDraggingSymbolRef.current = false;
      draggingIdRef.current = null;
      map.dragPan.enable();
    };

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      map.dragPan.enable();
    };
  }, [selectedId]);

  /* ---------- dblclick open editor ---------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const EDIT_LAYERS = ["tac-formation", "tac-commando", "tac-equipment"];

    const onDblClick = (e: any) => {
      e.preventDefault();

      const hits = map.queryRenderedFeatures(e.point, { layers: EDIT_LAYERS as any });
      const hit = hits?.[0] as any;
      if (!hit?.properties?.id) return;

      const id = String(hit.properties.id);
      const f = tacRef.current.features.find((x: any) => String(x?.properties?.id) === id) as any;
      if (!f) return;

      setSelectedId(id);
      setSelectedBox(id);

      setEditorId(id);
      setEditorOpen(true);

      setEditorDraft({
        id,
        label: f.properties?.label ?? "",
        rot: Number(f.properties?.rot ?? 0),
        iconSize: Number(f.properties?.iconSize ?? 1.4),
        // สำหรับ MSS / SIDC
        sidc: f.properties?.symbolCode ?? f.properties?.sidc ?? "",
        symbolCode: f.properties?.symbolCode ?? "",
        gkind: f.properties?.gkind ?? "",
        canRotate: !!f.properties?.canRotate,
      });
    };

    map.on("dblclick", onDblClick);
    return () => { map.off("dblclick", onDblClick); }
  }, []);

  /* ---------- editor apply ---------- */
  const makeIconId = (sidc: string) => `sidc:${sidc}`;

  const applyEditor = async () => {
    if (!editorId || !editorDraft) return;

    // ถ้าแก้ SIDC → อัปเดตรูป (เป็น SVG)
    const nextSidc = editorDraft.symbolCode || editorDraft.sidc || "";
    if (nextSidc) {
      const map = mapRef.current;
      if (map) {
        const iconId = makeIconId(nextSidc);
        const svg = sidcToSvg(nextSidc, { size: 96 });
        await ensureIconFromSvg(map, iconId, svg, 96);

        updateFeatureById(editorId, (f) => ({
          ...f,
          properties: {
            ...f.properties,
            iconId,
            symbolCode: nextSidc,
            label: editorDraft.label ?? f.properties?.label,
            iconSize: Number(editorDraft.iconSize ?? f.properties?.iconSize ?? 1.4),
            // rot apply เฉพาะที่หมุนได้
            rot: f.properties?.canRotate ? Number(editorDraft.rot ?? f.properties?.rot ?? 0) : (f.properties?.rot ?? 0),
          },
        }));
      }

    } else {
      // ไม่มี sidc ก็อัปเดต label/iconSize/rot ตามเดิม
      updateFeatureById(editorId, (f) => ({
        ...f,
        properties: {
          ...f.properties,
          label: editorDraft.label ?? f.properties?.label,
          iconSize: Number(editorDraft.iconSize ?? f.properties?.iconSize ?? 1.4),
          rot: f.properties?.canRotate ? Number(editorDraft.rot ?? f.properties?.rot ?? 0) : (f.properties?.rot ?? 0),
        },
      }));
    }

    setEditorOpen(false);
    setEditorId(null);
    setEditorDraft(null);
  };

  /* ---------- toolbar actions ---------- */
  const deleteSelected = () => {
    if (!selectedId) return;
    const next = tacRef.current.features.filter((f: any) => String(f?.properties?.id) !== selectedId);
    setTac({ type: "FeatureCollection", features: next });
    setSelectedId(null);
    setSelectedBox(null);
    setRotDeg(0);
  };

  const doneSelected = () => {
    setSelectedId(null);
    setSelectedBox(null);
    setRotDeg(0);
    useToolStore.getState().setTool({ kind: "none" } as any);
  };

  /* ---------- clear event ---------- */
  useEffect(() => {
    const onClear = () => {
      setSelectedId(null);
      setSelectedBox(null);
      setRotDeg(0);
      useToolStore.getState().setTool({ kind: "none" } as any);

      setTac({ type: "FeatureCollection", features: [] });
      setDraw({ type: "FeatureCollection", features: [] });

      mapRef.current?.dragPan.enable();
    };

    window.addEventListener("map:clear", onClear);
    return () => window.removeEventListener("map:clear", onClear);
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* toolbar */}
      {selectedId ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[10] -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:scale-95"
              onClick={doneSelected}
              title="Done"
            >
              <FaCheck size={22} className="text-green-500" />
            </button>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 active:scale-95"
              onClick={deleteSelected}
              title="Delete"
            >
              <MdDelete size={22} className="text-red-500" />
            </button>

            {/* Rotate: แสดงเฉพาะที่หมุนได้ */}
            {selectedCanRotate ? (
              <div className="ml-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
                <span className="text-xs text-gray-600">Rotate</span>
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={rotDeg}
                  onChange={(e) => {
                    const deg = Number(e.target.value);
                    setRotDeg(deg);
                    updateFeatureById(selectedId, (f) => ({
                      ...f,
                      properties: { ...f.properties, rot: deg },
                    }));
                  }}
                  className="w-32"
                />
                <span className="text-xs tabular-nums text-gray-700">{rotDeg}°</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* map */}
      <div ref={containerRef} className="h-full w-full" onContextMenu={(e) => e.preventDefault()} />

      {/* MSS editor */}
      <MssSymbolEditor
        open={editorOpen}
        draft={editorDraft}
        onChange={setEditorDraft}
        onApply={applyEditor}
        onClose={() => {
          setEditorOpen(false);
          setEditorId(null);
          setEditorDraft(null);
        }}
      />
    </div>
  );
}