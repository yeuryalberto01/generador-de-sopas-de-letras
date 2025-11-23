import jsPDF from 'jspdf';

const PAGE_SIZES_MM = {
  LETTER: { width: 215.9, height: 279.4 },
  TABLOID: { width: 279.4, height: 431.8 }
};

export async function generatePDF(config) {
  const {
    grid,
    tema,
    pageSize,
    gridConfig,
    wordBoxConfig,
    showGridBorders = true,
    showSolution = false,
    title = 'SOPA DE LETRAS · NIVEL',
    instructions = 'Encuentra las palabras de la lista. Pueden estar en cualquier dirección (horizontal, vertical o diagonal, hacia adelante o hacia atrás).'
  } = config;

  const pageSizeMM = PAGE_SIZES_MM[pageSize];
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageSizeMM.width, pageSizeMM.height]
  });

  const margin = 15;
  const usableWidth = pageSizeMM.width - (margin * 2);
  const usableHeight = pageSizeMM.height - (margin * 2);

  // Encabezado
  const headerY = margin;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(title, margin, headerY);

  pdf.setFontSize(12);
  pdf.text(`Tema: ${tema.nombre}`, margin, headerY + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const instructionY = headerY + 16;
  pdf.text(instructions, margin, instructionY, { maxWidth: usableWidth });

  // Áreas: grilla a la izquierda, lista a la derecha
  const layoutGap = 8;
  const leftAreaWidth = usableWidth * 0.55;
  const rightAreaWidth = usableWidth - leftAreaWidth - layoutGap;
  const topAreaY = instructionY + 8;

  // Calcular tamaño de celda consistente con viewer
  const cellSize = Math.min(
    leftAreaWidth / gridConfig.cols,
    (usableHeight * 0.65) / gridConfig.rows
  );

  const gridWidth = cellSize * gridConfig.cols;
  const gridHeight = cellSize * gridConfig.rows;
  const startX = margin;
  const startY = topAreaY;

  // Dibujar cuadrícula
  pdf.setFontSize(cellSize * 2.2);
  pdf.setFont('helvetica', 'bold');

  for (let row = 0; row < gridConfig.rows; row++) {
    for (let col = 0; col < gridConfig.cols; col++) {
      const cell = grid[row][col];
      const x = startX + (col * cellSize);
      const y = startY + (row * cellSize);

      // Relleno para solución
      if (showSolution && cell.isWord) {
        pdf.setFillColor(224, 242, 254); // #e0f2fe igual que el viewer
        pdf.rect(x, y, cellSize, cellSize, 'F');
      } else if (showGridBorders) {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y, cellSize, cellSize, 'F');
      }

      // Dibujar contorno si aplica
      if (showGridBorders) {
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(x, y, cellSize, cellSize);
      }

      // Dibujar letra
      pdf.text(
        cell.letter,
        x + cellSize / 2,
        y + cellSize / 2 + (cellSize * 0.15),
        { align: 'center' }
      );
    }
  }

  // Caja de palabras al lado derecho
  if (wordBoxConfig.visible) {
    const wordBoxX = startX + gridWidth + layoutGap;
    const wordBoxY = topAreaY;
    const wordBoxWidth = rightAreaWidth;
    const wordBoxHeight = gridHeight;

    pdf.setDrawColor(0, 0, 0);
    pdf.rect(wordBoxX, wordBoxY, wordBoxWidth, wordBoxHeight);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Lista de palabras', wordBoxX + 4, wordBoxY + 8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const wordsPerColumn = Math.ceil(tema.palabras.length / wordBoxConfig.columns);
    const columnWidth = wordBoxWidth / wordBoxConfig.columns;
    const lineHeight = 6;
    const startListY = wordBoxY + 14;

    tema.palabras.forEach((palabra, index) => {
      const column = Math.floor(index / wordsPerColumn);
      const row = index % wordsPerColumn;

      const x = wordBoxX + 4 + (column * columnWidth);
      const y = startListY + (row * lineHeight);

      const text = wordBoxConfig.numbered
        ? `${index + 1}. ${palabra.texto}`
        : `• ${palabra.texto}`;

      pdf.text(text, x, y);
    });
  }

  // Información adicional
  pdf.setFontSize(8);
  pdf.setTextColor(128);
  pdf.text(
    `Generado con Puzzle Generator | ${new Date().toLocaleDateString()}`,
    pageSizeMM.width / 2,
    pageSizeMM.height - 10,
    { align: 'center' }
  );

  // Guardar PDF
  pdf.save(`sopa-letras-${tema.nombre}.pdf`);
}
