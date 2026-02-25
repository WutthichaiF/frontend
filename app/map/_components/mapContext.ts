"use client";

import type { Map } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import type React from "react";

export type FC = FeatureCollection;

export type EnsureIconFromSvg = (
  map: Map,
  iconId: string,
  svg: string,
  size?: number
) => Promise<void>;

export type MapModuleCtx = {
  map: Map;

  tacRef: React.MutableRefObject<FC>;
  drawRef: React.MutableRefObject<FC>;

  setTac: (fc: FC) => void;
  setDraw: (fc: FC) => void;

  ensureSourcesAndLayers: (map: Map) => void;
  ensureIconFromSvg: EnsureIconFromSvg;
};
