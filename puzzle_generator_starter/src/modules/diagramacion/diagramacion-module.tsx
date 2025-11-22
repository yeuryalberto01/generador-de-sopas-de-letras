import { Download, Grid, Layout, Loader, Printer, Save, Settings, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UI_TEXTS } from '../../constants/uiTexts';
import { temasService } from '../../services/temas';

// ==================== CONSTANTS ====================
const PAGE_SIZES = {
  LETTER: { width: 8.5, height: 11, label: '8.5" × 11" (Carta)' },
  TABLOID: { width: 11, height: 17, label: '11" × 17" (Tabloide)' }
};

const GRID_TYPES = {
  AUTO: 'auto',
  MANUAL: 'manual',
  COMPACT: 'compact',
  SPACIOUS: 'spacious'
};

const WORD_DIRECTIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  DIAGONAL_DOWN: 'diagonal-down',
  DIAGONAL_UP: 'diagonal-up',
  HORIZONTAL_REVERSE: 'horizontal-reverse',
  VERTICAL_REVERSE: 'vertical-reverse'
};

const WORD_BOX_STYLES = {
  NUMBERED: 'numbered',
  COLUMNS: 'columns',
  GRID: 'grid',
  FLOWING: 'flowing'
};

// ==================== CONTEXT ====================
const DiagramacionContext = createContext(null);

function DiagramacionProvider({ children }) {
  const [state, setState] = useState({
    pageSize: 'LETTER',
    selectedTema: null,
    gridConfig: {
      type: GRID_TYPES.AUTO,
      rows: 15,
      cols: 15,
      cellSize: 30
    },
    wordBoxConfig: {
      visible: true,
      style: WORD_BOX_STYLES.COLUMNS,
      columns: 3,
      numbered: true,
      position: 'bottom'
    },
    placedWords: [],
    grid: [],
    zoom: 100,
    showSolutionHighlight: true,
    showGrid: true
  });

  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <DiagramacionContext.Provider value={{ state, updateState }}>
      {children}
    </DiagramacionContext.Provider>
  );
}

function useDiagramacion() {
  const context = useContext(DiagramacionContext);
  if (!context) throw new Error(UI_TEXTS.CONTEXT_ERRORS.DIAGRAMACION_PROVIDER);
  return context;
}

// ==================== WORD SEARCH ALGORITHM ====================
function useWordSearchAlgorithm() {
  const generateGrid = useCallback((rows, cols, words) => {
    // Crear grid vacío
    const grid = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({ letter: '', isWord: false, wordId: null }))
    );

    const placedWords = [];
    const directions = [
      { dx: 1, dy: 0, type: WORD_DIRECTIONS.HORIZONTAL },
      { dx: 0, dy: 1, type: WORD_DIRECTIONS.VERTICAL },
      { dx: 1, dy: 1, type: WORD_DIRECTIONS.DIAGONAL_DOWN },
      { dx: 1, dy: -1, type: WORD_DIRECTIONS.DIAGONAL_UP }
    ];

    // Intentar colocar cada palabra
    words.forEach((word, wordIndex) => {
      const wordText = word.texto.toUpperCase().replace(/\s/g, '');
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        
        // Dirección aleatoria
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // Posición inicial aleatoria
        const startRow = Math.floor(Math.random() * rows);
        const startCol = Math.floor(Math.random() * cols);

        // Verificar si cabe
        let canPlace = true;
        const positions = [];

        for (let i = 0; i < wordText.length; i++) {
          const row = startRow + (direction.dy * i);
          const col = startCol + (direction.dx * i);

          if (row < 0 || row >= rows || col < 0 || col >= cols) {
            canPlace = false;
            break;
          }

          const cell = grid[row][col];
          if (cell.letter !== '' && cell.letter !== wordText[i]) {
            canPlace = false;
            break;
          }

          positions.push({ row, col, letter: wordText[i] });
        }

        if (canPlace) {
          // Colocar palabra
          positions.forEach(({ row, col, letter }) => {
            grid[row][col] = {
              letter,
              isWord: true,
              wordId: wordIndex
            };
          });

          placedWords.push({
            id: wordIndex,
            text: wordText,
            originalText: word.texto,
            startRow,
            startCol,
            direction: direction.type,
            positions
          });

          placed = true;
        }
      }
    });

    // Rellenar espacios vacíos con letras aleatorias
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col].letter === '') {
          grid[row][col].letter = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    return { grid, placedWords };
  }, []);

  return { generateGrid };
}

