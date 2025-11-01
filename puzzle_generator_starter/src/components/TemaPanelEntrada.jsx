import React, { useState, useCallback } from 'react';
import { AlertCircle, Plus, Loader2 } from 'lucide-react';
import { parseWords } from '../services/temas';

const MAX_WORDS_PER_THEME = 500;

const TemaPanelEntrada = React.memo(({ onCreate, loading }) => {
  const [title, setTitle] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [preview, setPreview] = useState(null);
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

  const canCreate = title.trim() && (preview?.words.length > 0 || batchInput.trim());
  const characterCount = batchInput.length;

  return (
    <div className="bg-card rounded-lg shadow-md p-6 h-full flex flex-col transition-colors duration-300">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Crear Nuevo Tema</h2>
      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Título del tema *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej.: Animales del Bosque"
            className="w-full px-3 py-2 border border-border-secondary bg-input text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-medium text-text-secondary mb-1">Palabras (lote)</label>
          <textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            placeholder="Pega aquí tus palabras separadas por coma, salto de línea o espacio…\n\nPresiona Enter para previsualizar\nCtrl+Enter para crear"
            className="flex-1 px-3 py-2 border border-border-secondary bg-input text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-border-focus resize-none font-mono text-sm"
          />
          <div className="text-xs text-text-secondary mt-1 flex justify-between">
            <span>{characterCount} caracteres</span>
            {preview && <span>{preview.words.length} válidas, {preview.duplicates} duplicados, {preview.invalid} inválidas</span>}
          </div>
        </div>
        {preview && (
          <div className="bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">{preview.words.length} palabras detectadas</p>
            {preview.duplicates > 0 && <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">{preview.duplicates} duplicados ignorados</p>}
            {preview.invalid > 0 && <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">{preview.invalid} palabras con formato inválido</p>}
            <div className="flex flex-wrap gap-1 mt-2">
              {preview.words.slice(0, 20).map((word, idx) => (
                <span key={idx} className="bg-card px-2 py-1 rounded text-xs text-text-secondary border border-blue-200 dark:border-blue-700">{word}</span>
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
        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!canCreate || loading}
            className="flex-1 bg-accent-primary text-accent-text px-4 py-2 rounded-lg font-medium hover:bg-accent-primary-hover disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {loading ? 'Creando...' : 'Crear Tema'}
          </button>
          <button
            onClick={handleParse}
            disabled={!batchInput.trim() || loading}
            className="px-4 py-2 border border-border-secondary rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-slate-700 text-text-primary disabled:opacity-50 transition-colors"
          >
            Previsualizar
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 border border-border-secondary rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-slate-700 text-text-primary disabled:opacity-50 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
});

TemaPanelEntrada.displayName = 'TemaPanelEntrada';

export default TemaPanelEntrada;
