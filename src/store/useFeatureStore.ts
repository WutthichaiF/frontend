import { create } from "zustand";
import type { FeatureCollection } from "geojson";

type FC = FeatureCollection;

type FeatureState = {
  tac: FC;
  draw: FC;
  setTac: (next: FC) => void;
  setDraw: (next: FC) => void;
  clear: () => void;
};

const emptyFC: FC = { type: "FeatureCollection", features: [] };

export const useFeatureStore = create<FeatureState>((set) => ({
  tac: emptyFC,
  draw: emptyFC,
  setTac: (next) => set({ tac: next }),
  setDraw: (next) => set({ draw: next }),
  clear: () => set({ tac: emptyFC, draw: emptyFC }),
}));