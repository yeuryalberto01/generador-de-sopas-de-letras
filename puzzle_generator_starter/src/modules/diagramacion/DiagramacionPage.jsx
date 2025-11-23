import React, { useEffect, useState } from "react";
import SopaTemplateOverlay from "./components/SopaTemplateOverlay";

export default function DiagramacionPage() {
  const [grid, setGrid] = useState([]);
  const [words, setWords] = useState(["LUNA","ASTRO","COHETE","ORBITA","GALAXIA","SOL"]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/diagramacion/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ palabras: words })
        });
        const data = await res.json();
        setGrid(data.grid || []);
      } catch {
        setGrid(Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => "X")));
      }
    })();
  }, [words]);

  return (
    <SopaTemplateOverlay
      page="LETTER"                     // ó "A4"
      grid={grid}
      words={words}
      cellMM={8}
      strokeMM={0.3}
      bgSrc="/template_bg.png"          // exporta tu PDF a PNG 300DPI con ese nombre
      gridBox={{ xMM: 15, yMM: 70, wMM: 150, hMM: 150 }}  // midele a tu PDF y ajusta
      wordsBox={{ xMM: 170, yMM: 74, wMM: 30 }}           // idem
      wordsColumns={2}
      borderColorHex="#0ea5e9"
    />
  );
}
