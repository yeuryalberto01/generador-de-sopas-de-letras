import { FC, KeyboardEvent, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { UI_TEXTS } from '../../constants/uiTexts';
import type { Tema } from '../../types';
import { findDuplicates, validateWord } from '../../utils/parseWords';
import { palabrasToStrings, stringsToPalabras } from '../../utils/temaConverters';

// --- TIPOS ---

interface ValidationResult {
  valid: boolean;
  message: string;
}

interface PalabraItemProps {
  palabra: string;
  index: number;
  onEdit: (index: number, newWord: string) => void;
  onDelete: (index: number) => void;
  onDuplicate: (index: number) => void;
  isEditing: boolean;
  onStartEdit: (index: number) => void;
  onCancelEdit: () => void;
  allWords: string[];
}

interface AgregarPalabraInputProps {
  onAdd: (newWord: string) => void;
  allWords: string[];
}

interface TemaPanelEdicionProps {
  tema: Tema | null;
  onUpdateTitle: (id: string, title: string) => Promise<void>;
  onUpdateWords: (id: string, words: string[]) => Promise<void>;
  onUndo?: () => void;
  isLoading?: boolean;
}

// =============================================================================
// SUB-COMPONENTES
// =============================================================================

const PalabraItem: FC<PalabraItemProps> = memo(({
  palabra,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  isEditing,
  onStartEdit,
  onCancelEdit,
  allWords
}) => {
  const [editValue, setEditValue] = useState(palabra);
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, message: '' });

  useEffect(() => {
    if (isEditing) {
      const result = validateWord(editValue);
      setValidation(result);
      
      const otherWords = allWords.filter((_, i) => i !== index);
      const normalizedEdit = editValue.toLowerCase().trim();
      const normalizedOthers = otherWords.map(w => w.toLowerCase().trim());
      
      if (normalizedOthers.includes(normalizedEdit)) {
        setValidation({ 
          valid: false, 
          message: 'Esta palabra ya existe en la lista' 
        });
      }
    }
  }, [editValue, isEditing, allWords, index]);

  const handleSave = useCallback(() => {
    if (validation.valid && editValue.trim() !== palabra) {
      onEdit(index, editValue.trim());
    }
    onCancelEdit();
  }, [editValue, validation.valid, onEdit, onCancelEdit, index, palabra]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setEditValue(palabra);
      onCancelEdit();
    }
  }, [handleSave, palabra, onCancelEdit]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-accent-light rounded-md">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 smooth-transition ${validation.valid ? 'border-primary' : 'border-error'}`}
          autoFocus
          aria-label={`Editando palabra ${index + 1}`}
        />
        {!validation.valid && <span className="text-xs text-error" title={validation.message}>⚠</span>}
        <button onClick={handleSave} disabled={!validation.valid} className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover disabled:bg-disabled smooth-transition">✓</button>
        <button onClick={() => { setEditValue(palabra); onCancelEdit(); }} className="px-2 py-1 text-xs bg-secondary text-primary rounded hover:bg-secondary-hover smooth-transition">×</button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 border-b border-primary last:border-b-0">
      <span className="text-sm flex-1 text-primary">{palabra}</span>
      <div className="flex gap-1">
        <button onClick={() => { setEditValue(palabra); onStartEdit(index); }} className="p-1 text-secondary hover:text-accent rounded smooth-transition" title="Editar">✎</button>
        <button onClick={() => onDuplicate(index)} className="p-1 text-secondary hover:text-success rounded smooth-transition" title="Duplicar">⎘</button>
        <button onClick={() => onDelete(index)} className="p-1 text-secondary hover:text-error rounded smooth-transition" title="Eliminar">×</button>
      </div>
    </div>
  );
});

const AgregarPalabraInput: FC<AgregarPalabraInputProps> = memo(({ onAdd, allWords }) => {
  const [value, setValue] = useState('');
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, message: '' });

  const handleAdd = useCallback(() => {
    if (validation.valid && value.trim()) {
      onAdd(value.trim());
      setValue('');
      setValidation({ valid: true, message: '' });
    }
  }, [value, validation.valid, onAdd]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  }, [handleAdd]);

  useEffect(() => {
    if (value.trim()) {
      const result = validateWord(value.trim());
      setValidation(result);
      
      const normalizedValue = value.toLowerCase().trim();
      const normalizedWords = allWords.map(w => w.toLowerCase().trim());
      
      if (normalizedWords.includes(normalizedValue)) {
        setValidation({ valid: false, message: 'Esta palabra ya existe' });
      }
    } else {
      setValidation({ valid: true, message: '' });
    }
  }, [value, allWords]);

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Agregar nueva palabra..."
          className={`flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 smooth-transition ${validation.valid ? 'border-primary' : 'border-error'}`}
          aria-label="Agregar nueva palabra"
        />
        <button onClick={handleAdd} disabled={!validation.valid || !value.trim()} className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-accent-hover disabled:bg-disabled smooth-transition">+</button>
      </div>
      {!validation.valid && <p className="mt-1 text-xs text-error">{validation.message}</p>}
    </div>
  );
});

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

