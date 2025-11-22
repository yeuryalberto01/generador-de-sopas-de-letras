import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Download, Loader2, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { post } from '../../services/apiClient';
import { generatePDF } from '../../services/pdfExporter';
import { temasService } from '../../services/temas';
import type { Tema } from '../../types';

type WordPlacement = {
  palabra: string;
  positions: { row: number; col: number }[];
};

type GridResult = {
  grid: { letter: string; isWord: boolean }[][];
  placements: WordPlacement[];
  stats: { totalWords: number; placedWords: number; successRate: number; gridSize: number };
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
  const [temas, setTemas] = useState<Tema[]>([]);
  const [isLoadingTemas, setIsLoadingTemas] = useState(true);
  const [selectedTemaId, setSelectedTemaId] = useState('');
  const [gridSize, setGridSize] = useState(15);
  const [allowDiagonal, setAllowDiagonal] = useState(true);
  const [allowReverse, setAllowReverse] = useState(true);
  const [showGridBorders, setShowGridBorders] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [pageSize, setPageSize] = useState<'LETTER' | 'TABLOID'>('LETTER');
  const [wordBoxColumns, setWordBoxColumns] = useState(3);
  const [wordBoxNumbered, setWordBoxNumbered] = useState(true);
  const [result, setResult] = useState<GridResult | null>(null);
  const [gridSizeUsed, setGridSizeUsed] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loadedTemas = await temasService.getTemas();
        if (!mounted) return;
        setTemas(loadedTemas);
        if (loadedTemas.length) {
          setSelectedTemaId(loadedTemas[0].id);
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
        palabras: words.map((w) => w.texto),
        grid_size: gridSize,
        allow_diagonal: allowDiagonal,
        allow_reverse: allowReverse,
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
        Number(data.tamaño || data.grid_size || data.tamano || 0) ||
        (Array.isArray(data.grid) ? data.grid.length : gridSize);

      const wordCells = new Set<string>();
      const placements: WordPlacement[] = (data.soluciones || []).map((sol: any) => {
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
          totalWords: words.length,
          placedWords: placements.length,
          successRate: (placements.length / words.length) * 100,
          gridSize: sizeFromApi || gridSize,
        },
      });
      setGridSizeUsed(sizeFromApi || gridSize);
    } catch (err: any) {
      console.error('Error generando sopa', err);
      setError('No se pudo generar la sopa de letras. Intenta con otra configuración.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPdf = async () => {
    if (!result || !selectedTema) {
      setError('Genera una sopa y selecciona un tema antes de exportar.');
      return;
    }

    setError(null);
    setIsExporting(true);
    try {
      const effectiveSize = gridSizeUsed || result.stats.gridSize || gridSize;
      const printableTema = { ...selectedTema, palabras: sanitizeWords(selectedTema) };
      const columnCount = Math.min(4, Math.max(1, wordBoxColumns));

      await generatePDF({
        grid: result.grid,
        tema: printableTema,
        pageSize,
        gridConfig: { rows: effectiveSize, cols: effectiveSize },
        wordBoxConfig: {
          visible: true,
          columns: columnCount,
          numbered: wordBoxNumbered,
          position: 'bottom',
        },
      });
    } catch (err) {
      console.error('Error exportando PDF', err);
      setError('No se pudo exportar el PDF. Intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const wordsList = sanitizeWords(selectedTema);
  const currentGridSize = result?.stats.gridSize || gridSizeUsed || gridSize;
  const cellSizePx = Math.max(22, Math.floor(520 / Math.max(currentGridSize, 1)));

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
            <label className="block text-sm">
              Tamaño sugerido: <strong>{gridSize} × {gridSize}</strong>
            </label>
            <input
              type="range"
              min={10}
              max={30}
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              El servidor puede ampliar la grilla si las palabras no caben.
              {gridSizeUsed ? ` Último tamaño generado: ${gridSizeUsed} × ${gridSizeUsed}` : ''}
            </p>
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
                  <div>Tamaño: {result.stats.gridSize} × {result.stats.gridSize}</div>
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
                    Generada en grilla {currentGridSize} × {currentGridSize}
                    {gridSizeUsed && gridSizeUsed > gridSize ? ' (ajustada automáticamente)' : ''}
                  </div>
                  <div className="overflow-auto flex justify-center">
                    <div className="inline-block bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <div
                        className={`grid gap-px ${showGridBorders ? 'border-2 border-gray-800' : 'border border-transparent'}`}
                        style={{
                          gridTemplateColumns: `repeat(${currentGridSize}, ${cellSizePx}px)`,
                        }}
                      >
                        {result.grid.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={`flex items-center justify-center font-semibold ${showGridBorders ? 'border border-gray-200' : 'border border-transparent'}`}
                              style={{
                                width: `${cellSizePx}px`,
                                height: `${cellSizePx}px`,
                                fontSize: `${Math.max(12, Math.floor(cellSizePx * 0.55))}px`,
                                background: showSolution && cell.isWord ? '#e0f2fe' : '#fff',
                              }}
                            >
                              {cell.letter || '·'}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  {gridSizeUsed && gridSizeUsed > gridSize ? (
                    <p className="text-xs text-gray-500 text-center">
                      El generador aumentó el tamaño para acomodar todas las palabras.
                    </p>
                  ) : null}
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Palabras a encontrar</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {wordsList.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 rounded border text-gray-700"
                      >
                        {p.texto}
                      </span>
                    ))}
                  </div>
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
                <strong>{(gridSizeUsed || result?.stats.gridSize || gridSize)} × {(gridSizeUsed || result?.stats.gridSize || gridSize)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Éxito</span>
                <strong>{result ? `${result.stats.successRate.toFixed(1)}%` : '--'}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 space-y-2">
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={wordBoxNumbered}
                  onChange={(e) => setWordBoxNumbered(e.target.checked)}
                />
                Numerar lista de palabras
              </label>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
