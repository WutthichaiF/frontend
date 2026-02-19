"use client";

import { useState } from "react";
import MapCanvas from "./_components/MapCanvas";
import MapHUD from "./_components/MapHUD";
import Sidebar from "@/components/Sidebar/Sidebar";

export default function MapContainer() {
  const [open, setOpen] = useState(true);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map */}
      <MapCanvas />
      <MapHUD />

      {/* Toggle Button (top-left) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="absolute left-4 top-4 z-[9999] h-10 w-10 rounded bg-white text-black shadow-lg border border-gray-300 flex items-center justify-center text-2xl leading-none opacity-100 select-none"
        style={{ backgroundColor: "#fff" }}
        title="Toggle Symbol Gallery"
        type="button"
        aria-label="Toggle sidebar"
      >
        +
      </button>

      {/* Sidebar Panel (top-left) */}
      <div
        className={[
          "absolute left-4 top-16 z-[9998] h-[82vh] w-[420px] overflow-hidden rounded-lg border bg-white shadow-lg transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-[460px]",
        ].join(" ")}
      >
        <Sidebar />
      </div>
    </div> 
  );
}
