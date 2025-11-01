import React, { useState, useCallback } from 'react';
import { Check, Edit2, X } from 'lucide-react';

const VALIDATION_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{2,32}$/;

const PalabraItem = React.memo(({ word, onEdit, onDelete, existingWords }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(word);
  const [error, setError] = useState('');

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (!VALIDATION_REGEX.test(trimmed)) {
      setError('Formato inválido (2-32 caracteres alfanuméricos)');
      return;
    }
    const normalized = trimmed.toLowerCase();
    const isDuplicate = existingWords.some(w => w.toLowerCase() === normalized && w !== word);
    if (isDuplicate) {
      setError('Esta palabra ya existe');
      return;
    }
    onEdit(word, trimmed);
    setIsEditing(false);
    setError('');
  }, [editValue, existingWords, word, onEdit]);

  const handleCancel = useCallback(() => {
    setEditValue(word);
    setIsEditing(false);
    setError('');
  }, [word]);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/50 p-2 rounded">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 border border-blue-300 dark:border-blue-700 bg-input text-text-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
            autoFocus
          />
          <button onClick={handleSave} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors">
            <Check size={18} />
          </button>
          <button onClick={handleCancel} className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        {error && <span className="text-xs text-red-600 dark:text-red-400 ml-2">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-surface px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors group">
      <span className="text-sm font-medium text-text-secondary truncate max-w-[200px]" title={word}>
        {word}
      </span>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          title="Editar palabra"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(word)}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          title="Eliminar palabra"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

PalabraItem.displayName = 'PalabraItem';

export default PalabraItem;
