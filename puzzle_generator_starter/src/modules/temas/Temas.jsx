import { AlertCircle, Check, ChevronDown, ChevronRight, Download, Edit2, Loader2, Plus, RotateCcw, Save, Search, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickNav from '../../components/QuickNav';
import ThemeToggle from '../../components/ThemeToggle';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { exportToJSON, importFromJSON, parseWords, temasService } from '../../services/temas';

// ============= CONSTANTES Y UTILIDADES =============
const VALIDATION_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{2,32}$/;
const MAX_WORDS_PER_THEME = 500;

// ============= HOOKS PERSONALIZADOS =============
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const result = JSON.parse(localStorage.getItem(key) || 'null');
        if (result !== null) {
          setValue(result);
        }
      } catch (error) {
        // Silenciar error de localStorage para evitar warnings
      }
    };

    loadValue();
  }, [key]);

  const setStoredValue = useCallback((newValue) => {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      // Silenciar error de localStorage para evitar warnings
    }
  }, [key]);

  return [value, setStoredValue];
};

// ============= COMPONENTES MEJORADOS =============
const Toast = React.memo(({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const Icon = type === 'success' ? Check : type === 'error' ? AlertCircle : AlertCircle;

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50`}>
      <Icon size={18} />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
});

Toast.displayName = 'Toast';

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
    const isDuplicate = existingWords.some(w =>
      w.toLowerCase() === normalized && w !== word
    );

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
        <div className="flex items-center gap-2 bg-blue-50 p-2 rounded">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={handleSave} className="text-green-600 hover:text-green-700 transition-colors">
            <Check size={18} />
          </button>
          <button onClick={handleCancel} className="text-gray-600 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group">
      <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]" title={word}>
        {word}
      </span>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-700 transition-colors"
          title="Editar palabra"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(word)}
          className="text-red-600 hover:text-red-700 transition-colors"
          title="Eliminar palabra"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

PalabraItem.displayName = 'PalabraItem';

const TemaItem = React.memo(({ tema, onUpdate, onDelete, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedTitle, setEditedTitle] = useState(tema.nombre);
  const [editedWords, setEditedWords] = useState([...tema.words]);
  const [newWord, setNewWord] = useState('');
  const [error, setError] = useState('');

  const hasChanges = useMemo(() =>
    editedTitle !== tema.nombre ||
    JSON.stringify(editedWords) !== JSON.stringify(tema.words)
  , [editedTitle, editedWords, tema]);

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
    setEditedWords(prev => prev.map(w => w === oldWord ? newWord : w));
  }, []);

  const handleDeleteWord = useCallback((word) => {
    setEditedWords(prev => prev.filter(w => w !== word));
  }, []);

  const handleSave = useCallback(() => {
    onUpdate(tema.id, editedTitle, editedWords);
  }, [tema.id, editedTitle, editedWords, onUpdate]);

  const handleUndo = useCallback(() => {
    setEditedTitle(tema.nombre);
    setEditedWords([...tema.words]);
    setError('');
  }, [tema.nombre, tema.words]);

  const handleDelete = useCallback(() => {
    if (confirm(`¿Estás seguro de eliminar el tema "${tema.nombre}"?`)) {
      onDelete(tema.id);
    }
  }, [tema.id, tema.nombre, onDelete]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleAddWord();
  }, [handleAddWord]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-3 border border-gray-200">
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button className="mt-1 text-gray-500 flex-shrink-0">
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-lg truncate" title={tema.nombre}>
                {tema.nombre}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{tema.words.length} palabra{tema.words.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{formatDate(tema.updated_at)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors flex-shrink-0"
            title="Eliminar tema"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título del tema
            </label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agregar palabra
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nueva palabra..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={handleAddWord}
                disabled={!newWord.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-xs mt-1">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {editedWords.length} / {MAX_WORDS_PER_THEME} palabras
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Palabras ({editedWords.length})
            </label>
            <div className="max-h-64 overflow-y-auto space-y-2 bg-white p-3 rounded-lg border border-gray-200">
              {editedWords.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay palabras</p>
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

          {hasChanges && (
            <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-2 text-sm text-orange-700 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Tienes cambios sin guardar</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar cambios
            </button>
            <button
              onClick={handleUndo}
              disabled={!hasChanges || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RotateCcw size={18} />
              Deshacer
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

TemaItem.displayName = 'TemaItem';

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
    <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Tema</h2>

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título del tema *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej.: Animales del Bosque"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Palabras (lote)
          </label>
          <textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            placeholder="Pega aquí tus palabras separadas por coma, salto de línea o espacio…

Presiona Enter para previsualizar
Ctrl+Enter para crear"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
          />
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>{characterCount} caracteres</span>
            {preview && (
              <span>
                {preview.words.length} válidas, {preview.duplicates} duplicados, {preview.invalid} inválidas
              </span>
            )}
          </div>
        </div>

        {preview && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-2">
              {preview.words.length} palabras detectadas
            </p>
            {preview.duplicates > 0 && (
              <p className="text-xs text-blue-600 mb-1">
                {preview.duplicates} duplicados ignorados
              </p>
            )}
            {preview.invalid > 0 && (
              <p className="text-xs text-orange-600 mb-2">
                {preview.invalid} palabras con formato inválido
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {preview.words.slice(0, 20).map((word, idx) => (
                <span key={idx} className="bg-white px-2 py-1 rounded text-xs text-gray-700 border border-blue-200">
                  {word}
                </span>
              ))}
              {preview.words.length > 20 && (
                <span className="text-xs text-blue-600 px-2 py-1">
                  +{preview.words.length - 20} más...
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!canCreate || loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {loading ? 'Creando...' : 'Crear Tema'}
          </button>
          <button
            onClick={handleParse}
            disabled={!batchInput.trim() || loading}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Previsualizar
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
});

TemaPanelEntrada.displayName = 'TemaPanelEntrada';

const TemasPanel = React.memo(({ temas, onUpdate, onDelete, onImport, loading, searchTerm, setSearchTerm }) => {
  const [importing, setImporting] = useState(false);

  const filteredTemas = useMemo(() =>
    temas.filter(tema =>
      tema.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tema.words.some(word => word.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [temas, searchTerm]
  );

  const handleFileImport = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImporting(true);
    importFromJSON(
      file,
      (importedTemas) => {
        onImport(importedTemas);
        setImporting(false);
        event.target.value = ''; // Reset input
      },
      (_error) => {
        // Silenciar error de importación para evitar warnings
        setImporting(false);
        event.target.value = ''; // Reset input
      }
    );
  }, [onImport]);

  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Temas Guardados</h2>
          <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full">
            {temas.length}
          </span>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en temas y palabras..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => exportToJSON(temas)}
            disabled={temas.length === 0}
            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Exportar
          </button>
          <label className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-2">
            <Upload size={18} />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>

        {importing && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Importando temas...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'No se encontraron temas' : 'Aún no hay temas guardados. ¡Crea tu primer tema!'}
          </div>
        ) : (
          filteredTemas.map((tema) => (
            <TemaItem
              key={tema.id}
              tema={tema}
              onUpdate={onUpdate}
              onDelete={onDelete}
              loading={loading}
            />
          ))
        )}
      </div>
    </div>
  );
});

TemasPanel.displayName = 'TemasPanel';

// ============= COMPONENTE PRINCIPAL MEJORADO =============
export default function Temas() {
  const nav = useNavigate();
  const { selectTema } = useApp();
  const { toast, showToast, hideToast } = useToast();

  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState({ create: false, update: false, load: true, import: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useLocalStorage('selectedTemaId', null);

  useEffect(() => {
    loadTemas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTemas = async () => {
    setLoading(prev => ({ ...prev, load: true }));
    try {
      const loadedTemas = await temasService.getTemas();
      setTemas(loadedTemas);
    } catch (error) {
      showToast('Error al cargar temas', 'error');
    } finally {
      setLoading(prev => ({ ...prev, load: false }));
    }
  };

  const handleCreate = async (title, words) => {
    setLoading(prev => ({ ...prev, create: true }));
    try {
      const result = await temasService.createTema(title, words);
      setTemas(prev => [result, ...prev]);
      showToast('Tema creado exitosamente', 'success');

      // Seleccionar el tema recién creado
      setSelectedId(result.id);
      selectTema(result);
    } catch (error) {
      showToast(error.message || 'Error al crear el tema', 'error');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdate = async (id, title, words) => {
    setLoading(prev => ({ ...prev, update: true }));
    try {
      const updated = await temasService.updateTema(id, title, words);
      setTemas(prev => prev.map(t => t.id === id ? updated : t));
      showToast('Cambios guardados', 'success');
    } catch (error) {
      showToast(error.message || 'Error al guardar cambios', 'error');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await temasService.deleteTema(id);
      setTemas(prev => prev.filter(t => t.id !== id));
      showToast('Tema eliminado', 'success');

      // Si se eliminó el tema seleccionado, deseleccionar
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (error) {
      showToast('Error al eliminar tema', 'error');
    }
  };

  const handleImport = async (importedTemas) => {
    setLoading(prev => ({ ...prev, import: true }));
    try {
      const newTemas = await temasService.bulkImport(importedTemas);
      setTemas(newTemas);
      showToast(`Importados ${importedTemas.length} temas exitosamente`, 'success');
    } catch (error) {
      showToast('Error al importar temas', 'error');
    } finally {
      setLoading(prev => ({ ...prev, import: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Temas</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: {temas.length} temas • {temas.reduce((acc, tema) => acc + tema.words.length, 0)} palabras
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-150px)]">
          <TemaPanelEntrada
            onCreate={handleCreate}
            loading={loading.create}
          />

          <TemasPanel
            temas={temas}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onImport={handleImport}
            loading={loading.update}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Botón Continuar */}
        <div className="fixed bottom-6 right-6">
          <button
            disabled={!selectedId || loading.load}
            onClick={() => nav(`/diagramacion/${selectedId}`)}
            className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg"
          >
            Continuar
          </button>
        </div>

        {/* Navegación rápida */}
        <QuickNav />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