// ==================== GRID CALCULATOR ====================
function calculateGridSize(wordCount, wordLengths, pageSize, gridType) {
  const maxLength = Math.max(...wordLengths);

  // Calcular tamaño base óptimo
  let baseSize;
  if (wordCount <= 10) {
    baseSize = Math.max(12, maxLength + 3);
  } else if (wordCount <= 20) {
    baseSize = Math.max(15, maxLength + 2);
  } else if (wordCount <= 30) {
    baseSize = Math.max(18, maxLength + 1);
  } else {
    baseSize = Math.max(20, maxLength);
  }

  // Ajustar según tamaño de página
  if (pageSize === 'TABLOID') {
    baseSize = Math.floor(baseSize * 1.3);
  }

  // Aplicar modificadores según tipo de grid
  let finalSize;
  switch (gridType) {
    case GRID_TYPES.COMPACT:
      // Reducir tamaño para hacer más compacto (mínimo 10x10)
      finalSize = Math.max(10, Math.floor(baseSize * 0.8));
      break;

    case GRID_TYPES.SPACIOUS:
      // Aumentar tamaño para hacer más espacioso (máximo 35x35)
      finalSize = Math.min(35, Math.floor(baseSize * 1.4));
      break;

    case GRID_TYPES.AUTO:
    default:
      // Mantener tamaño óptimo
      finalSize = baseSize;
      break;
  }

  return Math.min(finalSize, 35); // Máximo 35x35 para spacious
}


// ==================== COMPONENTS ====================

// Toolbar Panel
function ToolbarPanel() {
  const { state, updateState } = useDiagramacion();

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save size={18} />
          Guardar
        </button>
        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
          <Download size={18} />
          Exportar PDF
        </button>
        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
          <Printer size={18} />
          Imprimir
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => updateState({ zoom: Math.max(25, state.zoom - 10) })}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-medium w-12 text-center">{state.zoom}%</span>
          <button 
            onClick={() => updateState({ zoom: Math.min(200, state.zoom + 10) })}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Page Size Selector
