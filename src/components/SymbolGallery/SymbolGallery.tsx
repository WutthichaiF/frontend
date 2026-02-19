"use client";

import MilSymbolIcon from "./MilSymbolIcon";

const demoSymbols = [
  // ใส่ SIDC / symbolID ที่คุณต้องการ (ตัวอย่าง placeholder)
  "SFGPUCI----K---", 
  "SFGPUCAA---K---",
  "SHGPUCI----K---",
];

export default function SymbolGallery() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
      {demoSymbols.map((sidc) => (
        <button
          key={sidc}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 8,
            background: "white",
            cursor: "pointer",
          }}
          onClick={() => {
            // TODO: set tool = "placeSymbol" + selectedSymbolID = sidc
            console.log("select:", sidc);
          }}
        >
          <MilSymbolIcon symbolID={sidc} size={44} />
        </button>
      ))}
    </div>
  );
}
