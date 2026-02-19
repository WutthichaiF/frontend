export type Tool =
  | { kind: "none" }
  | { kind: "place_symbol"; sidc: string; label?: string }
  | { kind: "draw_line" }
  | { kind: "draw_polygon" };