function PageSizeSelector() {
  const { state, updateState } = useDiagramacion();

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Layout size={18} />
        Tamaño de Página
      </h3>
      <div className="space-y-2">
        {Object.entries(PAGE_SIZES).map(([key, size]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
            <input
              type="radio"
              name="pageSize"
              value={key}
              checked={state.pageSize === key}
              onChange={(e) => updateState({ pageSize: e.target.value })}
              className="w-4 h-4"
            />
            <span className="text-sm">{size.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Tema Selector
function TemaSelector() {
  const { state, updateState } = useDiagramacion();
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemas = async () => {
      try {
        const temasData = await temasService.getTemas();
        setTemas(temasData);
      } catch (error) {
        console.error('Error loading temas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTemas();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Type size={18} />
        Seleccionar Tema
      </h3>
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <Loader className="animate-spin" size={20} />
          <span className="ml-2">Cargando temas...</span>
        </div>
      ) : (
        <select
          value={state.selectedTema?.id || ''}
          onChange={(e) => {
            const tema = temas.find(t => t.id === e.target.value);
            updateState({ selectedTema: tema });
          }}
          className="w-full p-2 border rounded-lg"
        >
          <option value="">-- Seleccionar --</option>
          {temas.map(tema => (
            <option key={tema.id} value={tema.id}>
              {tema.nombre} ({tema.palabras?.length || 0} palabras)
            </option>
          ))}
        </select>
      )}
      
      {state.selectedTema && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
          <p className="font-medium mb-2">Palabras:</p>
          <div className="flex flex-wrap gap-1">
            {state.selectedTema.palabras.map((p, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                {p.texto}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Grid Configurator
function GridConfigurator() {
  const { state, updateState } = useDiagramacion();
  const { generateGrid } = useWordSearchAlgorithm();

  // Calcular tamaño esperado según configuración actual
  const getExpectedSize = () => {
    if (!state.selectedTema || state.gridConfig.type === GRID_TYPES.MANUAL) {
      return `${state.gridConfig.rows}×${state.gridConfig.cols}`;
    }

    const words = state.selectedTema.palabras;
    const wordLengths = words.map(w => w.texto.length);
    const size = calculateGridSize(words.length, wordLengths, state.pageSize, state.gridConfig.type);
    return `${size}×${size}`;
  };

  // Función para regenerar grilla con nuevo tamaño cuando cambia el tipo
  const handleGridTypeChange = async (newGridType) => {
    if (!state.selectedTema || !state.grid || state.grid.length === 0) {
      // Solo actualizar el tipo si no hay grilla generada
      updateState({
        gridConfig: { ...state.gridConfig, type: newGridType }
      });
      return;
    }

    // Mostrar indicador de carga mientras se regenera
    updateState({ isGenerating: true });

    try {
      // Regenerar grilla con el nuevo tamaño
      const words = state.selectedTema.palabras;
      const wordLengths = words.map(w => w.texto.length);

      let rows = state.gridConfig.rows;
      let cols = state.gridConfig.cols;

      // Calcular nuevo tamaño según tipo de grid
      if (newGridType !== GRID_TYPES.MANUAL) {
        const size = calculateGridSize(words.length, wordLengths, state.pageSize, newGridType);
        rows = cols = size;
      }

      const { grid, placedWords } = generateGrid(rows, cols, words);

      updateState({
        grid,
        placedWords,
        gridConfig: { ...state.gridConfig, type: newGridType, rows, cols },
        isGenerating: false
      });
    } catch (error) {
      updateState({ isGenerating: false, error: UI_TEXTS.ERRORS.REGENERATING_GRID });
    }
  };

  const handleGenerate = () => {
    if (!state.selectedTema) {
      alert(UI_TEXTS.INFO.SELECT_THEME_FIRST);
      return;
    }

    const words = state.selectedTema.palabras;
    const wordLengths = words.map(w => w.texto.length);

    let rows = state.gridConfig.rows;
    let cols = state.gridConfig.cols;

    // Calcular tamaño según tipo de grid
    if (state.gridConfig.type !== GRID_TYPES.MANUAL) {
      const size = calculateGridSize(words.length, wordLengths, state.pageSize, state.gridConfig.type);
      rows = cols = size;
    }

    const { grid, placedWords } = generateGrid(rows, cols, words);

    updateState({
      grid,
      placedWords,
      gridConfig: { ...state.gridConfig, rows, cols }
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Grid size={18} />
        Configuración de Cuadrícula
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select
            value={state.gridConfig.type}
            onChange={(e) => handleGridTypeChange(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={state.isGenerating}
          >
            <option value={GRID_TYPES.AUTO}>Automático (Tamaño óptimo basado en palabras)</option>
            <option value={GRID_TYPES.COMPACT}>Compacto (80% del tamaño óptimo - más pequeño)</option>
            <option value={GRID_TYPES.SPACIOUS}>Espacioso (140% del tamaño óptimo - más grande)</option>
            <option value={GRID_TYPES.MANUAL}>Manual (Configuración personalizada)</option>
          </select>

          {state.selectedTema && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                {state.isGenerating ? (
                  <>
                    <Loader className="animate-spin" size={14} />
                    <span>Regenerando grilla...</span>
                  </>
                ) : (
                  <>
                    <Grid size={14} />
                    <span>Tamaño esperado: <strong>{getExpectedSize()}</strong></span>
                  </>
                )}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {state.gridConfig.type === GRID_TYPES.COMPACT && "Más compacto, mejor para puzzles simples"}
                {state.gridConfig.type === GRID_TYPES.SPACIOUS && "Más espacioso, mejor para puzzles complejos"}
                {state.gridConfig.type === GRID_TYPES.AUTO && "Equilibrado entre complejidad y espacio"}
                {state.gridConfig.type === GRID_TYPES.MANUAL && "Configuración personalizada"}
              </p>
            </div>
          )}
        </div>

        {state.gridConfig.type === GRID_TYPES.MANUAL && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Filas</label>
              <input
                type="number"
                value={state.gridConfig.rows}
                onChange={(e) => updateState({
                  gridConfig: { ...state.gridConfig, rows: parseInt(e.target.value) }
                })}
                min="10"
                max="30"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Columnas</label>
              <input
                type="number"
                value={state.gridConfig.cols}
                onChange={(e) => updateState({
                  gridConfig: { ...state.gridConfig, cols: parseInt(e.target.value) }
                })}
                min="10"
                max="30"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="showHighlight"
            checked={state.showSolutionHighlight}
            onChange={(e) => updateState({ showSolutionHighlight: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="showHighlight" className="text-sm">
            Resaltar palabras en la solución
          </label>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!state.selectedTema}
          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Generar Sopa de Letras
        </button>
      </div>
    </div>
  );
}

// Word Box Designer
function WordBoxDesigner() {
  const { state, updateState } = useDiagramacion();

  return (
    <div className="p-4 bg-white rounded-lg border">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Settings size={18} />
        Caja de Palabras
      </h3>
      
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.wordBoxConfig.visible}
            onChange={(e) => updateState({
              wordBoxConfig: { ...state.wordBoxConfig, visible: e.target.checked }
            })}
            className="w-4 h-4"
          />
          <span className="text-sm">Mostrar caja de palabras</span>
        </label>

        {state.wordBoxConfig.visible && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Estilo</label>
              <select
                value={state.wordBoxConfig.style}
                onChange={(e) => updateState({
                  wordBoxConfig: { ...state.wordBoxConfig, style: e.target.value }
                })}
                className="w-full p-2 border rounded"
              >
                <option value={WORD_BOX_STYLES.COLUMNS}>Columnas</option>
                <option value={WORD_BOX_STYLES.NUMBERED}>Numeradas</option>
                <option value={WORD_BOX_STYLES.GRID}>Cuadrícula</option>
                <option value={WORD_BOX_STYLES.FLOWING}>Flujo continuo</option>
              </select>
            </div>

            {state.wordBoxConfig.style === WORD_BOX_STYLES.COLUMNS && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Número de columnas: {state.wordBoxConfig.columns}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={state.wordBoxConfig.columns}
                  onChange={(e) => updateState({
                    wordBoxConfig: { ...state.wordBoxConfig, columns: parseInt(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.wordBoxConfig.numbered}
                onChange={(e) => updateState({
                  wordBoxConfig: { ...state.wordBoxConfig, numbered: e.target.checked }
                })}
                className="w-4 h-4"
              />
              <span className="text-sm">Numerar palabras</span>
            </label>
          </>
        )}
      </div>
    </div>
  );
}

// Canvas (Word Search Grid)
function WordSearchCanvas() {
  const { state } = useDiagramacion();
  const pageSize = PAGE_SIZES[state.pageSize];

  if (state.grid.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Grid size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg font-medium">
            Selecciona un tema y genera la sopa de letras
          </p>
        </div>
      </div>
    );
  }

  const cellSize = state.gridConfig.cellSize * (state.zoom / 100);

  return (
    <div className="overflow-auto h-full bg-gray-100 p-8">
      <div 
        className="bg-white shadow-lg mx-auto"
        style={{
          width: `${pageSize.width * 96}px`,
          minHeight: `${pageSize.height * 96}px`,
          padding: '40px'
        }}
      >
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6">
          Sopa de Letras: {state.selectedTema?.nombre}
        </h2>

        {/* Grid */}
        <div className="flex justify-center mb-6">
          <div 
            className="inline-block border-2 border-gray-800"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${state.gridConfig.cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${state.gridConfig.rows}, ${cellSize}px)`
            }}
          >
            {state.grid.map((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="border border-gray-300 flex items-center justify-center font-bold"
                  style={{
                    fontSize: `${cellSize * 0.5}px`,
                    backgroundColor: cell.isWord && state.showSolutionHighlight ? '#eff6ff' : 'white'
                  }}
                >
                  {cell.letter}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Word Box */}
        {state.wordBoxConfig.visible && state.selectedTema && (
          <div className="border-2 border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-center">Encuentra estas palabras:</h3>
            {state.wordBoxConfig.style === WORD_BOX_STYLES.COLUMNS && (
              <div 
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${state.wordBoxConfig.columns}, 1fr)`
                }}
              >
                {state.selectedTema.palabras.map((palabra, idx) => (
                  <div key={idx} className="text-sm">
                    {state.wordBoxConfig.numbered && <span className="font-bold mr-1">{idx + 1}.</span>}
                    {palabra.texto}
                  </div>
                ))}
              </div>
            )}
            {state.wordBoxConfig.style === WORD_BOX_STYLES.NUMBERED && (
              <ol className="list-decimal list-inside grid grid-cols-3 gap-2">
                {state.selectedTema.palabras.map((palabra, idx) => (
                  <li key={idx} className="text-sm">{palabra.texto}</li>
                ))}
              </ol>
            )}
            {state.wordBoxConfig.style === WORD_BOX_STYLES.FLOWING && (
              <div className="flex flex-wrap gap-3 justify-center">
                {state.selectedTema.palabras.map((palabra, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {palabra.texto}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Live Preview Panel
function LivePreviewPanel() {
  const { state } = useDiagramacion();
  const pageSize = PAGE_SIZES[state.pageSize];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold">Vista Previa</h3>
        <p className="text-xs text-gray-500 mt-1">
          Los cambios se reflejan en tiempo real
        </p>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div 
          className="bg-white shadow-md mx-auto"
          style={{
            width: '100%',
            maxWidth: '400px',
            aspectRatio: `${pageSize.width} / ${pageSize.height}`,
            fontSize: '0.5em',
            transform: 'scale(0.95)',
            transformOrigin: 'top center'
          }}
        >
          {state.grid.length > 0 ? (
            <div className="p-4 h-full flex flex-col">
              <div className="text-center font-bold mb-2 text-xs">
                {state.selectedTema?.nombre}
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div 
                  className="border inline-block"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${state.gridConfig.cols}, 8px)`,
                    gridTemplateRows: `repeat(${state.gridConfig.rows}, 8px)`,
                    fontSize: '4px'
                  }}
                >
                  {state.grid.map((row, rowIdx) =>
                    row.map((cell, colIdx) => (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className="border border-gray-300 flex items-center justify-center"
                        style={{
                          backgroundColor: cell.isWord && state.showSolutionHighlight ? '#eff6ff' : 'white'
                        }}
                      >
                        {cell.letter}
                      </div>
                    ))
                  )}
                </div>
              </div>
              {state.wordBoxConfig.visible && (
                <div className="mt-2 border p-2 text-xs">
                  <div className="grid grid-cols-2 gap-1 text-[6px]">
                    {state.selectedTema?.palabras.slice(0, 6).map((p, i) => (
                      <div key={i}>{p.texto}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              Sin contenido
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 border-t bg-white text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Tamaño: {pageSize.label}</span>
          <span>Zoom: {state.zoom}%</span>
        </div>
        {state.placedWords.length > 0 && (
          <div className="mt-1">
            Palabras colocadas: {state.placedWords.length} / {state.selectedTema?.palabras.length || 0}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Layout
function DiagramacionLayout() {
  const { state } = useDiagramacion();

  return (
    <div className="h-screen flex flex-col">
      <ToolbarPanel />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 border-r bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            <PageSizeSelector />
            <TemaSelector />
            <GridConfigurator />
            <WordBoxDesigner />
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 overflow-hidden">
          <WordSearchCanvas key={`${state.gridConfig.rows}-${state.gridConfig.cols}-${state.gridConfig.type}`} />
        </div>

        {/* Right Panel - Preview */}
        <div className="w-96 border-l">
          <LivePreviewPanel />
        </div>
      </div>
    </div>
  );
}

// Main App
export default function DiagramacionApp() {
  return (
    <DiagramacionProvider>
      <DiagramacionLayout />
    </DiagramacionProvider>
  );
}