import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Loader2, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WordSearchGenerator from '../../services/wordSearchAlgorithm';
import { temasService } from '../../services/temas';
import type { Tema } from '../../types';

type GridResult = {
  grid: { letter: string; isWord: boolean }[][];
  stats: { totalWords: number; placedWords: number; successRate: number };
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
  const [result, setResult] = useState<GridResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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
      const generator = new WordSearchGenerator(gridSize, gridSize, {
        allowDiagonal,
        allowReverse,
      });
      const generated = generator.generate(words);
      setResult({
        grid: generated.grid,
        stats: generated.stats,
      });
    } catch (err: any) {
      console.error('Error generando sopa', err);
      setError('No se pudo generar la sopa de letras. Intenta con otra configuración.');
    } finally {
      setIsGenerating(false);
    }
  };

  const wordsList = sanitizeWords(selectedTema);

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

      <main className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6 lg:flex-row">
        <section className="lg:w-1/3 space-y-4">
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
              Tamaño del grid: <strong>{gridSize} × {gridSize}</strong>
            </label>
            <input
              type="range"
              min={10}
              max={20}
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full"
            />
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

        <section className="flex-1 bg-white rounded shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Resultado</h2>
              <p className="text-xs text-gray-500">
                Vista previa del tablero generado
              </p>
            </div>
            {result && (
              <div className="text-xs text-gray-600 text-right">
                <div>
                  Colocadas: {result.stats.placedWords} / {result.stats.totalWords}
                </div>
                <div>Éxito: {result.stats.successRate.toFixed(1)}%</div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto border rounded">
            {result ? (
              <div className="p-4 flex flex-col gap-6">
                <div className="overflow-auto">
                  <table className="mx-auto border border-gray-200">
                    <tbody>
                      {result.grid.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className="w-8 h-8 border border-gray-200 text-center font-semibold text-sm"
                              style={{ background: cell.isWord ? '#eef2ff' : 'white' }}
                            >
                              {cell.letter || '·'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
      </main>
    </div>
  );
}
