import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TemaPanelEntrada from '../../components/TemaPanelEntrada';
import TemasPanel from '../../components/TemasPanel';
import ToastContainer from '../../components/ToastContainer';
import { useApp } from '../../hooks/useApp';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useTemaOperations } from '../../hooks/useTemaOperations';
import { useToast } from '../../hooks/useToast';
import { temasService } from '../../services/temas';
import TemaPanelEdicion from './TemaPanelEdicion';

// ============= COMPONENTE PRINCIPAL MEJORADO =============
export default function Temas() {
  const nav = useNavigate();
  const { selectTema } = useApp();
  const temaOps = useTemaOperations();
  const { toasts, showToast, removeToast } = useToast();

  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState({ create: false, update: false, load: true, import: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useLocalStorage('selectedTemaId', null);

  const [editingTema, setEditingTema] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  const handleSelectTema = useCallback((id) => {
    setSelectedId(id);
    if (selectTema) selectTema(id);
  }, [selectTema, setSelectedId]);

  const handleStartEdit = (tema) => {
    setEditingTema(tema);
  };

  const handleCloseEdit = () => {
    setEditingTema(null);
  };

  // Funciones para TemaPanelEdicion
  const handleUpdateTitle = async (id, title) => {
    const result = await temaOps.updateExistingTema(id, { nombre: title });
    if (result.ok) {
      setTemas(prev => prev.map(t => t.id === id ? result.data : t));
    } else {
      // Error al actualizar título
    }
  };

  const handleUpdateWords = async (id, words) => {
    const result = await temaOps.replaceTemaPalabras(id, { palabras: words });
    if (result.ok) {
      setTemas(prev => prev.map(t => t.id === id ? { ...t, words } : t));
    } else {
      // Error al actualizar palabras
    }
  };

  useEffect(() => {
    loadTemas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!temas.length) return;
    const exists = selectedId ? temas.some(t => t.id === selectedId) : false;
    if (!exists) {
      handleSelectTema(temas[0].id);
    }
  }, [temas, selectedId, handleSelectTema]);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('temas_favorites') || '[]');
      setFavorites(new Set(saved));
    } catch (error) {
      // Error al cargar favoritos, usar conjunto vacío
      setFavorites(new Set());
    }
  }, []);

  const handleToggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
      showToast('Tema removido de favoritos', 'info');
    } else {
      newFavorites.add(id);
      showToast('Tema agregado a favoritos', 'success');
    }
    setFavorites(newFavorites);
    localStorage.setItem('temas_favorites', JSON.stringify([...newFavorites]));
  };

  const loadTemas = async () => {
    setLoading(prev => ({ ...prev, load: true }));
    try {
      const loadedTemas = await temasService.getTemas();
      setTemas(loadedTemas);
    } catch (error) {
      // Error al cargar temas
    } finally {
      setLoading(prev => ({ ...prev, load: false }));
    }
  };

  const handleCreate = async (title, words) => {
    setLoading(prev => ({ ...prev, create: true }));
    try {
      const result = await temasService.createTema(title, words);
      setTemas(prev => [result, ...prev]);

      // Seleccionar el tema recién creado
      handleSelectTema(result.id);

      showToast(`Tema "${result.nombre}" creado correctamente`, 'success');
    } catch (error) {
      showToast('Error al crear el tema. Inténtalo de nuevo.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdate = async (id, title, words) => {
    setLoading(prev => ({ ...prev, update: true }));
    try {
      const updated = await temasService.updateTema(id, title, words);
      setTemas(prev => prev.map(t => t.id === id ? updated : t));
      showToast('Cambios guardados correctamente', 'success');
    } catch (error) {
      showToast('Error al guardar cambios. Inténtalo de nuevo.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      const temaToDelete = temas.find(t => t.id === id);
      await temasService.deleteTema(id);
      setTemas(prev => prev.filter(t => t.id !== id));

      // Si se eliminó el tema seleccionado, deseleccionar
      if (selectedId === id) {
        setSelectedId(null);
      }

      showToast(`Tema "${temaToDelete?.nombre || 'eliminado'}" eliminado correctamente`, 'success');
    } catch (error) {
      showToast('Error al eliminar el tema. Inténtalo de nuevo.', 'error');
    }
  };

  const handleImport = async (importedTemas) => {
    setLoading(prev => ({ ...prev, import: true }));
    try {
      const newTemas = await temasService.bulkImport(importedTemas);
      setTemas(newTemas);
      showToast(`${importedTemas.length} tema(s) importado(s) correctamente`, 'success');
    } catch (error) {
      showToast('Error al importar temas. Verifica el formato del archivo.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, import: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Gestión de Temas</h1>
            <p className="text-sm text-secondary mt-1">Crea, edita y organiza tus temas para sopas de letras</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-secondary">
            <span className="bg-secondary px-3 py-1 rounded-full">
              {temas.length} tema{temas.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-140px)]">
          {/* Panel de Creación Compacto */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <TemaPanelEntrada
              onCreate={handleCreate}
              loading={loading.create}
            />
          </div>

          {/* Panel Principal de Temas */}
          <div className="flex-1 bg-primary/50 backdrop-blur-sm rounded-xl border border-primary/30 overflow-hidden">
            {editingTema ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-3 p-4 border-b border-primary/30 bg-secondary/20">
                  <button
                    onClick={handleCloseEdit}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-primary rounded-lg smooth-transition text-secondary hover:text-primary text-sm"
                    aria-label="Volver a la lista de temas"
                  >
                    ← Volver
                  </button>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-primary">Editando Tema</h2>
                    <p className="text-sm text-secondary">{editingTema.nombre}</p>
                  </div>
                  <span className="text-xs text-secondary bg-primary px-2 py-1 rounded-full">
                    {editingTema.palabras?.length || 0} palabras
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <TemaPanelEdicion
                    tema={editingTema}
                    onUpdateTitle={handleUpdateTitle}
                    onUpdateWords={handleUpdateWords}
                    onUndo={handleCloseEdit}
                    isLoading={false}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <TemasPanel
                  temas={temas}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onImport={handleImport}
                  onEdit={handleStartEdit}
                  loading={loading.update}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  showToast={showToast}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                  selectedId={selectedId}
                  onSelect={handleSelectTema}
                />
              </div>
            )}
          </div>
        </div>

        {/* Botón Continuar */}
        <div className="fixed bottom-6 right-6">
          <button
            disabled={!selectedId || loading.load}
            onClick={() => nav(`/diagramacion/${selectedId}`)}
            className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent-hover disabled:bg-disabled disabled:cursor-not-allowed smooth-transition flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-base"
          >
            <span>Continuar</span>
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>



      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}
