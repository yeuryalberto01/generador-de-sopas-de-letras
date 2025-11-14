// ==================== CUSTOM HOOKS FOR EDICION MODULE ====================

import { useCallback, useEffect, useRef, useState } from 'react';
import { DocumentElement, EdicionState, Position } from './types';
import { snapToGrid } from './utils';

/**
 * Hook for handling element selection and manipulation
 */
export function useElementSelection() {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const selectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
  }, []);

  const startDrag = useCallback((startPosition: Position) => {
    setIsDragging(true);
    setDragStart(startPosition);
  }, []);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const startResize = useCallback((handle: string) => {
    setIsResizing(true);
    setResizeHandle(handle);
  }, []);

  const endResize = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  return {
    selectedElementId,
    selectElement,
    isDragging,
    startDrag,
    endDrag,
    isResizing,
    startResize,
    endResize,
    resizeHandle
  };
}

/**
 * Hook for handling canvas interactions
 */
export function useCanvasInteraction(
  zoom: number,
  gridSize: number,
  snapToGridEnabled: boolean,
  onElementCreate: (type: string, position: Position) => void,
  onElementUpdate: (elementId: string, updates: Partial<DocumentElement>) => void
) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position | null>(null);

  const getCanvasPosition = useCallback((clientX: number, clientY: number): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom
    };
  }, [zoom]);

  const handleCanvasClick = useCallback((e: React.MouseEvent, tool: string) => {
    const position = getCanvasPosition(e.clientX, e.clientY);
    const snappedPosition = snapToGrid(position, gridSize, snapToGridEnabled);

    if (tool !== 'select' && tool !== 'hand') {
      onElementCreate(tool, snappedPosition);
    }
  }, [getCanvasPosition, gridSize, snapToGridEnabled, onElementCreate]);

  const handleMouseDown = useCallback((e: React.MouseEvent, tool: string) => {
    if (tool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      // TODO: Implement canvas panning
      console.log('Panning:', deltaX, deltaY);
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setPanStart(null);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return {
    canvasRef,
    handleCanvasClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isPanning
  };
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(
  onUndo: () => void,
  onRedo: () => void,
  onDelete: () => void,
  onDuplicate: () => void,
  onSelectAll: () => void,
  onSave: () => void
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser behavior for our shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              onRedo();
            } else {
              e.preventDefault();
              onUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            onRedo();
            break;
          case 's':
            e.preventDefault();
            onSave();
            break;
          case 'a':
            e.preventDefault();
            onSelectAll();
            break;
          case 'd':
            e.preventDefault();
            onDuplicate();
            break;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        onDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onDelete, onDuplicate, onSelectAll, onSave]);
}

/**
 * Hook for undo/redo functionality
 */
export function useHistory(initialState: EdicionState) {
  const [history, setHistory] = useState({
    past: [] as EdicionState[],
    present: initialState,
    future: [] as EdicionState[]
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      present: prev.past[prev.past.length - 1],
      future: [prev.present, ...prev.future]
    }));
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: prev.future[0],
      future: prev.future.slice(1)
    }));
  }, [canRedo]);

  const record = useCallback((newState: EdicionState) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present],
      present: newState,
      future: [] // Clear future when new action is performed
    }));
  }, []);

  return {
    state: history.present,
    canUndo,
    canRedo,
    undo,
    redo,
    record
  };
}

/**
 * Hook for drag and drop functionality
 */
