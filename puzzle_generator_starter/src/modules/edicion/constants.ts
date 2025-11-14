// ==================== CONSTANTS FOR EDICION MODULE ====================

export const PAGE_SIZES = {
  LETTER: { width: 8.5, height: 11, label: '8.5" × 11" (Carta)', dpi: 96 },
  TABLOID: { width: 11, height: 17, label: '11" × 17" (Tabloide)', dpi: 96 },
  A4: { width: 8.27, height: 11.69, label: 'A4', dpi: 96 },
  A3: { width: 11.69, height: 16.54, label: 'A3', dpi: 96 }
} as const;

export const ELEMENT_TYPES = {
  TEXT: 'text',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  IMAGE: 'image',
  PUZZLE_GRID: 'puzzle-grid',
  ARROW: 'arrow',
  STAR: 'star',
  TRIANGLE: 'triangle'
} as const;

export const TEXT_ALIGNMENTS = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify'
} as const;

export const FONT_FAMILIES = {
  ARIAL: 'Arial, sans-serif',
  TIMES: 'Times New Roman, serif',
  HELVETICA: 'Helvetica, sans-serif',
  GEORGIA: 'Georgia, serif',
  VERDANA: 'Verdana, sans-serif',
  COURIER: 'Courier New, monospace',
  IMPACT: 'Impact, sans-serif',
  COMIC_SANS: 'Comic Sans MS, cursive'
} as const;

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72] as const;

export const TOOLS = {
  SELECT: 'select',
  TEXT: 'text',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  LINE: 'line',
  IMAGE: 'image',
  PUZZLE_GRID: 'puzzle-grid',
  HAND: 'hand',
  ZOOM: 'zoom'
} as const;

export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4] as const;

export const GRID_SIZES = [5, 10, 15, 20, 25, 30, 50] as const;

export const DEFAULT_MARGINS = {
  top: 0.5,
  right: 0.5,
  bottom: 0.5,
  left: 0.5
} as const;

export const DEFAULT_DOCUMENT_SETTINGS = {
  backgroundColor: '#ffffff',
  gridSize: 20,
  snapToGrid: true,
  showGrid: true,
  showRulers: true,
  zoom: 1
} as const;

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  PNG: 'png',
  JPG: 'jpg',
  SVG: 'svg'
} as const;

export const COLOR_PALETTE = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#800000', '#008000',
  '#000080', '#808000', '#800080', '#008080', '#808080',
  '#c0c0c0', '#ff6347', '#32cd32', '#1e90ff', '#ffd700'
] as const;

export const SHAPE_PRESETS = {
  RECTANGLE: { width: 200, height: 100 },
  CIRCLE: { width: 100, height: 100 },
  LINE: { width: 200, height: 2 },
  SQUARE: { width: 100, height: 100 }
} as const;