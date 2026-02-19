"use client";

import { renderSinglePointSVG } from "@/lib/milsym";
import { useEffect, useState } from "react";

type Props = {
  symbolID: string;
  size?: number; // px
};

export default function MilSymbolIcon({ symbolID, size = 48 }: Props) {
  const [uri, setUri] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      // attributes/modifiers แล้วแต่จะใส่เพิ่ม
      const res = await renderSinglePointSVG(symbolID, {}, {});

      if (mounted) setUri(res.dataUri);
    })();

    return () => {
      mounted = false;
    };
  }, [symbolID]);

  if (!uri) return <div style={{ width: size, height: size }} />;

  return (
    <img
      src={uri}
      alt={symbolID}
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}
