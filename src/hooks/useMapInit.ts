"use client";

import { useEffect } from "react";
import maplibregl, { Map } from "maplibre-gl";

export function useMapInit(
  containerRef: React.RefObject<HTMLDivElement | null>,
  mapRef: React.RefObject<Map | null>
) {
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [100.5018, 13.7563], // Bangkok
      zoom: 6,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef, mapRef]);
}