export function useDragAndDrop(
  onElementMove: (elementId: string, deltaX: number, deltaY: number) => void,
  onElementResize: (elementId: string, newSize: { width: number; height: number }) => void
) {
  const [draggedElement, setDraggedElement] = useState<DocumentElement | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const startDrag = useCallback((element: DocumentElement, startPosition: Position) => {
    setDraggedElement(element);
    setDragOffset({
      x: startPosition.x - element.position.x,
      y: startPosition.y - element.position.y
    });
  }, []);

  const updateDrag = useCallback((currentPosition: Position) => {
    if (!draggedElement) return;

    const newPosition = {
      x: currentPosition.x - dragOffset.x,
      y: currentPosition.y - dragOffset.y
    };

    onElementMove(draggedElement.id, newPosition.x - draggedElement.position.x, newPosition.y - draggedElement.position.y);
  }, [draggedElement, dragOffset, onElementMove]);

  const endDrag = useCallback(() => {
    setDraggedElement(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const startResize = useCallback((element: DocumentElement, handle: string) => {
    setDraggedElement(element);
    setResizeHandle(handle);
  }, []);

  const updateResize = useCallback((currentPosition: Position) => {
    if (!draggedElement || !resizeHandle) return;

    // TODO: Implement resize logic based on handle
    console.log('Resizing element:', draggedElement.id, 'with handle:', resizeHandle, 'to position:', currentPosition);
  }, [draggedElement, resizeHandle]);

  const endResize = useCallback(() => {
    setDraggedElement(null);
    setResizeHandle(null);
  }, []);

  return {
    draggedElement,
    resizeHandle,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize
  };
}

/**
 * Hook for clipboard operations
 */
export function useClipboard(
  selectedElement: DocumentElement | null,
  onElementCreate: (element: DocumentElement) => void,
  onElementDelete: (elementId: string) => void
) {
  const [clipboard, setClipboard] = useState<DocumentElement | null>(null);

  const copy = useCallback(() => {
    if (selectedElement) {
      setClipboard({ ...selectedElement });
    }
  }, [selectedElement]);

  const cut = useCallback(() => {
    if (selectedElement) {
      setClipboard({ ...selectedElement });
      onElementDelete(selectedElement.id);
    }
  }, [selectedElement, onElementDelete]);

  const paste = useCallback(() => {
    if (clipboard) {
      const newElement = {
        ...clipboard,
        id: `element-${Date.now()}`,
        position: {
          x: clipboard.position.x + 20,
          y: clipboard.position.y + 20
        }
      };
      onElementCreate(newElement);
    }
  }, [clipboard, onElementCreate]);

  return {
    canCopy: !!selectedElement,
    canCut: !!selectedElement,
    canPaste: !!clipboard,
    copy,
    cut,
    paste
  };
}

// ==================== INTEGRATION HOOKS ====================

import { useBook } from '../../context/BookContext';
import { useEdicion } from './edicion-module';

/**
 * Hook para integrar el editor con el sistema de libros
 */
export function useEditorBookIntegration() {
  const { state: editorState, actions: editorActions } = useEdicion();
  const { currentProject, addPuzzleToBook, updatePage } = useBook();

  const importPuzzleToBook = async (puzzleData: any, title?: string) => {
    if (!currentProject) {
      throw new Error('No hay un libro activo. Crea o abre un libro primero.');
    }

    // Crear elementos del editor basados en el puzzle
    const puzzleElements = createPuzzleElements(puzzleData);

    // Agregar página al libro
    const newPage = await addPuzzleToBook('imported-puzzle', {
      ...puzzleData,
      editorElements: puzzleElements
    });

    return newPage;
  };

  const exportBookPageToEditor = async (pageId: string) => {
    if (!currentProject) return;

    const page = currentProject.pages.find(p => p.id === pageId);
    if (!page) return;

    // Convertir la página del libro a elementos del editor
    const editorElements = convertPageToEditorElements(page);

    // Limpiar el lienzo actual y cargar los elementos
    editorElements.forEach(element => {
      editorActions.createElement(element.type, element.position, element.size);
    });
  };

  return {
    importPuzzleToBook,
    exportBookPageToEditor,
    canImport: !!currentProject,
    currentBookName: currentProject?.name
  };
}

/**
 * Convierte datos de puzzle a elementos del editor
 */
function createPuzzleElements(puzzleData: any) {
  const elements = [];

  // Elemento de título
  elements.push({
    type: 'text',
    position: { x: 50, y: 50 },
    size: { width: 300, height: 40 },
    content: {
      text: puzzleData.title || 'Sopa de Letras',
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      alignment: 'center',
      bold: true
    }
  });

  // Elemento de grid del puzzle
  if (puzzleData.grid) {
    elements.push({
      type: 'puzzle-grid',
      position: { x: 100, y: 120 },
      size: {
        width: puzzleData.grid[0]?.length * 30 || 300,
        height: puzzleData.grid.length * 30 || 200
      },
      content: {
        gridData: puzzleData.grid,
        cellSize: 30,
        showNumbers: true,
        showSolution: false
      }
    });
  }

  // Lista de palabras
  if (puzzleData.words) {
    const wordsText = puzzleData.words.map((word: any, index: number) =>
      `${index + 1}. ${word.text || word.texto}`
    ).join('\n');

    elements.push({
      type: 'text',
      position: { x: 450, y: 120 },
      size: { width: 200, height: 300 },
      content: {
        text: wordsText,
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        alignment: 'left'
      }
    });
  }

  return elements;
}

/**
 * Convierte una página de libro a elementos del editor
 */
function convertPageToEditorElements(page: any) {
  // Si la página ya tiene elementos del editor, úsalos
  if (page.elements) {
    return page.elements;
  }

  // De lo contrario, conviértelos desde los datos del puzzle
  return createPuzzleElements(page.puzzleData);
}