const TemaPanelEdicion = memo(function TemaPanelEdicion({ tema, onUpdateTitle, onUpdateWords, onUndo, isLoading = false }: TemaPanelEdicionProps) {
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [localTema, setLocalTema] = useState<Tema>(tema || { id: '', nombre: '', palabras: [] });
  const [lastSaved, setLastSaved] = useState<Tema>(tema || { id: '', nombre: '', palabras: [] });
  const [titleDraft, setTitleDraft] = useState(tema?.nombre || '');

  useEffect(() => {
    if (tema) {
      setLocalTema(tema);
      setLastSaved(tema);
      setTitleDraft(tema.nombre || '');
    }
  }, [tema]);

  const hasWordChanges = useMemo(() =>
    JSON.stringify(localTema.palabras) !== JSON.stringify(lastSaved.palabras),
    [localTema.palabras, lastSaved.palabras]
  );
  const hasTitleChanges = useMemo(() =>
    titleDraft !== lastSaved.nombre,
    [titleDraft, lastSaved.nombre]
  );

  const handleEditWord = useCallback((index: number, newWord: string) => {
    setLocalTema(prev => ({ ...prev, palabras: prev.palabras.map((word, i) => (i === index ? stringsToPalabras([newWord])[0] : word)) }));
    setEditingWordIndex(null);
  }, []);

  const handleDeleteWord = useCallback((index: number) => {
    setLocalTema(prev => ({ ...prev, palabras: prev.palabras.filter((_, i) => i !== index) }));
  }, []);

  const handleDuplicateWord = useCallback((index: number) => {
    const wordToDuplicate = localTema.palabras[index];
    setLocalTema(prev => ({ ...prev, palabras: [...prev.palabras, wordToDuplicate] }));
  }, [localTema.palabras]);

  const handleAddWord = useCallback((newWord: string) => {
    setLocalTema(prev => ({ ...prev, palabras: [...prev.palabras, stringsToPalabras([newWord])[0]] }));
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!localTema.id) return;
    if (hasTitleChanges) await onUpdateTitle(localTema.id, titleDraft);
    if (hasWordChanges) await onUpdateWords(localTema.id, palabrasToStrings(localTema.palabras));
    setLastSaved(localTema);
  }, [localTema, titleDraft, hasTitleChanges, hasWordChanges, onUpdateTitle, onUpdateWords]);

  const handleUndo = useCallback(() => {
    setLocalTema(lastSaved);
    setTitleDraft(lastSaved.nombre || '');
    setEditingWordIndex(null);
    onUndo?.();
  }, [lastSaved, onUndo]);

  if (!tema) {
    return (
      <div className="bg-primary rounded-lg shadow-sm border border-primary p-4 sm:p-6">
        <div className="text-center text-secondary py-8"><p>Selecciona un tema para editarlo</p></div>
      </div>
    );
  }

  const duplicates = findDuplicates(localTema.palabras);
  const hasDuplicates = duplicates.length > 0;

  return (
    <div className="bg-primary rounded-lg shadow-sm border border-primary p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            className="text-xl font-semibold border-none focus:outline-none focus:ring-2 focus:ring-accent px-2 py-1 rounded bg-primary text-primary"
            aria-label="Título del tema"
          />
          {(hasWordChanges || hasTitleChanges) && (
            <button onClick={handleSaveChanges} disabled={isLoading || hasDuplicates} className="px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-hover disabled:bg-disabled smooth-transition">{isLoading ? 'Guardando...' : 'Guardar'}</button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-secondary">
          <span>ID: {tema.id || 'N/A'}</span>
          <span className="hidden sm:inline">•</span>
          <span>Actualizado: {new Date(tema.updated_at || Date.now()).toLocaleString()}</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-secondary rounded-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">
          <span className="text-primary">{localTema.palabras.length} palabra{localTema.palabras.length !== 1 ? 's' : ''}</span>
          {hasDuplicates && <span className="text-warning font-medium">{duplicates.length} duplicado{duplicates.length !== 1 ? 's' : ''}</span>}
          {(hasWordChanges || hasTitleChanges) && !hasDuplicates && <span className="text-accent font-medium">{UI_TEXTS.INFO.CHANGES_NOT_SAVED}</span>}
        </div>
      </div>

      <AgregarPalabraInput onAdd={handleAddWord} allWords={palabrasToStrings(localTema.palabras)} />

      <div className="border border-primary rounded-md max-h-96 overflow-y-auto">
        {localTema.palabras.length === 0 ? (
          <div className="p-4 text-center text-secondary">{UI_TEXTS.INFO.NO_WORDS}</div>
        ) : (
          localTema.palabras.map((palabra, index) => (
            <PalabraItem
              key={`${palabra.texto}-${index}`}
              palabra={palabra.texto}
              index={index}
              onEdit={handleEditWord}
              onDelete={handleDeleteWord}
              onDuplicate={handleDuplicateWord}
              isEditing={editingWordIndex === index}
              onStartEdit={setEditingWordIndex}
              onCancelEdit={() => setEditingWordIndex(null)}
              allWords={palabrasToStrings(localTema.palabras)}
            />
          ))
        )}
      </div>

      {(hasWordChanges || hasTitleChanges) && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button onClick={handleSaveChanges} disabled={isLoading || hasDuplicates} className="flex-1 px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:bg-disabled smooth-transition">{isLoading ? 'Guardando...' : 'Guardar cambios'}</button>
          <button onClick={handleUndo} disabled={isLoading} className="px-4 py-2 border border-primary text-primary rounded hover:bg-secondary smooth-transition">Deshacer</button>
        </div>
      )}
    </div>
  );
});

export default TemaPanelEdicion;