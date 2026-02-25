// app/map/components/MapCanvas.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Map } from "maplibre-gl";
import { useMapInit } from "@/hooks/useMapInit";
import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";
import type { FeatureCollection } from "geojson";

import { MdCheck, MdDeleteOutline } from "react-icons/md";

import { registerTactical } from "./Tactical";
import { registerFormations } from "./Formations";
import type { MapModuleCtx, FC } from "./mapContext";

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
      paint: { "text-color": ["get", "color"], "text-halo-color": "#fff", "text-halo-width": 1 },
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
      paint: { "text-color": ["get", "color"], "text-halo-color": "#fff", "text-halo-width": 1 },
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

  // commando icons (iconId image will be added runtime)
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

  // sync from store -> refs (กันกรณีมีที่อื่นแก้ store)
  useEffect(() => { tacRef.current = tac as any; }, [tac]);
  useEffect(() => { drawRef.current = draw as any; }, [draw]);

  // init + register modules
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cleanups: Array<() => void> = [];

    const onLoad = async () => {
      ensureSourcesAndLayers(map);

      // initial paint
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
    };

    if (map.loaded()) onLoad();
    else map.once("load", onLoad);

    return () => {
      cleanups.forEach((fn) => fn?.());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // click to “select” editable symbol (formation/commando)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const pickEditable = (e: any) => {
      const layers = ["tac-formation", "tac-commando"];
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

      setSelectedId(pickEditable(e));
    };

    map.on("click", onClick);
    return () => {map.off("click", onClick);}
  }, []);

  const deleteSelected = () => {
    if (!selectedId) return;
    const next = tacRef.current.features.filter((f: any) => String(f?.properties?.id) !== selectedId);
    setTac({ type: "FeatureCollection", features: next });
    setSelectedId(null);
  };

  const doneSelected = () => {
    setSelectedId(null);
    useToolStore.getState().setTool({ kind: "none" } as any);
  };

  // clear event from sidebar
  useEffect(() => {
    const onClear = () => {
      setSelectedId(null);
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