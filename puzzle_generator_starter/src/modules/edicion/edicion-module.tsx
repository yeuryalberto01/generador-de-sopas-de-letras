import { Circle, Download, Grid, Layout, Minus, Move, Save, Square, Type, ZoomIn, ZoomOut } from 'lucide-react';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { UI_TEXTS } from '../../constants/uiTexts';

// Import from local modules
import {
    DEFAULT_DOCUMENT_SETTINGS,
    DEFAULT_MARGINS,
    ELEMENT_TYPES,
    FONT_FAMILIES,
    TEXT_ALIGNMENTS,
    TOOLS
} from './constants';
import {
    DocumentElement,
    EdicionState,
    Position,
    ShapeElement,
    TextElement
} from './types';
import {
    createElement,
    generateDocumentId,
    getPageDimensions,
    snapToGrid
} from './utils';

// ==================== CONTEXT ====================

// ==================== CONTEXT ====================
const EdicionContext = createContext(null);

function EdicionProvider({ children }) {
  const [state, setState] = useState<EdicionState>({
    document: {
      id: generateDocumentId(),
      name: 'Documento sin título',
      pageSize: 'LETTER',
      elements: [],
      backgroundColor: DEFAULT_DOCUMENT_SETTINGS.backgroundColor,
      margins: DEFAULT_MARGINS,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    selectedElementId: null,
    zoom: DEFAULT_DOCUMENT_SETTINGS.zoom,
    showGrid: DEFAULT_DOCUMENT_SETTINGS.showGrid,
    showRulers: DEFAULT_DOCUMENT_SETTINGS.showRulers,
    snapToGrid: DEFAULT_DOCUMENT_SETTINGS.snapToGrid,
    gridSize: DEFAULT_DOCUMENT_SETTINGS.gridSize,
    tool: TOOLS.SELECT,
    isDirty: false,
    history: {
      past: [],
      future: []
    }
  });

  // ==================== ACTIONS ====================
  const createElementAction = useCallback((type: string, position: Position = { x: 100, y: 100 }) => {
    const snappedPosition = snapToGrid(position, state.gridSize, state.snapToGrid);
    const newElement = createElement(type, snappedPosition);

    setState(prev => ({
      ...prev,
      document: {
        ...prev.document,
        elements: [...prev.document.elements, newElement],
        updatedAt: new Date()
      },
      selectedElementId: newElement.id,
      isDirty: true
    }));
  }, [state.gridSize, state.snapToGrid]);

  const updateElement = useCallback((elementId: string, updates: Partial<DocumentElement>) => {
    setState(prev => ({
      ...prev,
      document: {
        ...prev.document,
        elements: prev.document.elements.map(el =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
        updatedAt: new Date()
      },
      isDirty: true
    }));
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setState(prev => ({
      ...prev,
      document: {
        ...prev.document,
        elements: prev.document.elements.filter(el => el.id !== elementId),
        updatedAt: new Date()
      },
      selectedElementId: prev.selectedElementId === elementId ? null : prev.selectedElementId,
      isDirty: true
    }));
  }, []);

  const selectElement = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedElementId: elementId
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom))
    }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      showGrid: !prev.showGrid
    }));
  }, []);

  const toggleRulers = useCallback(() => {
    setState(prev => ({
      ...prev,
      showRulers: !prev.showRulers
    }));
  }, []);

  const setTool = useCallback((tool: string) => {
    setState(prev => ({
      ...prev,
      tool
    }));
  }, []);

  const saveDocument = useCallback(async () => {
    // TODO: Implement save functionality
    console.log(UI_TEXTS.LOGS.SAVING_DOCUMENT, state.document);
    setState(prev => ({
      ...prev,
      isDirty: false
    }));
  }, [state.document]);

  const exportDocument = useCallback(async (format: string = 'pdf') => {
    // TODO: Implement export functionality
    console.log(UI_TEXTS.LOGS.EXPORTING_DOCUMENT, format);
  }, []);

  // ==================== HELPERS ====================

  const selectedElement = useMemo(() => {
    return state.document.elements.find(el => el.id === state.selectedElementId) || null;
  }, [state.document.elements, state.selectedElementId]);

  const contextValue = {
    state,
    actions: {
      createElement: createElementAction,
      updateElement,
      deleteElement,
      selectElement,
      setZoom,
      toggleGrid,
      toggleRulers,
      setTool,
      saveDocument,
      exportDocument
    },
    selectedElement
  };

  return (
    <EdicionContext.Provider value={contextValue}>
      {children}
    </EdicionContext.Provider>
  );
}

