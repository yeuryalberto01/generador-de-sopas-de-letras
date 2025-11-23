import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Download, Loader2, RefreshCcw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { post } from '../../services/apiClient';
import { generatePDF } from '../../services/pdfExporter';
import { temasService } from '../../services/temas';
import type { Tema } from '../../types';
import SopaTemplateOverlay from './components/SopaTemplateOverlay';

type WordPlacement = {
  palabra: string;
  positions: { row: number; col: number }[];
};

type GridResult = {
  grid: { letter: string; isWord: boolean }[][];
  placements: WordPlacement[];
  stats: {
    totalWords: number;
    placedWords: number;
    successRate: number;
    gridRows: number;
    gridCols: number;
    difficulty?: string;
  };
};

const sanitizeWords = (tema?: Tema | null) => {
  if (!tema?.palabras) return [];
  return tema.palabras
    .map((palabra: any) => {
      if (typeof palabra === 'string') return palabra.trim();
      if (palabra?.texto) return String(palabra.texto).trim();
      return '';
    })
    .filter(Boolean)
    .map((texto) => ({ texto }));
};

export default function DiagramacionSimple() {
  const navigate = useNavigate();
  const { temaId } = useParams();
  const [temas, setTemas] = useState<Tema[]>([]);
  const [isLoadingTemas, setIsLoadingTemas] = useState(true);
  const [selectedTemaId, setSelectedTemaId] = useState('');
  const [gridRows, setGridRows] = useState(15);
  const [gridCols, setGridCols] = useState(15);
  const [allowDiagonal, setAllowDiagonal] = useState(true);
  const [allowReverse, setAllowReverse] = useState(true);
  const [showGridBorders, setShowGridBorders] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [pageSize, setPageSize] = useState<'LETTER' | 'TABLOID'>('LETTER');
  const [wordBoxStyle, setWordBoxStyle] = useState<'columns' | 'grid' | 'tags' | 'list'>('columns');
  const [wordBoxPosition, setWordBoxPosition] = useState<'bottom' | 'right' | 'left'>('bottom');
  const [wordBoxColumns, setWordBoxColumns] = useState(3);
  const [wordBoxNumbered, setWordBoxNumbered] = useState(true);
  const [autoRender, setAutoRender] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [result, setResult] = useState<GridResult | null>(null);
  const [gridSizeUsed, setGridSizeUsed] = useState<{ rows: number; cols: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseGridSize = (value: any): { rows: number; cols: number } | null => {
    if (typeof value === 'string' && value.includes('x')) {
      const [r, c] = value.split('x').map((v) => parseInt(v, 10));
      if (Number.isFinite(r) && Number.isFinite(c) && r > 0 && c > 0) return { rows: r, cols: c };
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return { rows: value, cols: value };
    }
    if (Array.isArray(value) && value.length === 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
      return { rows: Number(value[0]), cols: Number(value[1]) };
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loadedTemas = await temasService.getTemas();
        if (!mounted) return;
        setTemas(loadedTemas);
        if (loadedTemas.length) {
          const match = loadedTemas.find((t) => t.id === temaId);
          setSelectedTemaId(match ? match.id : loadedTemas[0].id);
        }
      } catch (err: any) {
        console.error('Error cargando temas', err);
        setError('No se pudieron cargar los temas. Intenta de nuevo.');
      } finally {
        if (mounted) setIsLoadingTemas(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedTema = useMemo(
    () => temas.find((t) => t.id === selectedTemaId) || null,
    [temas, selectedTemaId]
  );

  const handleGenerate = async () => {
    setError(null);
    setGridSizeUsed(null);
    if (!selectedTema) {
      setError('Selecciona un tema para generar la sopa de letras.');
      return;
    }

    const words = sanitizeWords(selectedTema);
    if (words.length === 0) {
      setError('El tema seleccionado no tiene palabras válidas.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await post('/diagramacion/generate', {
        tema_id: selectedTema.id,
        grid_size: `${gridRows}x${gridCols}`,
        difficulty,
        allow_diagonal: allowDiagonal,
        allow_reverse: allowReverse,
        title: customTitle,
        word_box_style: wordBoxStyle,
        word_box_columns: wordBoxColumns,
        word_box_numbered: wordBoxNumbered,
        word_box_position: wordBoxPosition,
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || 'No se pudo generar la sopa.');
      }

      const data = response.data;
      if (data.success === false) {
        throw new Error(data.error || 'No se pudieron colocar todas las palabras en la grilla.');
      }
      if (!data.grid || !Array.isArray(data.grid)) {
        throw new Error('La API no devolvió una grilla válida.');
      }

      const sizeFromApi =
        parseGridSize(data.grid_size || data.tamaño || data.tamano) ||
        (Array.isArray(data.grid)
          ? { rows: data.grid.length, cols: Array.isArray(data.grid[0]) ? data.grid[0].length : data.grid.length }
          : { rows: gridRows, cols: gridCols });

      const wordCells = new Set<string>();
      let placements: WordPlacement[] = [];

      if (Array.isArray(data.word_positions)) {
        placements = data.word_positions.map((pos: any) => {
          const wordText = String(pos.word || '').trim();
          const startRow = Number(pos.start_row) || 0;
          const startCol = Number(pos.start_col) || 0;
          const endRow = Number(pos.end_row ?? startRow);
          const endCol = Number(pos.end_col ?? startCol);
          const length =
            Math.max(
              wordText.length || 1,
              Math.abs(endRow - startRow) + 1,
              Math.abs(endCol - startCol) + 1
            ) || 1;
          const dr = length > 1 ? Math.sign(endRow - startRow) : 0;
          const dc = length > 1 ? Math.sign(endCol - startCol) : 0;

          const positions: { row: number; col: number }[] = [];
          for (let i = 0; i < length; i++) {
            const row = startRow + dr * i;
            const col = startCol + dc * i;
            positions.push({ row, col });
            wordCells.add(`${row}-${col}`);
          }

          return {
            palabra: wordText,
            positions,
          };
        });
      } else if (Array.isArray(data.soluciones)) {
        placements = (data.soluciones || []).map((sol: any) => {
          const wordText = String(sol.palabra || '').trim();
          const startRaw = Array.isArray(sol.inicio) ? sol.inicio : [0, 0];
          const endRaw = Array.isArray(sol.fin) ? sol.fin : startRaw;
          const startRow = Number(startRaw[0]) || 0;
          const startCol = Number(startRaw[1]) || 0;
          const endRow = Number(endRaw[0]) || startRow;
          const endCol = Number(endRaw[1]) || startCol;
          const length =
            Math.max(wordText.length, Math.abs(endRow - startRow) + 1, Math.abs(endCol - startCol) + 1) ||
            1;
          const dr = length > 1 ? Math.sign(endRow - startRow) : 0;
          const dc = length > 1 ? Math.sign(endCol - startCol) : 0;

          const positions: { row: number; col: number }[] = [];
          for (let i = 0; i < Math.max(length, 1); i++) {
            const row = startRow + dr * i;
            const col = startCol + dc * i;
            positions.push({ row, col });
            wordCells.add(`${row}-${col}`);
          }

          return {
            palabra: wordText || sol.palabra || '',
            positions,
          };
        });
      }

      const effectiveTotalWords = Math.max(
        words.length,
        Array.isArray(data.words) ? data.words.length : placements.length
      );

      const decoratedGrid = data.grid.map((row: any[], rowIndex: number) =>
        row.map((cell: any, colIndex: number) => ({
          letter: (cell || '').toString(),
          isWord: wordCells.has(`${rowIndex}-${colIndex}`),
        }))
      );

      setResult({
        grid: decoratedGrid,
        placements,
        stats: {
          totalWords: effectiveTotalWords,
          placedWords: placements.length,
          successRate: effectiveTotalWords ? (placements.length / effectiveTotalWords) * 100 : 0,
          gridRows: sizeFromApi.rows || gridRows,
          gridCols: sizeFromApi.cols || gridCols,
          difficulty: data.difficulty || difficulty,
        },
      });
      if (data.word_box_style) {
        setWordBoxStyle(data.word_box_style);
      }
      if (data.word_box_columns) {
        setWordBoxColumns(Number(data.word_box_columns));
      }
      if (typeof data.word_box_numbered === 'boolean') {
        setWordBoxNumbered(data.word_box_numbered);
      }
      if (data.word_box_position) {
        setWordBoxPosition(data.word_box_position);
      }
      if (typeof data.title === 'string') {
        setCustomTitle(data.title);
      }
      setGridSizeUsed(sizeFromApi);
    } catch (err: any) {
      console.error('Error generando sopa', err);
      setError('No se pudo generar la sopa de letras. Intenta con otra configuración.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generar cuando cambien las configuraciones clave
  useEffect(() => {
    if (!autoRender) return;
    if (!selectedTema) return;
    if (isGenerating) return;

    const timer = setTimeout(() => {
      handleGenerate();
    }, 400);

    return () => clearTimeout(timer);
  }, [autoRender, selectedTemaId, gridRows, gridCols, allowDiagonal, allowReverse, difficulty]);

  const handleExportPdf = async () => {
    if (!result || !selectedTema) {
      setError('Genera una sopa y selecciona un tema antes de exportar.');
      return;
    }

    setError(null);
    setIsExporting(true);
    try {
      const effectiveRows = gridSizeUsed?.rows || result.stats.gridRows || gridRows;
      const effectiveCols = gridSizeUsed?.cols || result.stats.gridCols || gridCols;
      const printableTema = { ...selectedTema, palabras: sanitizeWords(selectedTema) };
      const columnCount = Math.min(4, Math.max(1, wordBoxColumns));

      await generatePDF({
        grid: result.grid,
        tema: printableTema,
        pageSize,
        gridConfig: { rows: effectiveRows, cols: effectiveCols },
        wordBoxConfig: {
          visible: true,
          style: wordBoxStyle,
          columns: columnCount,
          numbered: wordBoxNumbered,
          position: 'bottom',
        },
        showGridBorders,
        showSolution,
      });
    } catch (err) {
      console.error('Error exportando PDF', err);
      setError('No se pudo exportar el PDF. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const wordsList = sanitizeWords(selectedTema);
  const currentRows = result?.stats.gridRows || gridSizeUsed?.rows || gridRows;
  const currentCols = result?.stats.gridCols || gridSizeUsed?.cols || gridCols;
  const gridBoxMM = 150;
  const cellMM = gridBoxMM / Math.max(currentRows, currentCols, 1);
  const previewScale = 1;

  const renderWordBox = () => {
    if (!wordsList.length) {
      return <p className="text-gray-500 text-sm">Este tema no tiene palabras.</p>;
    }

    if (wordBoxStyle === 'columns') {
      const cols = Math.max(1, Math.min(4, wordBoxColumns));
      const rowsPerCol = Math.ceil(wordsList.length / cols);
      const columns = Array.from({ length: cols }, (_, colIdx) =>
        wordsList.slice(colIdx * rowsPerCol, (colIdx + 1) * rowsPerCol)
      );

      return (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="space-y-2">
              {col.map((p, idx) => (
                <div key={`${colIdx}-${idx}`} className="text-xs text-gray-800 flex items-start gap-1">
                  {wordBoxNumbered && <span className="text-gray-400 min-w-[18px]">{colIdx * rowsPerCol + idx + 1}.</span>}
                  <span className="font-medium">{p.texto}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    if (wordBoxStyle === 'grid') {
      const cols = Math.max(2, Math.min(6, wordBoxColumns));
      return (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {wordsList.map((p, idx) => (
            <div
              key={idx}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center shadow-sm"
            >
              {wordBoxNumbered ? `${idx + 1}. ${p.texto}` : p.texto}
            </div>
          ))}
        </div>
      );
    }

    if (wordBoxStyle === 'tags') {
      return (
        <div className="flex flex-wrap gap-2">
          {wordsList.map((p, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 shadow-sm"
            >
              {wordBoxNumbered && <span className="text-[11px] font-bold">{idx + 1}</span>}
              {p.texto}
            </span>
          ))}
        </div>
      );
    }

    // list
    return (
      <ol className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm">
        {wordsList.map((p, idx) => (
          <li key={idx} className="px-3 py-2 text-sm flex items-center gap-2">
            {wordBoxNumbered ? (
              <span className="text-xs font-bold text-slate-500 w-6">{idx + 1}.</span>
            ) : null}
            <span className="font-medium text-slate-800">{p.texto}</span>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/libros')}
            className="inline-flex items-center gap-2 px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Libros
          </button>
          <div>
            <h1 className="text-lg font-semibold">Editor de Diagramación</h1>
            <p className="text-xs text-gray-500">
              Genera una sopa de letras básica a partir de tus temas.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/temas')}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          <BookOpen className="h-4 w-4" />
          Administrar Temas
        </button>
      </header>

      <main className="w-full py-8 px-4 lg:px-8 grid gap-6 lg:grid-cols-[340px_1fr_300px]">
        <section className="space-y-4">
          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-3">1. Selecciona un Tema</h2>
            {isLoadingTemas ? (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando temas...
              </p>
            ) : temas.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay temas disponibles. Crea uno en el módulo de Temas y vuelve aquí.
              </p>
            ) : (
              <select
                value={selectedTemaId}
                onChange={(e) => setSelectedTemaId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {temas.map((tema) => (
                  <option key={tema.id} value={tema.id}>
                    {tema.nombre} ({tema.palabras?.length || 0} palabras)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-white rounded shadow p-4 space-y-3">
            <h2 className="font-semibold">2. Configura el tablero</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Filas</label>
                <input
                  type="number"
                  min={8}
                  max={40}
                  value={gridRows}
                  onChange={(e) => setGridRows(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Columnas</label>
                <input
                  type="number"
                  min={8}
                  max={40}
                  value={gridCols}
                  onChange={(e) => setGridCols(Number(e.target.value))}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              El backend acepta tamaños rectangulares en formato NxM y ajusta automáticamente si no caben todas las palabras.
              {gridSizeUsed ? ` Último tamaño generado: ${gridSizeUsed.rows} × ${gridSizeUsed.cols}` : ''}
            </p>
            <label className="block text-sm font-medium">Dificultad</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="easy">Fácil (menos palabras)</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil (más palabras)</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowDiagonal}
                onChange={(e) => setAllowDiagonal(e.target.checked)}
              />
              Permitir diagonales
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowReverse}
                onChange={(e) => setAllowReverse(e.target.checked)}
              />
              Permitir palabras invertidas
            </label>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedTema}
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white rounded py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Generar sopa de letras
                </>
              )}
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <div className="bg-white rounded shadow p-4">
            <h2 className="font-semibold mb-2 text-sm">Palabras del tema</h2>
            {selectedTema ? (
              <div className="h-48 overflow-y-auto border rounded text-sm p-2 space-y-1">
                {wordsList.length > 0 ? (
                  wordsList.map((p, idx) => <div key={idx}>{p.texto}</div>)
                ) : (
                  <p className="text-gray-500">Este tema no tiene palabras.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Selecciona un tema para ver sus palabras.</p>
            )}
          </div>
        </section>

        <section className="bg-white rounded shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Resultado</h2>
              <p className="text-xs text-gray-500">
                Vista previa del tablero generado
              </p>
            </div>
            {result && (
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-600 text-right">
                  <div>
                    Colocadas: {result.stats.placedWords} / {result.stats.totalWords}
                  </div>
                  <div>Éxito: {result.stats.successRate.toFixed(1)}%</div>
                  <div>
                    Tamaño: {result.stats.gridRows} × {result.stats.gridCols}
                  </div>
                  {result.stats.difficulty && <div>Dificultad: {result.stats.difficulty}</div>}
                </div>
                <button
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exportar hoja
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto border rounded bg-white">
            {result ? (
              <div className="p-4 flex flex-col gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Generada en grilla {currentRows} × {currentCols}
                    {gridSizeUsed &&
                    (gridSizeUsed.rows > gridRows || gridSizeUsed.cols > gridCols)
                      ? ' (ajustada automáticamente)'
                      : ''}
                  </div>
                  <div className="overflow-auto flex justify-center">
                    <SopaTemplateOverlay
                      page="LETTER"
                      title={customTitle || selectedTema?.nombre || 'Sopa de Letras'}
                      grid={result.grid.map((row) => row.map((c) => c.letter || ''))}
                      words={wordsList.map((w) => w.texto)}
                      cellMM={Math.max(5, Math.min(10, gridBoxMM / Math.max(currentCols, currentRows)))}
                      strokeMM={0.25}
                      bgSrc="/template_bg.png"
                      gridBox={{ xMM: 15, yMM: 70, wMM: 150, hMM: 150 }}
                      wordsBox={
                        wordBoxPosition === 'right'
                          ? { xMM: 170, yMM: 74, wMM: 30 }
                          : wordBoxPosition === 'left'
                          ? { xMM: 10, yMM: 74, wMM: 30 }
                          : { xMM: 15, yMM: 230, wMM: 150 }
                      }
                      wordsColumns={wordBoxStyle === 'list' ? 1 : Math.max(1, Math.min(4, wordBoxColumns))}
                      borderColorHex="#0f172a"
                    />
                  </div>
                  {gridSizeUsed &&
                  (gridSizeUsed.rows > gridRows || gridSizeUsed.cols > gridCols) ? (
                    <p className="text-xs text-gray-500 text-center">
                      El generador aumentó el tamaño para acomodar todas las palabras.
                    </p>
                  ) : null}
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Palabras a encontrar</h3>
                  {renderWordBox()}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <p className="text-sm">Configura un tema y presiona “Generar” para ver la sopa.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:pl-2">
          <div className="bg-white rounded shadow p-4 space-y-4">
            <div>
              <h2 className="font-semibold">Hoja comercial</h2>
              <p className="text-xs text-gray-500">Ajustes rápidos visuales de la grilla.</p>
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showGridBorders}
                  onChange={(e) => setShowGridBorders(e.target.checked)}
                />
                Contorno de la grilla
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showSolution}
                  onChange={(e) => setShowSolution(e.target.checked)}
                />
                Mostrar solución (sombrear)
              </label>
            </div>

            <div className="pt-3 border-t border-gray-200 text-xs text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Tema</span>
                <strong>{selectedTema?.nombre ?? 'No seleccionado'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Palabras</span>
                <strong>{selectedTema?.palabras?.length ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tamaño generado</span>
                <strong>
                  {(gridSizeUsed?.rows || result?.stats.gridRows || gridRows)} ×{' '}
                  {(gridSizeUsed?.cols || result?.stats.gridCols || gridCols)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Éxito</span>
                <strong>{result ? `${result.stats.successRate.toFixed(1)}%` : '--'}</strong>
              </div>
            </div>

              <div className="pt-3 border-t border-gray-200 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Título de la hoja</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ej: Sopa de Letras - Animales"
                  className="w-full border rounded px-2 py-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Tamaño de página</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'LETTER' | 'TABLOID')}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="LETTER">Carta</option>
                  <option value="TABLOID">Doble Carta</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Columnas palabras</span>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={wordBoxColumns}
                  onChange={(e) => setWordBoxColumns(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-xs"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Estilo caja</span>
                <select
                  value={wordBoxStyle}
                  onChange={(e) => setWordBoxStyle(e.target.value as typeof wordBoxStyle)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="columns">Columnas</option>
                  <option value="grid">Tarjetas en grilla</option>
                  <option value="tags">Chips/Pastillas</option>
                  <option value="list">Lista rayada</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wordBoxNumbered}
                  onChange={(e) => setWordBoxNumbered(e.target.checked)}
                />
                Numerar lista de palabras
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRender}
                  onChange={(e) => setAutoRender(e.target.checked)}
                />
                Autogenerar al cambiar ajustes
              </label>
              <div className="flex items-center justify-between text-sm">
                <span>Posición caja</span>
                <select
                  value={wordBoxPosition}
                  onChange={(e) => setWordBoxPosition(e.target.value as typeof wordBoxPosition)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="bottom">Abajo</option>
                  <option value="right">Derecha</option>
                  <option value="left">Izquierda</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
