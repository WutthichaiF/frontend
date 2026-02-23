// types/feature.ts
import type { Feature, Geometry } from "geojson";

export type AppFeatureKind =
  | "formation_unit"
  | "commando_point"
  | "task"
  | "defensive"
  | "area"
  | "symbol";

export type AppFeatureProps = {
  id: string;
  gkind: AppFeatureKind;   
  iconId?: string;
  iconSize?: number;
  label?: string;
  sidc?: string;
};

export type AppFeature = Feature<Geometry, AppFeatureProps>;