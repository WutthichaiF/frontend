"use client";
import React from "react";

type Props = {
  open: boolean;
  draft: any;
  onChange: (next: any) => void;
  onApply: () => void;
  onClose: () => void; // discard
};

export default function MssSymbolEditor({ open, draft, onChange, onApply, onClose }: Props) {
  if (!open || !draft) return null;

  return (
    <div className="absolute inset-0 z-[9999] flex items-start justify-center bg-black/20 p-6">
      <div className="w-[860px] max-w-[95vw] rounded-xl bg-white shadow-xl border">
        <div className="flex items-center gap-4 border-b px-4 py-3 text-sm">
          <div className="font-semibold">Base Symbol...</div>
          <div className="text-gray-500">Modifiers</div>
          <div className="text-gray-500">Affiliation</div>
          <div className="text-gray-500">Operational Condition</div>
          <div className="ml-auto font-semibold">MSS Symbol Editor</div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">Label</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={draft.label}
                onChange={(e) => onChange({ ...draft, label: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs text-gray-600">Rotate</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={draft.rot}
                  onChange={(e) => onChange({ ...draft, rot: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="w-12 text-right text-sm tabular-nums">{draft.rot}°</div>
              </div>
            </div>

            {/* ถ้าเป็น symbol ที่มี sidc จริงค่อยเปิด */}
            <div className="col-span-2">
              <label className="text-xs text-gray-600">SIDC (optional)</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={draft.sidc}
                onChange={(e) => onChange({ ...draft, sidc: e.target.value })}
                placeholder="เช่น GFPGPU--------"
              />
              <div className="mt-1 text-xs text-gray-500">
                (ตอนนี้ทำเป็น input ก่อน เดี๋ยวค่อยแยก Base/Modifiers/Affiliation ทีละแท็บให้เหมือน map.army)
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 border-t p-3">
          <button
            className="rounded bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-800"
            onClick={onApply}
          >
            Apply
          </button>
          <button className="rounded bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300" onClick={onClose}>
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}