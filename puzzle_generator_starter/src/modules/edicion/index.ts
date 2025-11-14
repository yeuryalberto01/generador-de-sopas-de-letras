// ==================== EDICION MODULE EXPORTS ====================

// Main component
export { default as EdicionModule } from './edicion-module';

// Context and hooks
export { EdicionProvider, useEdicion } from './edicion-module';

// Types
export type {
    Document, DocumentElement, EdicionActions,
    EdicionContextValue, EdicionState, ImageElement, Position, PuzzleGridElement, ShapeElement, Size, TextElement
} from './types';

// Constants
export {
    COLOR_PALETTE, DEFAULT_DOCUMENT_SETTINGS, DEFAULT_MARGINS, ELEMENT_TYPES, EXPORT_FORMATS, FONT_FAMILIES,
    FONT_SIZES, GRID_SIZES, PAGE_SIZES, SHAPE_PRESETS, TEXT_ALIGNMENTS, TOOLS,
    ZOOM_LEVELS
} from './constants';

// Utilities
export {
    bringToFront, cloneElement, createDefaultContent,
    createElement, deserializeElement,
    distance, generateDocumentId, generateElementId, getBoundingBox, getPageDimensions, inchesToPixels, isPointInRect, moveElement, pixelsToInches, rectanglesIntersect, resizeElement,
    rotateElement, sendToBack, serializeElement, snapToGrid, validateElement
} from './utils';

// Custom hooks
export {
    useCanvasInteraction, useClipboard, useDragAndDrop, useElementSelection, useHistory, useKeyboardShortcuts
} from './hooks';
