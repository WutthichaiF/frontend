import { create } from "zustand";

export type Tool =
  | { kind: "none" }
  | { kind: "place_symbol"; sidc: string; label?: string }
  | { kind: "draw_task"; taskId: "WP" | "R" | "CATK" }
  | { kind: "draw_defensive"; defId: "xline" | "trench" | "teeth" | "arc" };

type State = {
  tool: Tool;
  setTool: (tool: Tool) => void;
};

export const useToolStore = create<State>((set) => ({
  tool: { kind: "none" },
  setTool: (tool) => set({ tool }),
}));
