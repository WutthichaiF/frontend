// app/map/components/MapCanvas.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import { useMapInit } from "@/hooks/useMapInit";
import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";
import type { FC } from "./mapContext";
import type { FeatureCollection } from "geojson";

import { registerTactical } from "./Tactical";
import { registerFormations } from "./Formations";
import type { MapModuleCtx } from "./mapContext";

import { MdDelete } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import { registerEquipment } from "./Equipment";

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

async function ensureIconFromUrl(map: Map, iconId: string, url: string, size = 110) {
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
  
  // tac line
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
      paint: {
        "text-color": ["get", "color"],
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      },
    });
  }

  // arrow
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
      paint: {
        "text-color": ["get", "color"],
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      },
    });
  }

  // ctrl/task points
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

  // draw preview
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
      },
    });
  }

  // Highlight commando
  if (!map.getLayer("tac-commando-hl")) {
    try {
      map.addLayer(
        {
          id: "tac-commando-hl",
          type: "symbol",
          source: "tac-src",
          filter: ["all", ["==", ["get", "gkind"], "commando_icon"], ["==", ["get", "selected"], 1]],
          layout: {
            "icon-image": ["get", "iconId"],
            "icon-size": ["+", ["coalesce", ["get", "iconSize"], 1.4], 0.18],
            "icon-allow-overlap": true,
            "icon-rotation-alignment": "map",
            "icon-rotate": ["coalesce", ["get", "rot"], 0],
          },
          paint: { "icon-opacity": 0.55, "icon-color": "#7c3aed" } as any,
        },
        "tac-commando"
      );
    } catch {
      map.addLayer({
        id: "tac-commando-hl",
        type: "symbol",
        source: "tac-src",
        filter: ["all", ["==", ["get", "gkind"], "commando_icon"], ["==", ["get", "selected"], 1]],
        layout: {
          "icon-image": ["get", "iconId"],
          "icon-size": ["+", ["coalesce", ["get", "iconSize"], 1.4], 0.18],
          "icon-allow-overlap": true,
          "icon-rotation-alignment": "map",
          "icon-rotate": ["coalesce", ["get", "rot"], 0],
        },
        paint: { "icon-opacity": 0.55, "icon-color": "#7c3aed" } as any,
      });
    }
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
  const isDraggingSymbolRef = useRef(false);
  const draggingIdRef = useRef<string | null>(null);
  const [rotDeg, setRotDeg] = useState(0);

  useMapInit(containerRef, mapRef);

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
  const setSelectedBox = (id: string | null) => {
    const map = mapRef.current;
    if (!map) return;

    const src = map.getSource("sel-src") as any;
    if (!src) return;

    if (!id) {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const f = tacRef.current.features.find((x: any) => String(x?.properties?.id) === id);
    if (!f || f.geometry?.type !== "Point") {
      src.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const [lng, lat] = f.geometry.coordinates;
    const p = map.project({ lng, lat });

    // ✅ ขนาดกรอบ (px) ปรับได้
    const half = 44;

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
  const updateFeatureById = (id: string, patch: (f: any) => any) => {
    const next = tacRef.current.features.map((f: any) => {
      if (String(f?.properties?.id) !== id) return f;
      return patch(f);
    });
    setTac({ type: "FeatureCollection", features: next });
  };

  const setSelectedOnFeatures = (id: string | null) => {
    const next = tacRef.current.features.map((f: any) => {
      const fid = String(f?.properties?.id ?? "");
      const sel = id && fid === id;
      return { ...f, properties: { ...f.properties, selected: sel ? 1 : 0 } };
    });
    setTac({ type: "FeatureCollection", features: next });
  };

  // sync from store -> refs
  useEffect(() => {
    tacRef.current = tac as any;
  }, [tac]);
  useEffect(() => {
    drawRef.current = draw as any;
  }, [draw]);

  // init + register modules
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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

  // click to select editable symbol (formation/commando)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const pickEditable = (e: any) => {
      const layers = ["tac-formation", "tac-commando", "tac-equipment"];
      const hits = map.queryRenderedFeatures(e.point, { layers: layers as any });
      const hit = hits?.[0] as any;
      if (!hit?.properties?.id) return null;
      return String(hit.properties.id);
    };

    const onClick = (e: any) => {
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

      setSelectedId(id);
      setSelectedOnFeatures(id);
      setSelectedBox(id);
      if (id) {
        const one = tacRef.current.features.find((f: any) => String(f?.properties?.id) === id) as any;
        setRotDeg(Number(one?.properties?.rot ?? 0));
      } else {
        setRotDeg(0);
      }
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
    setSelectedOnFeatures(null);
    setSelectedBox(null);
    setRotDeg(0);
  };

  const doneSelected = () => {
    setSelectedId(null);
    setSelectedOnFeatures(null);
    setSelectedBox(null);
    setRotDeg(0);
    useToolStore.getState().setTool({ kind: "none" } as any);
  };

  // clear event from sidebar
  useEffect(() => {
    const onClear = () => {
      setSelectedId(null);
      setSelectedOnFeatures(null);
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

  // Drag move selected symbol
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

  const selectedFeature =
    selectedId
      ? (tacRef.current.features.find((f: any) => String(f?.properties?.id) === selectedId) as any)
      : null;

  const isSelectedEquipment = selectedFeature?.properties?.gkind === "equipment_symbol";

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

            {/* Rotate */}
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
          </div>
        </div>
      ) : null}

      {/* map */}
      <div ref={containerRef} className="h-full w-full" onContextMenu={(e) => e.preventDefault()} />
    </div>
  );
}