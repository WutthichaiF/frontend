import maplibregl from "maplibre-gl";

export async function addMilSymbolMarker(
  map: maplibregl.Map,
  lngLat: maplibregl.LngLatLike,
  symbolID: string
) {
  const { svg, anchor } = await renderSinglePointSVG(symbolID);

  const el = document.createElement("div");
  el.style.width = "56px";
  el.style.height = "56px";
  el.style.transform = `translate(${-anchor.x}px, ${-anchor.y}px)`;
  el.innerHTML = svg;

  new maplibregl.Marker({ element: el })
    .setLngLat(lngLat)
    .addTo(map);
}

export type RenderSinglePointResult = {
  svg: string;
  dataUri: string;
  anchor: { x: number; y: number };
};

export async function renderSinglePointSVG(
  symbolID: string,
  modifiers: Record<string, string> = {},
  attributes: Record<string, string> = {}
): Promise<RenderSinglePointResult> {
  const ms = await import("@armyc2.c5isr.renderer/mil-sym-ts-web");

  // Map<string,string> ตาม signature ของ RenderSVG
  const modMap = new Map<string, string>(Object.entries(modifiers));
  const attrMap = new Map<string, string>(Object.entries(attributes));

  const renderer = ms.MilStdIconRenderer.getInstance(); // :contentReference[oaicite:1]{index=1}
  const svgInfo = renderer.RenderSVG(symbolID, modMap, attrMap); // :contentReference[oaicite:2]{index=2}

  if (!svgInfo) {
    throw new Error(`Failed to render SVG for symbol ID: ${symbolID}`);
  }

  return {
    svg: svgInfo.getSVG(), // :contentReference[oaicite:3]{index=3}
    dataUri: svgInfo.getSVGDataURI(), // :contentReference[oaicite:4]{index=4}
    anchor: { x: svgInfo.getSymbolCenterX(), y: svgInfo.getSymbolCenterY() }, // :contentReference[oaicite:5]{index=5}
  };
}

