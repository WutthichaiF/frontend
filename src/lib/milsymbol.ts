import ms from "milsymbol";

export function sidcToSvg(
sidc: string, opts?: { size?: number; fill?: string; stroke?: string; }, uniqueDesignation?: any) {
  const symbol = new ms.Symbol(sidc, {
    size: opts?.size ?? 32,
    
  });

  return symbol.asSVG();
}

