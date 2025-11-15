import { AlertCircle, Loader2, Plus, Save } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import PalabraItem from './PalabraItem'; // Asumiendo que PalabraItem se extrae a su propio archivo

const VALIDATION_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{2,32}$/;
const MAX_WORDS_PER_THEME = 500;

const TemaEditForm = ({ tema, onSave, onCancel, loading }) => {
  const [editedTitle, setEditedTitle] = useState(tema.nombre);
  const [editedWords, setEditedWords] = useState([...tema.words]);
  const [newWord, setNewWord] = useState('');
  const [error, setError] = useState('');

  const hasChanges = useMemo(() => 
    editedTitle !== tema.nombre || JSON.stringify(editedWords) !== JSON.stringify(tema.words),
    [editedTitle, editedWords, tema]
  );

  const handleAddWord = useCallback(() => {
    const trimmed = newWord.trim();
    if (!VALIDATION_REGEX.test(trimmed)) {
      setError('Formato inválido (2-32 caracteres alfanuméricos)');
      return;
    }
    if (editedWords.length >= MAX_WORDS_PER_THEME) {
      setError(`Máximo ${MAX_WORDS_PER_THEME} palabras por tema`);
      return;
    }
    const normalized = trimmed.toLowerCase();
    if (editedWords.some(w => w.toLowerCase() === normalized)) {
      setError('Esta palabra ya existe');
      return;
    }
    setEditedWords(prev => [...prev, trimmed]);
    setNewWord('');
    setError('');
  }, [newWord, editedWords]);

  const handleEditWord = useCallback((oldWord, newWord) => {
    setEditedWords(prev => prev.map(w => (w === oldWord ? newWord : w)));
  }, []);

  const handleDeleteWord = useCallback((word) => {
    setEditedWords(prev => prev.filter(w => w !== word));
  }, []);

  const handleSave = () => {
    onSave(tema.id, editedTitle, editedWords);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddWord();
  };

  return (
    <div className="flex flex-row gap-6 -m-6">
      {/* Columna Izquierda: Detalles y Acciones */}
      <div className="flex flex-col justify-between w-1/3 bg-surface p-6 rounded-l-lg">
        <div>
          <label className="block text-base font-medium text-text-primary mb-2">Título del tema</label>
          <p className="text-sm text-text-secondary mb-4">Elige un nombre descriptivo para tu nueva sopa de letras.</p>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border-secondary bg-input text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        </div>

        <div className="flex flex-col gap-2 pt-4">
           {hasChanges && (
            <div className="mb-2 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Tienes cambios sin guardar.</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="w-full bg-accent-primary text-accent-text px-4 py-2.5 rounded-lg font-semibold hover:bg-accent-primary-hover disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Guardar cambios
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full px-4 py-2.5 border border-border-secondary rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-slate-700 text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Columna Derecha: Gestión de Palabras */}
      <div className="flex-1 p-6">
        <div className="mb-4">
          <label className="block text-base font-medium text-text-primary mb-1">Palabras</label>
          <p className="text-sm text-text-secondary mb-4">Añade o edita las palabras para tu sopa de letras.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nueva palabra..."
              className="flex-1 px-3 py-2 border border-border-secondary bg-input text-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-border-focus text-sm"
            />
            <button
              onClick={handleAddWord}
              disabled={!newWord.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs mt-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <div className="text-xs text-text-secondary mt-1">{editedWords.length} / {MAX_WORDS_PER_THEME} palabras</div>
        </div>

        <div className="max-h-[calc(90vh-250px)] overflow-y-auto space-y-2 bg-surface p-3 rounded-lg border border-border-primary">
          {editedWords.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-10">No hay palabras</p>
          ) : (
            editedWords.map((word, idx) => (
              <PalabraItem
                key={`${word}-${idx}`}
                word={word}
                onEdit={handleEditWord}
                onDelete={handleDeleteWord}
                existingWords={editedWords}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TemaEditForm;
