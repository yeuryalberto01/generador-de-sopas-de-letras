import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { ChangeEvent, FC, useCallback, useState } from 'react';
import { parseWords } from '../services/temas';

// --- TIPOS ---

interface TemaPanelEntradaProps {
  onCreate: (title: string, words: string[]) => void;
  loading: boolean;
}

interface ParseResult {
  words: string[];
  duplicates: number;
  invalid: number;
}

// --- CONSTANTES ---

const MAX_WORDS_PER_THEME = 500;

// =============================================================================
// COMPONENTE
// =============================================================================

const TemaPanelEntrada: FC<TemaPanelEntradaProps> = ({ onCreate, loading }) => {
  const [title, setTitle] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [error, setError] = useState('');

  const handleParse = useCallback(() => {
    const result = parseWords(batchInput);
    setPreview(result);
    setError('');
  }, [batchInput]);

  const handleCreate = useCallback(() => {
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    const result = preview || parseWords(batchInput);
    if (result.words.length === 0) {
      setError('Agrega al menos 1 palabra válida');
      return;
    }
    if (result.words.length > MAX_WORDS_PER_THEME) {
      setError(`Máximo ${MAX_WORDS_PER_THEME} palabras por tema`);
      return;
    }
    onCreate(title.trim(), result.words);
    setTitle('');
    setBatchInput('');
    setPreview(null);
    setError('');
  }, [title, batchInput, preview, onCreate]);

  const handleClear = useCallback(() => {
    setBatchInput('');
    setPreview(null);
    setError('');
  }, []);

  const canCreate = title.trim() && (preview?.words.length > 0 || batchInput.trim().length > 0);
  const characterCount = batchInput.length;

  return (
    <div className="rounded-xl shadow-xl border p-4 sm:p-6 h-auto xl:h-full flex flex-col smooth-transition bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 sm:mb-6">Crear Nuevo Tema</h2>
      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Título del tema *</label>
          <input
            type="text"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="Ej.: Animales del Bosque"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Palabras (lote)</label>
          <textarea
            value={batchInput}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBatchInput(e.target.value)}
            placeholder="Pega aquí tus palabras separadas por coma, salto de línea o espacio…&#10;&#10;Presiona Enter para previsualizar&#10;Ctrl+Enter para crear"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
          />
          <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex justify-between">
            <span>{characterCount} caracteres</span>
            {preview && <span>{preview.words.length} válidas, {preview.duplicates} duplicados, {preview.invalid} inválidas</span>}
          </div>
        </div>
        {preview && (
          <div className="rounded-lg p-3 border bg-blue-50/80 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">{preview.words.length} palabras detectadas</p>
            {preview.duplicates > 0 && <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">{preview.duplicates} duplicados ignorados</p>}
            {preview.invalid > 0 && <p className="text-xs text-orange-600 mb-2">{preview.invalid} palabras con formato inválido</p>}
            <div className="flex flex-wrap gap-1 mt-2">
              {preview.words.slice(0, 20).map((word, idx) => (
                <span key={idx} className="px-2 py-1 rounded text-xs border bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 text-gray-700 dark:text-slate-200">{word}</span>
              ))}
              {preview.words.length > 20 && <span className="text-xs text-blue-600 dark:text-blue-300 px-2 py-1">+{preview.words.length - 20} más...</span>}
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/50 px-3 py-2 rounded">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCreate}
            disabled={!canCreate || loading}
            className="w-full bg-accent-primary text-accent-text px-4 py-3 rounded-lg font-medium hover:bg-accent-primary-hover disabled:bg-disabled-bg disabled:text-disabled disabled:cursor-not-allowed smooth-transition flex items-center justify-center gap-2 text-base"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {loading ? 'Creando...' : 'Crear Tema'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={!batchInput.trim() || loading}
              className="flex-1 px-4 py-2 border border-border-secondary rounded-lg font-medium hover:bg-primary/5 text-primary disabled:opacity-50 smooth-transition"
            >
              Previsualizar
            </button>
            <button
              onClick={handleClear}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-border-secondary rounded-lg font-medium hover:bg-primary/5 text-primary disabled:opacity-50 smooth-transition"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

TemaPanelEntrada.displayName = 'TemaPanelEntrada';

export default TemaPanelEntrada;
