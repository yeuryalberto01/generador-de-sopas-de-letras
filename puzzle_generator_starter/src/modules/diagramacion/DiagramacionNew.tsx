import { Download, Grid, Layout, Printer, Save, Settings, Type, ZoomIn, ZoomOut } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';

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
  if (!context) throw new Error('useDiagramacion must be used within DiagramacionProvider');
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
function calculateOptimalGrid(wordCount, wordLengths, pageSize) {
  const avgLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
  const maxLength = Math.max(...wordLengths);

  let size;
  if (wordCount <= 10) {
    size = Math.max(12, maxLength + 3);
  } else if (wordCount <= 20) {
    size = Math.max(15, maxLength + 2);
  } else if (wordCount <= 30) {
    size = Math.max(18, maxLength + 1);
  } else {
    size = Math.max(20, maxLength);
  }

  // Ajustar según tamaño de página
  if (pageSize === 'TABLOID') {
    size = Math.floor(size * 1.3);
  }

  return Math.min(size, 30); // Máximo 30x30
}

// ==================== COMPONENTS ====================

// Toolbar Panel
function ToolbarPanel() {
  const { state, updateState } = useDiagramacion();

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-gray-300 dark:border-slate-600 shadow-lg relative z-10">
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2 relative z-20">
          <Save size={18} />
          Guardar
        </button>
        <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2 text-gray-900 dark:text-white relative z-20">
          <Download size={18} />
          Exportar PDF
        </button>
        <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2 text-gray-900 dark:text-white relative z-20">
          <Printer size={18} />
          Imprimir
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateState({ zoom: Math.max(25, state.zoom - 10) })}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-900 dark:text-white relative z-20"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-medium w-12 text-center text-gray-900 dark:text-white relative z-20">{state.zoom}%</span>
          <button
            onClick={() => updateState({ zoom: Math.min(200, state.zoom + 10) })}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-gray-900 dark:text-white relative z-20"
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
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-600 shadow-lg relative z-10">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
        <Layout size={18} className="text-gray-900 dark:text-white" />
        Tamaño de Página
      </h3>
      <div className="space-y-2">
        {Object.entries(PAGE_SIZES).map(([key, size]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 p-2 rounded relative z-20">
            <input
              type="radio"
              name="pageSize"
              value={key}
              checked={state.pageSize === key}
              onChange={(e) => updateState({ pageSize: e.target.value })}
              className="w-4 h-4 text-blue-600 dark:text-blue-400 relative z-30"
            />
            <span className="text-sm text-gray-900 dark:text-white font-medium relative z-20">{size.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Tema Selector (Mock - se conectará a la API)
function TemaSelector() {
  const { state, updateState } = useDiagramacion();

  // Mock temas - en producción vendrá de la API
  const mockTemas = [
    { id: 1, nombre: 'Animales', palabras: [
      { texto: 'Perro' }, { texto: 'Gato' }, { texto: 'León' },
      { texto: 'Elefante' }, { texto: 'Jirafa' }, { texto: 'Tigre' }
    ]},
    { id: 2, nombre: 'Frutas', palabras: [
      { texto: 'Manzana' }, { texto: 'Pera' }, { texto: 'Uva' },
      { texto: 'Sandía' }, { texto: 'Melón' }
    ]},
    { id: 3, nombre: 'Colores', palabras: [
      { texto: 'Rojo' }, { texto: 'Azul' }, { texto: 'Verde' },
      { texto: 'Amarillo' }, { texto: 'Naranja' }, { texto: 'Morado' }
    ]}
  ];

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-600 shadow-lg relative z-10">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
        <Type size={18} className="text-gray-900 dark:text-white" />
        Seleccionar Tema
      </h3>
      <select
        value={state.selectedTema?.id || ''}
        onChange={(e) => {
          const tema = mockTemas.find(t => t.id === parseInt(e.target.value));
          updateState({ selectedTema: tema });
        }}
        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white relative z-20"
      >
        <option value="">-- Seleccionar --</option>
        {mockTemas.map(tema => (
          <option key={tema.id} value={tema.id}>
            {tema.nombre} ({tema.palabras.length} palabras)
          </option>
        ))}
      </select>

      {state.selectedTema && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded text-sm text-gray-900 dark:text-white relative z-20">
          <p className="font-medium mb-2 text-gray-900 dark:text-white">Palabras:</p>
          <div className="flex flex-wrap gap-1">
            {state.selectedTema.palabras.map((p, i) => (
              <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium relative z-20">
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

  const handleGenerate = () => {
    if (!state.selectedTema) {
      alert('Por favor selecciona un tema primero');
      return;
    }

    const words = state.selectedTema.palabras;
    const wordLengths = words.map(w => w.texto.length);
    let rows = state.gridConfig.rows;
    let cols = state.gridConfig.cols;

    if (state.gridConfig.type === GRID_TYPES.AUTO) {
      const size = calculateOptimalGrid(words.length, wordLengths, state.pageSize);
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
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-600 shadow-lg relative z-10">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
        <Grid size={18} className="text-gray-900 dark:text-white" />
        Configuración de Cuadrícula
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Tipo</label>
          <select
            value={state.gridConfig.type}
            onChange={(e) => updateState({
              gridConfig: { ...state.gridConfig, type: e.target.value }
            })}
            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white relative z-20"
          >
            <option value={GRID_TYPES.AUTO}>Automático (Óptimo)</option>
            <option value={GRID_TYPES.MANUAL}>Manual</option>
            <option value={GRID_TYPES.COMPACT}>Compacto</option>
            <option value={GRID_TYPES.SPACIOUS}>Espacioso</option>
          </select>
        </div>

        {state.gridConfig.type === GRID_TYPES.MANUAL && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Filas</label>
              <input
                type="number"
                value={state.gridConfig.rows}
                onChange={(e) => updateState({
                  gridConfig: { ...state.gridConfig, rows: parseInt(e.target.value) }
                })}
                min="10"
                max="30"
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white relative z-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Columnas</label>
              <input
                type="number"
                value={state.gridConfig.cols}
                onChange={(e) => updateState({
                  gridConfig: { ...state.gridConfig, cols: parseInt(e.target.value) }
                })}
                min="10"
                max="30"
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white relative z-20"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!state.selectedTema}
          className="w-full py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed relative z-20"
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
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-600 shadow-lg relative z-10">
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
        <Settings size={18} className="text-gray-900 dark:text-white" />
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
            className="w-4 h-4 text-blue-600 dark:text-blue-400 relative z-20"
          />
          <span className="text-sm text-gray-900 dark:text-white">Mostrar caja de palabras</span>
        </label>

        {state.wordBoxConfig.visible && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">Estilo</label>
              <select
                value={state.wordBoxConfig.style}
                onChange={(e) => updateState({
                  wordBoxConfig: { ...state.wordBoxConfig, style: e.target.value }
                })}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-white relative z-20"
              >
                <option value={WORD_BOX_STYLES.COLUMNS}>Columnas</option>
                <option value={WORD_BOX_STYLES.NUMBERED}>Numeradas</option>
                <option value={WORD_BOX_STYLES.GRID}>Cuadrícula</option>
                <option value={WORD_BOX_STYLES.FLOWING}>Flujo continuo</option>
              </select>
            </div>

            {state.wordBoxConfig.style === WORD_BOX_STYLES.COLUMNS && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-white">
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
                  className="w-full relative z-20"
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
                className="w-4 h-4 text-blue-600 dark:text-blue-400 relative z-20"
              />
              <span className="text-sm text-gray-900 dark:text-white">Numerar palabras</span>
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
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <Grid size={64} className="mx-auto mb-4 text-gray-300 dark:text-slate-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            Selecciona un tema y genera la sopa de letras
          </p>
        </div>
      </div>
    );
  }

  const cellSize = state.gridConfig.cellSize * (state.zoom / 100);
  const gridWidth = state.gridConfig.cols * cellSize;
  const gridHeight = state.gridConfig.rows * cellSize;

  return (
    <div className="overflow-auto h-full bg-gray-100 dark:bg-slate-900 p-8">
      <div
        className="bg-white dark:bg-slate-800 shadow-lg mx-auto border border-gray-300 dark:border-slate-600"
        style={{
          width: `${pageSize.width * 96}px`,
          minHeight: `${pageSize.height * 96}px`,
          padding: '40px'
        }}
      >
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
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
                  className={`border border-gray-300 dark:border-slate-600 flex items-center justify-center font-bold text-gray-900 dark:text-white ${cell.isWord ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'}`}
                  style={{
                    fontSize: `${cellSize * 0.5}px`
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
          <div className="border-2 border-gray-300 dark:border-slate-600 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-center text-gray-900 dark:text-white">Encuentra estas palabras:</h3>
            {state.wordBoxConfig.style === WORD_BOX_STYLES.COLUMNS && (
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${state.wordBoxConfig.columns}, 1fr)`
                }}
              >
                {state.selectedTema.palabras.map((palabra, idx) => (
                  <div key={idx} className="text-sm text-gray-900 dark:text-white">
                    {state.wordBoxConfig.numbered && <span className="font-bold mr-1 text-gray-900 dark:text-white">{idx + 1}.</span>}
                    {palabra.texto}
                  </div>
                ))}
              </div>
            )}
            {state.wordBoxConfig.style === WORD_BOX_STYLES.NUMBERED && (
              <ol className="list-decimal list-inside grid grid-cols-3 gap-2 text-gray-900 dark:text-white">
                {state.selectedTema.palabras.map((palabra, idx) => (
                  <li key={idx} className="text-sm">{palabra.texto}</li>
                ))}
              </ol>
            )}
            {state.wordBoxConfig.style === WORD_BOX_STYLES.FLOWING && (
              <div className="flex flex-wrap gap-3 justify-center">
                {state.selectedTema.palabras.map((palabra, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-full text-sm">
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
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
      <div className="p-4 border-b bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600">
        <h3 className="font-semibold text-gray-900 dark:text-white">Vista Previa</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Los cambios se reflejan en tiempo real
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div
          className="bg-white dark:bg-slate-800 shadow-md mx-auto border border-gray-300 dark:border-slate-600"
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
              <div className="text-center font-bold mb-2 text-xs text-gray-900 dark:text-white">
                {state.selectedTema?.nombre}
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="border border-gray-300 dark:border-slate-600 inline-block"
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
                        className={`border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-900 dark:text-white ${cell.isWord ? 'bg-blue-50 dark:bg-blue-900' : 'bg-white dark:bg-slate-800'}`}
                      >
                        {cell.letter}
                      </div>
                    ))
                  )}
                </div>
              </div>
              {state.wordBoxConfig.visible && (
                <div className="mt-2 border border-gray-300 dark:border-slate-600 p-2 text-xs text-gray-900 dark:text-gray-100">
                  <div className="grid grid-cols-2 gap-1 text-[6px] text-gray-900 dark:text-gray-100">
                    {state.selectedTema?.palabras.slice(0, 6).map((p, i) => (
                      <div key={i}>{p.texto}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
              Sin contenido
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t bg-white dark:bg-slate-800 text-xs text-gray-600 dark:text-gray-400">
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
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900">
      <ToolbarPanel />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 border-r border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 overflow-y-auto">
          <div className="p-4 space-y-4">
            <PageSizeSelector />
            <TemaSelector />
            <GridConfigurator />
            <WordBoxDesigner />
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
          <WordSearchCanvas />
        </div>

        {/* Right Panel - Preview */}
        <div className="w-96 border-l border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800">
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