function useEdicion() {
  const context = useContext(EdicionContext);
  if (!context) {
    throw new Error(UI_TEXTS.CONTEXT_ERRORS.EDICION_PROVIDER);
  }
  return context;
}

// ==================== COMPONENTS ====================
function EdicionToolbar() {
  const { actions, state } = useEdicion();

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 border-b">
      {/* Herramientas de selección */}
      <button
        onClick={() => actions.setTool(TOOLS.SELECT)}
        className={`p-2 rounded ${state.tool === TOOLS.SELECT ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        title="Seleccionar"
      >
        <Move size={16} />
      </button>

      {/* Herramientas de dibujo */}
      <button
        onClick={() => actions.setTool(ELEMENT_TYPES.TEXT)}
        className={`p-2 rounded ${state.tool === ELEMENT_TYPES.TEXT ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        title="Texto"
      >
        <Type size={16} />
      </button>

      <button
        onClick={() => actions.setTool(ELEMENT_TYPES.RECTANGLE)}
        className={`p-2 rounded ${state.tool === ELEMENT_TYPES.RECTANGLE ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        title="Rectángulo"
      >
        <Square size={16} />
      </button>

      <button
        onClick={() => actions.setTool(ELEMENT_TYPES.CIRCLE)}
        className={`p-2 rounded ${state.tool === ELEMENT_TYPES.CIRCLE ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        title="Círculo"
      >
        <Circle size={16} />
      </button>

      <button
        onClick={() => actions.setTool(ELEMENT_TYPES.LINE)}
        className={`p-2 rounded ${state.tool === ELEMENT_TYPES.LINE ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        title="Línea"
      >
        <Minus size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Controles de vista */}
      <button
        onClick={actions.toggleGrid}
        className={`p-2 rounded ${state.showGrid ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        title="Mostrar/ocultar cuadrícula"
      >
        <Grid size={16} />
      </button>

      <button
        onClick={actions.toggleRulers}
        className={`p-2 rounded ${state.showRulers ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
        title="Mostrar/ocultar reglas"
      >
        <Layout size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Controles de zoom */}
      <button
        onClick={() => actions.setZoom(state.zoom * 1.2)}
        className="p-2 rounded hover:bg-gray-200"
        title="Acercar"
      >
        <ZoomIn size={16} />
      </button>

      <span className="text-sm px-2">{Math.round(state.zoom * 100)}%</span>

      <button
        onClick={() => actions.setZoom(state.zoom / 1.2)}
        className="p-2 rounded hover:bg-gray-200"
        title="Alejar"
      >
        <ZoomOut size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      {/* Acciones de documento */}
      <button
        onClick={actions.saveDocument}
        className="p-2 rounded hover:bg-gray-200"
        title="Guardar"
      >
        <Save size={16} />
      </button>

      <button
        onClick={() => actions.exportDocument('pdf')}
        className="p-2 rounded hover:bg-gray-200"
        title="Exportar PDF"
      >
        <Download size={16} />
      </button>
    </div>
  );
}

function EdicionCanvas() {
  const { state, actions } = useEdicion();
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (state.tool !== TOOLS.SELECT) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left) / state.zoom;
        const y = (e.clientY - rect.top) / state.zoom;
        actions.createElement(state.tool, { x, y });
      }
    } else {
      actions.selectElement(null);
    }
  }, [state.tool, state.zoom, actions]);

  const pageDimensions = getPageDimensions(state.document.pageSize);
  const pageWidth = pageDimensions.width;
  const pageHeight = pageDimensions.height;

  return (
    <div className="flex-1 overflow-auto bg-gray-200 p-8">
      <div
        ref={canvasRef}
        className="relative mx-auto bg-white shadow-lg cursor-crosshair"
        style={{
          width: pageWidth * state.zoom,
          height: pageHeight * state.zoom,
          transform: `scale(${state.zoom})`,
          transformOrigin: 'top left'
        }}
        onClick={handleCanvasClick}
      >
        {/* Grid */}
        {state.showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: `${state.gridSize * state.zoom}px ${state.gridSize * state.zoom}px`
            }}
          />
        )}

        {/* Document Elements */}
        {state.document.elements.map(element => (
          <DocumentElementRenderer
            key={element.id}
            element={element}
            isSelected={element.id === state.selectedElementId}
            onSelect={() => actions.selectElement(element.id)}
            onUpdate={(updates) => actions.updateElement(element.id, updates)}
            onDelete={() => actions.deleteElement(element.id)}
          />
        ))}

        {/* Selection handles */}
        {state.selectedElementId && (
          <SelectionHandles
            element={state.document.elements.find(el => el.id === state.selectedElementId)!}
            onUpdate={(updates) => actions.updateElement(state.selectedElementId!, updates)}
          />
        )}
      </div>
    </div>
  );
}

function DocumentElementRenderer({ element, isSelected, onSelect, onUpdate, onDelete }: {
  element: DocumentElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<DocumentElement>) => void;
  onDelete: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: element.position.x,
    top: element.position.y,
    width: element.size.width,
    height: element.size.height,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex,
    cursor: element.locked ? 'default' : 'move',
    border: isSelected ? '2px solid #3b82f6' : '1px solid transparent'
  };

  switch (element.type) {
    case ELEMENT_TYPES.TEXT:
      const textElement = element as TextElement;
      return (
        <div
          style={{
            ...baseStyle,
            fontSize: textElement.content.fontSize,
            fontFamily: textElement.content.fontFamily,
            color: textElement.content.color,
            textAlign: textElement.content.alignment as any,
            fontWeight: textElement.content.bold ? 'bold' : 'normal',
            fontStyle: textElement.content.italic ? 'italic' : 'normal',
            textDecoration: textElement.content.underline ? 'underline' : 'none',
            padding: '4px',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden'
          }}
          onClick={handleClick}
        >
          {textElement.content.text}
        </div>
      );

    case ELEMENT_TYPES.RECTANGLE:
      const rectElement = element as ShapeElement;
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: rectElement.content.fillColor,
            border: `${rectElement.content.strokeWidth}px solid ${rectElement.content.strokeColor}`
          }}
          onClick={handleClick}
        />
      );

    case ELEMENT_TYPES.CIRCLE:
      const circleElement = element as ShapeElement;
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: circleElement.content.fillColor,
            border: `${circleElement.content.strokeWidth}px solid ${circleElement.content.strokeColor}`,
            borderRadius: '50%'
          }}
          onClick={handleClick}
        />
      );

    case ELEMENT_TYPES.LINE:
      const lineElement = element as ShapeElement;
      return (
        <div
          style={{
            ...baseStyle,
            backgroundColor: lineElement.content.strokeColor,
            height: lineElement.content.strokeWidth
          }}
          onClick={handleClick}
        />
      );

    default:
      return (
        <div
          style={baseStyle}
          onClick={handleClick}
        >
          Elemento desconocido: {element.type}
        </div>
      );
  }
}

function SelectionHandles({ element, onUpdate }: {
  element: DocumentElement;
  onUpdate: (updates: Partial<DocumentElement>) => void;
}) {
  const handleResize = (direction: string, deltaX: number, deltaY: number) => {
    let newSize = { ...element.size };
    let newPosition = { ...element.position };

    switch (direction) {
      case 'se': // southeast
        newSize.width += deltaX;
        newSize.height += deltaY;
        break;
      case 'sw': // southwest
        newSize.width -= deltaX;
        newPosition.x += deltaX;
        newSize.height += deltaY;
        break;
      case 'ne': // northeast
        newSize.width += deltaX;
        newSize.height -= deltaY;
        newPosition.y += deltaY;
        break;
      case 'nw': // northwest
        newSize.width -= deltaX;
        newPosition.x += deltaX;
        newSize.height -= deltaY;
        newPosition.y += deltaY;
        break;
    }

    onUpdate({
      size: newSize,
      position: newPosition
    });
  };

  const handleStyle = {
    position: 'absolute' as const,
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    border: '1px solid white',
    borderRadius: '50%',
    cursor: 'pointer'
  };

  return (
    <>
      {/* Corner handles */}
      <div
        style={{
          ...handleStyle,
          top: '-4px',
          left: '-4px',
          cursor: 'nw-resize'
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          // TODO: Implement drag resize
        }}
      />
      <div
        style={{
          ...handleStyle,
          top: '-4px',
          right: '-4px',
          cursor: 'ne-resize'
        }}
      />
      <div
        style={{
          ...handleStyle,
          bottom: '-4px',
          left: '-4px',
          cursor: 'sw-resize'
        }}
      />
      <div
        style={{
          ...handleStyle,
          bottom: '-4px',
          right: '-4px',
          cursor: 'se-resize'
        }}
      />
    </>
  );
}

function EdicionPropertiesPanel() {
  const { selectedElement, actions } = useEdicion();

  if (!selectedElement) {
    return (
      <div className="w-64 bg-gray-50 border-l p-4">
        <h3 className="font-semibold mb-4">Propiedades</h3>
        <p className="text-gray-500">{UI_TEXTS.INFO.SELECT_ELEMENT_TO_EDIT}</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-l p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Propiedades</h3>

      {/* Position and Size */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Posición y Tamaño</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm">X</label>
            <input
              type="number"
              value={selectedElement.position.x}
              onChange={(e) => actions.updateElement(selectedElement.id, {
                position: { ...selectedElement.position, x: parseFloat(e.target.value) || 0 }
              })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm">Y</label>
            <input
              type="number"
              value={selectedElement.position.y}
              onChange={(e) => actions.updateElement(selectedElement.id, {
                position: { ...selectedElement.position, y: parseFloat(e.target.value) || 0 }
              })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm">Ancho</label>
            <input
              type="number"
              value={selectedElement.size.width}
              onChange={(e) => actions.updateElement(selectedElement.id, {
                size: { ...selectedElement.size, width: parseFloat(e.target.value) || 0 }
              })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm">Alto</label>
            <input
              type="number"
              value={selectedElement.size.height}
              onChange={(e) => actions.updateElement(selectedElement.id, {
                size: { ...selectedElement.size, height: parseFloat(e.target.value) || 0 }
              })}
              className="w-full p-1 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Rotación</h4>
        <input
          type="range"
          min="0"
          max="360"
          value={selectedElement.rotation}
          onChange={(e) => actions.updateElement(selectedElement.id, {
            rotation: parseFloat(e.target.value)
          })}
          className="w-full"
        />
        <div className="text-sm text-center mt-1">{selectedElement.rotation}°</div>
      </div>

      {/* Element-specific properties */}
      {selectedElement.type === ELEMENT_TYPES.TEXT && (
        <TextProperties element={selectedElement as TextElement} onUpdate={actions.updateElement} />
      )}

      {(selectedElement.type === ELEMENT_TYPES.RECTANGLE ||
        selectedElement.type === ELEMENT_TYPES.CIRCLE ||
        selectedElement.type === ELEMENT_TYPES.LINE) && (
        <ShapeProperties element={selectedElement as ShapeElement} onUpdate={actions.updateElement} />
      )}

      {/* Actions */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={() => actions.deleteElement(selectedElement.id)}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          {UI_TEXTS.BUTTONS.DELETE_ELEMENT}
        </button>
      </div>
    </div>
  );
}

function TextProperties({ element, onUpdate }: {
  element: TextElement;
  onUpdate: (id: string, updates: Partial<DocumentElement>) => void;
}) {
  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2">Texto</h4>

      <textarea
        value={element.content.text}
        onChange={(e) => onUpdate(element.id, {
          content: { ...element.content, text: e.target.value }
        })}
        className="w-full p-2 border rounded text-sm mb-2"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-sm">Tamaño</label>
          <input
            type="number"
            value={element.content.fontSize}
            onChange={(e) => onUpdate(element.id, {
              content: { ...element.content, fontSize: parseFloat(e.target.value) || 12 }
            })}
            className="w-full p-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm">Fuente</label>
          <select
            value={element.content.fontFamily}
            onChange={(e) => onUpdate(element.id, {
              content: { ...element.content, fontFamily: e.target.value }
            })}
            className="w-full p-1 border rounded text-sm"
          >
            {Object.entries(FONT_FAMILIES).map(([key, value]) => (
              <option key={key} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-sm">Color</label>
        <input
          type="color"
          value={element.content.color}
          onChange={(e) => onUpdate(element.id, {
            content: { ...element.content, color: e.target.value }
          })}
          className="w-full h-8 border rounded"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm">Alineación</label>
        <select
          value={element.content.alignment}
          onChange={(e) => onUpdate(element.id, {
            content: { ...element.content, alignment: e.target.value }
          })}
          className="w-full p-1 border rounded text-sm"
        >
          {Object.entries(TEXT_ALIGNMENTS).map(([key, value]) => (
            <option key={key} value={value}>
              {key.charAt(0) + key.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={element.content.bold}
            onChange={(e) => onUpdate(element.id, {
              content: { ...element.content, bold: e.target.checked }
            })}
            className="mr-1"
          />
          <span className="text-sm">Negrita</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={element.content.italic}
            onChange={(e) => onUpdate(element.id, {
              content: { ...element.content, italic: e.target.checked }
            })}
            className="mr-1"
          />
          <span className="text-sm">Cursiva</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={element.content.underline}
            onChange={(e) => onUpdate(element.id, {
              content: { ...element.content, underline: e.target.checked }
            })}
            className="mr-1"
          />
          <span className="text-sm">Subrayado</span>
        </label>
      </div>
    </div>
  );
}

function ShapeProperties({ element, onUpdate }: {
  element: ShapeElement;
  onUpdate: (id: string, updates: Partial<DocumentElement>) => void;
}) {
  return (
    <div className="mb-4">
      <h4 className="font-medium mb-2">Forma</h4>

      <div className="mb-2">
        <label className="block text-sm">Color de relleno</label>
        <input
          type="color"
          value={element.content.fillColor}
          onChange={(e) => onUpdate(element.id, {
            content: { ...element.content, fillColor: e.target.value }
          })}
          className="w-full h-8 border rounded"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm">Color del borde</label>
        <input
          type="color"
          value={element.content.strokeColor}
          onChange={(e) => onUpdate(element.id, {
            content: { ...element.content, strokeColor: e.target.value }
          })}
          className="w-full h-8 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm">Ancho del borde</label>
        <input
          type="number"
          value={element.content.strokeWidth}
          onChange={(e) => onUpdate(element.id, {
            content: { ...element.content, strokeWidth: parseFloat(e.target.value) || 1 }
          })}
          className="w-full p-1 border rounded text-sm"
          min="0"
          step="0.5"
        />
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function EdicionModule() {
  return (
    <EdicionProvider>
      <div className="h-screen flex flex-col">
        <EdicionToolbar />
        <div className="flex flex-1 overflow-hidden">
          <EdicionCanvas />
          <EdicionPropertiesPanel />
        </div>
      </div>
    </EdicionProvider>
  );
}

// ==================== EXPORTS ====================
export { EdicionProvider, useEdicion };
export type { DocumentElement, EdicionState, ShapeElement, TextElement };

