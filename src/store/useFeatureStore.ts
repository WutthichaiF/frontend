import { create } from "zustand";
import type { AppFeature } from "@/types/feature";

type State = {
  features: AppFeature[];
  addFeature: (f: AppFeature) => void;
  clear: () => void;
};

export const useFeatureStore = create<State>((set) => ({
  features: [],
  addFeature: (f) => set((s) => ({ features: [...s.features, f] })),
  clear: () => set({ features: [] }),
}));
