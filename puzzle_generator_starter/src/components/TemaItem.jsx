import { ChevronDown, ChevronRight, Edit, Plus, Save, Star, Trash2, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

const TemaItem = React.memo(({
  tema,
  onDelete,
  onUpdate,
  loading,
  showToast,
  isFavorite,
  onToggleFavorite,
  isSelected = false,
  onSelect
}) => {
  const wordCount = tema.words?.length || 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(tema.nombre || '');
  const [editWords, setEditWords] = useState([...(tema.words || [])]);
  const [newWord, setNewWord] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    setIsExpanded(true);
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
    if (showToast) showToast('Cambios guardados correctamente', 'success');
  }, [tema.id, editTitle, editWords, onUpdate, showToast]);

  const handleAddWord = useCallback(() => {
    const trimmedWord = newWord.trim();
    if (!trimmedWord) return;
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
    if (trimmedWord.length < 2 || trimmedWord.length > 32) return;
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]+$/.test(trimmedWord)) return;
    setEditWords(prev => prev.map((word, i) => i === index ? trimmedWord : word));
  }, []);

  const handleDeleteWord = useCallback((index) => {
    setEditWords(prev => prev.filter((_, i) => i !== index));
  }, []);

  const hasChanges = editTitle !== (tema.nombre || '') || JSON.stringify(editWords) !== JSON.stringify(tema.words || []);

  return (
    <div className={`bg-card rounded-xl shadow-lg overflow-hidden mb-3 border smooth-transition hover:shadow-xl group ${isSelected ? 'border-accent ring-2 ring-accent/60' : 'border-border-primary'}`}>
      <div
        className={`p-3 sm:p-4 ${isEditing ? 'cursor-default' : 'cursor-pointer hover:bg-primary/10'} smooth-transition`}
        onClick={() => {
          if (isEditing) return;
          if (onSelect) onSelect();
          setIsExpanded(prev => !prev);
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {!isEditing && (
              <button className="mt-1 text-secondary flex-shrink-0">
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-primary text-base sm:text-lg truncate" title={tema.nombre}>
                {tema.nombre}
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-secondary">
                <span>{wordCount} palabra{wordCount !== 1 ? 's' : ''}</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{formatDate(tema.updated_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
            {!isEditing ? (
              <>
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                  className={`w-9 h-9 rounded-lg hover:bg-primary/10 smooth-transition flex items-center justify-center transition-all ${isFavorite ? 'text-yellow-500' : 'text-secondary hover:text-primary'}`}
                    title={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
                  >
                    <Star size={16} className={isFavorite ? 'fill-current' : ''} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                  className="w-9 h-9 rounded-lg text-secondary hover:text-accent hover:bg-primary/10 smooth-transition flex items-center justify-center"
                  title="Editar tema"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                  className="w-9 h-9 rounded-lg text-secondary hover:text-accent-danger hover:bg-primary/10 smooth-transition flex items-center justify-center"
                  title="Eliminar tema"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                  disabled={!hasChanges || loading}
                  className="w-8 h-8 rounded-md text-accent-success hover:bg-primary/10 smooth-transition flex items-center justify-center disabled:opacity-50"
                  title="Guardar cambios"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                  className="w-8 h-8 rounded-md text-secondary hover:text-primary hover:bg-primary/10 smooth-transition flex items-center justify-center"
                  title="Cancelar edición"
                >
                  <X size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border-primary p-3 sm:p-4 bg-surface">
          {!isEditing ? (
            <div className="max-h-64 overflow-y-auto space-y-2 bg-input p-3 rounded-lg border border-border-secondary">
              {wordCount === 0 ? (
                <p className="text-sm text-secondary text-center py-4">No hay palabras</p>
              ) : (
                tema.words.map((word, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-surface px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium text-primary truncate max-w-[200px]" title={word}>
                      {word}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Título del tema</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título del tema"
                  className="w-full px-3 py-2 border border-border-secondary bg-input text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">Palabras</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                    placeholder="Nueva palabra..."
                    className="flex-1 px-3 py-2 border border-border-secondary bg-input text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                  <button
                    onClick={handleAddWord}
                    disabled={!newWord.trim()}
                    className="px-3 py-2 bg-accent-success text-accent-text rounded-lg hover:bg-accent-success-hover disabled:bg-disabled-bg disabled:cursor-not-allowed smooth-transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 bg-input p-3 rounded-lg border border-border-secondary">
                  {editWords.length === 0 ? (
                    <p className="text-sm text-secondary text-center py-4">No hay palabras</p>
                  ) : (
                    editWords.map((word, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-surface px-3 py-2 rounded-lg">
                        <input
                          type="text"
                          value={word}
                          onChange={(e) => handleEditWord(idx, e.target.value)}
                          className="flex-1 px-2 py-1 border border-border-secondary bg-input text-primary rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <button
                          onClick={() => handleDeleteWord(idx)}
                          className="text-accent-danger hover:bg-primary/10 p-1 rounded smooth-transition"
                          title="Eliminar palabra"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="text-xs text-secondary mt-2">
                  {editWords.length} palabra{editWords.length !== 1 ? 's' : ''}
                  {hasChanges && <span className="text-yellow-600 dark:text-yellow-500 ml-2">• Cambios sin guardar</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar tema"
        message={`¿Estás seguro de que quieres eliminar el tema "${tema.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={() => {
          onDelete(tema.id);
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
});

TemaItem.displayName = 'TemaItem';

export default TemaItem;
