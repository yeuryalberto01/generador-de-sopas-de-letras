import React from "react";

/**
 * SopaTemplateOverlay
 * Fidelidad 1:1 usando la plantilla como fondo (PNG exportado del PDF).
 *
 * Props:
 * - page: 'LETTER' | 'A4'
 * - grid: string[][] (NxN)
 * - words: string[]
 * - cellMM: tamaño de celda en mm
 * - strokeMM: grosor de línea en mm
 * - bgSrc: ruta al PNG exportado del PDF
 * - gridBox: { xMM, yMM, wMM, hMM }
 * - wordsBox: { xMM, yMM, wMM }
 * - wordsColumns: número de columnas para la lista
 * - borderColorHex: color del trazo de la grilla
 */
export default function SopaTemplateOverlay({
  page = "LETTER",
  grid = defaultGrid(15),
  words = [],
  cellMM = 8,
  strokeMM = 0.3,
  bgSrc = "/template_bg.png",
  gridBox = { xMM: 15, yMM: 70, wMM: 150, hMM: 150 },
  wordsBox = { xMM: 170, yMM: 74, wMM: 30 },
  wordsColumns = 2,
  borderColorHex = "#0ea5e9",
  title = "",
}) {
  const n = grid?.length ?? 0;

  // Tamaños de página en mm
  const PAGE_MM = page === "A4"
    ? { w: 210, h: 297 }
    : { w: 215.9, h: 279.4 }; // LETTER

  // CSS de impresión exacta (sin reescalado)
  const printCSS = `
    @page { size: ${PAGE_MM.w}mm ${PAGE_MM.h}mm; margin: 0; }
    @media print {
      html, body { width: ${PAGE_MM.w}mm; height: ${PAGE_MM.h}mm; margin: 0; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  const gridWmm = n * cellMM;
  const gridHmm = n * cellMM;

  const gridPixStyle = {
    left: `${gridBox.xMM}mm`,
    top: `${gridBox.yMM}mm`,
    width: `${gridWmm}mm`,
    height: `${gridHmm}mm`,
    position: "absolute",
    border: `${strokeMM}mm solid ${borderColorHex}`,
    backgroundImage: `
      repeating-linear-gradient(
        to right,
        transparent 0,
        transparent calc(${cellMM}mm - ${strokeMM}mm),
        ${borderColorHex} calc(${cellMM}mm - ${strokeMM}mm),
        ${borderColorHex} ${cellMM}mm
      ),
      repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent calc(${cellMM}mm - ${strokeMM}mm),
        ${borderColorHex} calc(${cellMM}mm - ${strokeMM}mm),
        ${borderColorHex} ${cellMM}mm
      )
    `,
    backgroundOrigin: "content-box",
  };

  const letterFontSizeMM = Math.max(cellMM * 0.55, 3.2);

  const wordsStyle = {
    position: "absolute",
    left: `${wordsBox.xMM}mm`,
    top: `${wordsBox.yMM}mm`,
    width: `${wordsBox.wMM}mm`,
    fontSize: "3.2mm",
    lineHeight: 1.4,
  };

  const wordsCols = Math.max(1, Math.min(4, wordsColumns || 2));

  return (
    <div className="w-full flex justify-center print:block">
      <style dangerouslySetInnerHTML={{ __html: printCSS }} />
      <div
        className="relative bg-white shadow print:shadow-none"
        style={{
          width: `${PAGE_MM.w}mm`,
          height: `${PAGE_MM.h}mm`,
          overflow: "hidden",
          backgroundImage: `url(${bgSrc})`,
          backgroundSize: `${PAGE_MM.w}mm ${PAGE_MM.h}mm`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "0 0",
        }}
      >
        {title ? (
          <div
            style={{
              position: "absolute",
              top: "20mm",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: "10mm",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.4mm",
            }}
          >
            {title}
          </div>
        ) : null}

        {/* Rejilla exacta */}
        <div style={gridPixStyle}>
          {/* Capa de letras en coordenadas de celdas */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${n}, 1fr)`,
              gridTemplateRows: `repeat(${n}, 1fr)`,
            }}
          >
            {grid.map((row, i) =>
              row.map((ch, j) => (
                <div
                  key={`${i}-${j}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: `${letterFontSizeMM}mm`,
                    lineHeight: 1,
                    userSelect: "none",
                  }}
                >
                  {String(ch || "").toUpperCase()}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lista de palabras donde la lleve tu arte */}
        <div style={wordsStyle}>
          {words.length === 0 ? (
            <div style={{ opacity: 0.6 }}>(Sin palabras)</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${wordsCols}, 1fr)`,
                columnGap: "4mm",
                rowGap: "2mm",
                textTransform: "uppercase",
                letterSpacing: "0.3mm",
                fontWeight: 600,
              }}
            >
              {words.map((w, idx) => <div key={idx}>{w}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultGrid(n = 15) {
  return Array.from({ length: n }, () => Array.from({ length: n }, () => "X"));
}
