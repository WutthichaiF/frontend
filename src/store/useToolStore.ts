import { create } from "zustand";

export type Tool =
  | { kind: "none" }
  | { kind: "draw_task"; taskId: "WP" | "R" | "CATK" }
  | { kind: "draw_defensive"; defId: "xline" | "trench" | "teeth" | "arc" }
  | { kind: "place_symbol"; sidc: string; label?: string }
  | { kind: "place_commando"; iconId: string; svg: string; label?: string }
  | { kind: "draw_area"; sidc: string; label?: string }
  | {
    kind: "place_formation_unit";
    iconId: string;
    iconSize?: number;
    symbolCode?: string;
    shortName?: string;
    abbreviation?: string;
    fullName?: string;
    svg?: string;
    thumb?: string;

  }
  | {
    kind: "place_equipment_symbol";
    iconId: string;
    iconSize?: number;
    symbolCode?: string;
    canRotate?: boolean;
  };
type State = {
  tool: Tool;
  setTool: (t: Tool) => void;
};

export const useToolStore = create<State>((set) => ({
  tool: { kind: "none" },
  setTool: (tool) => set({ tool }),
}));