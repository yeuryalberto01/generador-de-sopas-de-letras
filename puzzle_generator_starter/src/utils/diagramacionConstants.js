export const PAGE_SIZES = {
  LETTER: {
    key: 'LETTER',
    width: 8.5,
    height: 11,
    label: '8.5" × 11" (Carta)',
    widthPx: 816,
    heightPx: 1056
  },
  TABLOID: {
    key: 'TABLOID',
    width: 11,
    height: 17,
    label: '11" × 17" (Tabloide)',
    widthPx: 1056,
    heightPx: 1632
  }
};

export const GRID_TYPES = {
  AUTO: 'auto',
  MANUAL: 'manual',
  COMPACT: 'compact',
  SPACIOUS: 'spacious'
};

export const WORD_DIRECTIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  DIAGONAL_DOWN: 'diagonal_down',
  DIAGONAL_UP: 'diagonal_up'
};

export const WORD_BOX_STYLES = {
  NUMBERED: 'numbered',
  COLUMNS: 'columns',
  GRID: 'grid',
  FLOWING: 'flowing'
};

export const DEFAULT_CELL_SIZE = 30;
export const MIN_GRID_SIZE = 8;
export const MAX_GRID_SIZE = 30;
export const DEFAULT_ZOOM = 100;
export const MIN_ZOOM = 25;
export const MAX_ZOOM = 200;