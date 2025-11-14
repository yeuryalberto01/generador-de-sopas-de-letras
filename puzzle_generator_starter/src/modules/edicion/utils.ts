// ==================== UTILITIES FOR EDICION MODULE ====================

import { ELEMENT_TYPES, PAGE_SIZES } from './constants';
import { DocumentElement, Position, Size } from './types';

/**
 * Generate a unique ID for document elements
 */
export function generateElementId(): string {
  return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique ID for documents
 */
export function generateDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert inches to pixels at 96 DPI
 */
export function inchesToPixels(inches: number): number {
  return inches * 96;
}

/**
 * Convert pixels to inches at 96 DPI
 */
export function pixelsToInches(pixels: number): number {
  return pixels / 96;
}

/**
 * Get the pixel dimensions of a page size
 */
export function getPageDimensions(pageSize: string): { width: number; height: number } {
  const size = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES];
  if (!size) {
    // Default to LETTER if page size not found
    const letterSize = PAGE_SIZES.LETTER;
    return {
      width: inchesToPixels(letterSize.width),
      height: inchesToPixels(letterSize.height)
    };
  }
  return {
    width: inchesToPixels(size.width),
    height: inchesToPixels(size.height)
  };
}

/**
 * Snap a position to the grid
 */
export function snapToGrid(position: Position, gridSize: number, snapEnabled: boolean = true): Position {
  if (!snapEnabled) return position;

  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(point: Position, rect: { position: Position; size: Size }): boolean {
  return (
    point.x >= rect.position.x &&
    point.x <= rect.position.x + rect.size.width &&
    point.y >= rect.position.y &&
    point.y <= rect.position.y + rect.size.height
  );
}

/**
 * Get the bounding box of multiple elements
 */
export function getBoundingBox(elements: DocumentElement[]): { position: Position; size: Size } | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach(element => {
    minX = Math.min(minX, element.position.x);
    minY = Math.min(minY, element.position.y);
    maxX = Math.max(maxX, element.position.x + element.size.width);
    maxY = Math.max(maxY, element.position.y + element.size.height);
  });

  return {
    position: { x: minX, y: minY },
    size: { width: maxX - minX, height: maxY - minY }
  };
}

/**
 * Create default content for different element types
 */
export function createDefaultContent(type: string): any {
  switch (type) {
    case ELEMENT_TYPES.TEXT:
      return {
        text: 'Texto de ejemplo',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        alignment: 'left',
        bold: false,
        italic: false,
        underline: false
      };

    case ELEMENT_TYPES.RECTANGLE:
    case ELEMENT_TYPES.CIRCLE:
    case ELEMENT_TYPES.LINE:
      return {
        fillColor: '#ffffff',
        strokeColor: '#000000',
        strokeWidth: 2
      };

    case ELEMENT_TYPES.IMAGE:
      return {
        src: '',
        alt: 'Imagen',
        fit: 'contain'
      };

    case ELEMENT_TYPES.PUZZLE_GRID:
      return {
        gridData: [],
        cellSize: 30,
        showNumbers: true,
        showSolution: false
      };

    default:
      return {};
  }
}

/**
 * Create a new document element
 */
export function createElement(
  type: string,
  position: Position = { x: 100, y: 100 },
  size?: Size
): DocumentElement {
  const defaultSize = getDefaultElementSize(type);

  return {
    id: generateElementId(),
    type,
    position,
    size: size || defaultSize,
    rotation: 0,
    zIndex: 0,
    visible: true,
    locked: false,
    style: {},
    content: createDefaultContent(type)
  };
}

/**
 * Get default size for different element types
 */
function getDefaultElementSize(type: string): Size {
  switch (type) {
    case ELEMENT_TYPES.TEXT:
      return { width: 200, height: 50 };
    case ELEMENT_TYPES.RECTANGLE:
      return { width: 200, height: 100 };
    case ELEMENT_TYPES.CIRCLE:
      return { width: 100, height: 100 };
    case ELEMENT_TYPES.LINE:
      return { width: 200, height: 2 };
    case ELEMENT_TYPES.IMAGE:
      return { width: 200, height: 150 };
    case ELEMENT_TYPES.PUZZLE_GRID:
      return { width: 400, height: 300 };
    default:
      return { width: 100, height: 100 };
  }
}

/**
 * Clone an element with a new ID
 */
export function cloneElement(element: DocumentElement): DocumentElement {
  return {
    ...element,
    id: generateElementId(),
    position: {
      x: element.position.x + 20,
      y: element.position.y + 20
    }
  };
}

/**
 * Move element by delta
 */
export function moveElement(element: DocumentElement, deltaX: number, deltaY: number): DocumentElement {
  return {
    ...element,
    position: {
      x: element.position.x + deltaX,
      y: element.position.y + deltaY
    }
  };
}

/**
 * Resize element to new size
 */
export function resizeElement(element: DocumentElement, newSize: Size): DocumentElement {
  return {
    ...element,
    size: newSize
  };
}

/**
 * Rotate element by degrees
 */
export function rotateElement(element: DocumentElement, rotation: number): DocumentElement {
  return {
    ...element,
    rotation: (element.rotation + rotation) % 360
  };
}

/**
 * Bring element to front (highest z-index)
 */
export function bringToFront(element: DocumentElement, allElements: DocumentElement[]): DocumentElement {
  const maxZIndex = Math.max(...allElements.map(el => el.zIndex));
  return {
    ...element,
    zIndex: maxZIndex + 1
  };
}

/**
 * Send element to back (lowest z-index)
 */
export function sendToBack(element: DocumentElement, allElements: DocumentElement[]): DocumentElement {
  const minZIndex = Math.min(...allElements.map(el => el.zIndex));
  return {
    ...element,
    zIndex: minZIndex - 1
  };
}

/**
 * Validate element data
 */
export function validateElement(element: DocumentElement): boolean {
  return !!(
    element.id &&
    element.type &&
    element.position &&
    typeof element.position.x === 'number' &&
    typeof element.position.y === 'number' &&
    element.size &&
    typeof element.size.width === 'number' &&
    typeof element.size.height === 'number' &&
    typeof element.rotation === 'number' &&
    typeof element.zIndex === 'number' &&
    typeof element.visible === 'boolean' &&
    typeof element.locked === 'boolean'
  );
}

/**
 * Export element as JSON
 */
export function serializeElement(element: DocumentElement): string {
  return JSON.stringify(element, null, 2);
}

/**
 * Import element from JSON
 */
export function deserializeElement(json: string): DocumentElement | null {
  try {
    const element = JSON.parse(json);
    if (validateElement(element)) {
      return element;
    }
  } catch (error) {
    console.error('Error deserializing element:', error);
  }
  return null;
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Check if two rectangles intersect
 */
export function rectanglesIntersect(
  rect1: { position: Position; size: Size },
  rect2: { position: Position; size: Size }
): boolean {
  return !(
    rect1.position.x + rect1.size.width < rect2.position.x ||
    rect2.position.x + rect2.size.width < rect1.position.x ||
    rect1.position.y + rect1.size.height < rect2.position.y ||
    rect2.position.y + rect2.size.height < rect1.position.y
  );
}