import { ChevronDown, ChevronRight, Edit, Plus, Save, Trash2, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';

const TemaItem = React.memo(({ tema, onDelete, _onEdit, onUpdate, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(tema.nombre || '');
  const [editWords, setEditWords] = useState([...(tema.words || [])]);
  const [newWord, setNewWord] = useState('');

  const formatDate = useCallback((dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }, []);

  const handleStartEdit = useCallback(() => {
    setEditTitle(tema.nombre || '');
    setEditWords([...(tema.words || [])]);
    setNewWord('');
    setIsEditing(true);
    setIsExpanded(true); // Expandir automáticamente al entrar en modo edición
  }, [tema.nombre, tema.words]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditTitle(tema.nombre || '');
    setEditWords([...(tema.words || [])]);
    setNewWord('');
  }, [tema.nombre, tema.words]);

  const handleSaveEdit = useCallback(() => {
    onUpdate(tema.id, editTitle.trim(), editWords);
    setIsEditing(false);
  }, [tema.id, editTitle, editWords, onUpdate]);

  const handleAddWord = useCallback(() => {
    const trimmedWord = newWord.trim();
    if (!trimmedWord) return;

    // Validación básica
    if (trimmedWord.length < 2 || trimmedWord.length > 32) return;
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]+$/.test(trimmedWord)) return;

    const normalizedWord = trimmedWord.toLowerCase();
    if (editWords.some(word => word.toLowerCase() === normalizedWord)) return;

    setEditWords(prev => [...prev, trimmedWord]);
    setNewWord('');
  }, [newWord, editWords]);

  const handleEditWord = useCallback((index, newWord) => {
    const trimmedWord = newWord.trim();
    if (!trimmedWord) return;

    // Validación básica
    if (trimmedWord.length < 2 || trimmedWord.length > 32) return;
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]+$/.test(trimmedWord)) return;

    setEditWords(prev => prev.map((word, i) => i === index ? trimmedWord : word));
  }, []);

  const handleDeleteWord = useCallback((index) => {
    setEditWords(prev => prev.filter((_, i) => i !== index));
  }, []);

  const hasChanges = editTitle !== (tema.nombre || '') || JSON.stringify(editWords) !== JSON.stringify(tema.words || []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-3 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div
        className={`p-4 ${isEditing ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'} transition-colors`}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {!isEditing && (
              <button className="mt-1 text-text-secondary flex-shrink-0">
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate" title={tema.nombre}>
                {tema.nombre}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span>{tema.words.length} palabra{tema.words.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{formatDate(tema.updated_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit();
                  }}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors flex-shrink-0"
                  title="Editar tema"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Estás seguro de eliminar el tema "${tema.nombre}"?`)) {
                      onDelete(tema.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"
                  title="Eliminar tema"
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  disabled={!hasChanges || loading}
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/50 transition-colors flex-shrink-0 disabled:opacity-50"
                  title="Guardar cambios"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors flex-shrink-0"
                  title="Cancelar edición"
                >
                  <X size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          {!isEditing ? (
            <div className="max-h-64 overflow-y-auto space-y-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              {tema.words.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No hay palabras</p>
              ) : (
                tema.words.map((word, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={word}>
                      {word}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Edición del título */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Título del tema</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título del tema"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>

              {/* Edición de palabras */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Palabras</label>

                {/* Agregar nueva palabra */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                    placeholder="Nueva palabra..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                  />
                  <button
                    onClick={handleAddWord}
                    disabled={!newWord.trim()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Lista de palabras editables */}
                <div className="max-h-64 overflow-y-auto space-y-2 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  {editWords.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No hay palabras</p>
                  ) : (
                    editWords.map((word, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                        <input
                          type="text"
                          value={word}
                          onChange={(e) => handleEditWord(idx, e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <button
                          onClick={() => handleDeleteWord(idx)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
                          title="Eliminar palabra"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {editWords.length} palabra{editWords.length !== 1 ? 's' : ''}
                  {hasChanges && <span className="text-orange-600 dark:text-orange-400 ml-2">• Cambios sin guardar</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TemaItem.displayName = 'TemaItem';

export default TemaItem;
