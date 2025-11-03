import jsPDF from 'jspdf';

const PAGE_SIZES_MM = {
  LETTER: { width: 215.9, height: 279.4 },
  TABLOID: { width: 279.4, height: 431.8 }
};

export async function generatePDF(config) {
  const { grid, tema, pageSize, gridConfig, wordBoxConfig } = config;

  const pageSizeMM = PAGE_SIZES_MM[pageSize];
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageSizeMM.width, pageSizeMM.height]
  });

  const margin = 20;
  const usableWidth = pageSizeMM.width - (margin * 2);
  const usableHeight = pageSizeMM.height - (margin * 2);

  // Título
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Sopa de Letras: ${tema.nombre}`, pageSizeMM.width / 2, margin, {
    align: 'center'
  });

  // Calcular tamaño de celda
  const cellSize = Math.min(
    usableWidth / gridConfig.cols,
    (usableHeight * 0.7) / gridConfig.rows
  );

  const gridWidth = cellSize * gridConfig.cols;
  const gridHeight = cellSize * gridConfig.rows;
  const startX = (pageSizeMM.width - gridWidth) / 2;
  const startY = margin + 15;

  // Dibujar cuadrícula
  pdf.setFontSize(cellSize * 2.5);
  pdf.setFont('helvetica', 'bold');

  for (let row = 0; row < gridConfig.rows; row++) {
    for (let col = 0; col < gridConfig.cols; col++) {
      const cell = grid[row][col];
      const x = startX + (col * cellSize);
      const y = startY + (row * cellSize);

      // Dibujar celda
      pdf.rect(x, y, cellSize, cellSize);

      // Dibujar letra
      pdf.text(
        cell.letter,
        x + cellSize / 2,
        y + cellSize / 2 + (cellSize * 0.15),
        { align: 'center' }
      );
    }
  }

  // Caja de palabras
  if (wordBoxConfig.visible) {
    const wordBoxY = startY + gridHeight + 10;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Encuentra estas palabras:', margin, wordBoxY);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const wordsPerColumn = Math.ceil(tema.palabras.length / wordBoxConfig.columns);
    const columnWidth = usableWidth / wordBoxConfig.columns;

    tema.palabras.forEach((palabra, index) => {
      const column = Math.floor(index / wordsPerColumn);
      const row = index % wordsPerColumn;

      const x = margin + (column * columnWidth);
      const y = wordBoxY + 10 + (row * 7);

      const text = wordBoxConfig.numbered
        ? `${index + 1}. ${palabra.texto}`
        : palabra.texto;

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