"use client";

import { useToolStore } from "@/store/useToolStore";
import { useFeatureStore } from "@/store/useFeatureStore";

export default function MapHUD() {
  const tool = useToolStore((s) => s.tool);
  const count = useFeatureStore((s) => s.features.length);

  return (
    <div className="absolute left-4 top-16 z-40 rounded-lg bg-white px-3 py-2 text-xs shadow-lg border text-gray-900">
      <div className="font-semibold">HUD</div>
      <div>Tool: {tool.kind}</div>
      <div>Features: {count}</div>
    </div>
  );
}
