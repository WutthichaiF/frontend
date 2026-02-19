export type GeoGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };

export type AppFeatureType = "symbol" | "line" | "polygon" | "arrow" | "sector";

export type AppFeature = {
  id: string;
  type: AppFeatureType;
  geometry: GeoGeometry;
  properties: Record<string, any>;
};
