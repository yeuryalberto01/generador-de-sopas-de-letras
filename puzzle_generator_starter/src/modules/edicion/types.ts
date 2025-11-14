// ==================== TYPES FOR EDICION MODULE ====================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface DocumentElement {
  id: string;
  type: string;
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  style: Record<string, any>;
  content?: any;
}

export interface TextElement extends DocumentElement {
  type: 'text';
  content: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    alignment: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}

export interface ShapeElement extends DocumentElement {
  type: 'rectangle' | 'circle' | 'line';
  content: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
  };
}

export interface ImageElement extends DocumentElement {
  type: 'image';
  content: {
    src: string;
    alt: string;
    fit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  };
}

export interface PuzzleGridElement extends DocumentElement {
  type: 'puzzle-grid';
  content: {
    gridData: string[][];
    cellSize: number;
    showNumbers: boolean;
    showSolution: boolean;
  };
}

export interface Document {
  id: string;
  name: string;
  pageSize: string;
  elements: DocumentElement[];
  backgroundColor: string;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EdicionState {
  document: Document;
  selectedElementId: string | null;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  tool: string;
  isDirty: boolean;
  history: {
    past: EdicionState[];
    future: EdicionState[];
  };
}

export interface EdicionActions {
  createElement: (type: string, position?: Position) => void;
  updateElement: (elementId: string, updates: Partial<DocumentElement>) => void;
  deleteElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  duplicateElement: (elementId: string) => void;
  moveElement: (elementId: string, deltaX: number, deltaY: number) => void;
  resizeElement: (elementId: string, newSize: Size) => void;
  rotateElement: (elementId: string, rotation: number) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  setTool: (tool: string) => void;
  undo: () => void;
  redo: () => void;
  saveDocument: () => Promise<void>;
  loadDocument: (document: Document) => void;
  exportDocument: (format: string) => Promise<void>;
  newDocument: () => void;
}

export interface EdicionContextValue {
  state: EdicionState;
  actions: EdicionActions;
  selectedElement: DocumentElement | null;
}