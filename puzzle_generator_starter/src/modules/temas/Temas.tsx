import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import TemaPanelEntrada from '../../components/TemaPanelEntrada';
import TemasPanel from '../../components/TemasPanel';
import { useApp } from '../../hooks/useApp';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useTemaOperations } from '../../hooks/useTemaOperations';
import { temasService } from '../../services/temas';
import type { Tema } from '../../types';
import TemaPanelEdicion from './TemaPanelEdicion';

// --- TIPOS ---

interface LoadingState {
  create: boolean;
  update: boolean;
  load: boolean;
  import: boolean;
}

// ============= COMPONENTE PRINCIPAL MEJORADO =============
export default function Temas() {
  const nav = useNavigate();
  const { selectTema } = useApp();
  const temaOps = useTemaOperations();

  const [temas, setTemas] = useState<Tema[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ create: false, update: false, load: true, import: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useLocalStorage('selectedTemaId', null);

  const [isEntradaPanelCollapsed, setEntradaPanelCollapsed] = useState(false);
  const [isTemasPanelCollapsed, setTemasPanelCollapsed] = useState(false);
  const [editingTema, setEditingTema] = useState<Tema | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenEditModal = (tema: Tema) => {
    setEditingTema(tema);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTema(null);
    setIsEditModalOpen(false);
  };

  // Funciones para TemaPanelEdicion
  const handleUpdateTitle = async (id: string, title: string) => {
    const result = await temaOps.updateExistingTema(id, { nombre: title });
    if (result.ok && result.data) {
      setTemas(prev => prev.map(t => (t.id === id ? result.data as Tema : t)));
    } else {
      console.error('Error al actualizar título');
    }
  };

  const handleUpdateWords = async (id: string, words: string[]) => {
    const result = await temaOps.replaceTemaPalabras(id, { palabras: words });
    if (result.ok) {
      setTemas(prev => prev.map(t => (t.id === id ? { ...t, palabras: words } : t)));
    } else {
      console.error('Error al actualizar palabras');
    }
  };

  const handleSelectTema = useCallback((id: string) => {
    setSelectedId(id);
    if (selectTema) selectTema(id);
  }, [selectTema, setSelectedId]);

  const loadTemas = useCallback(async () => {
    setLoading(prev => ({ ...prev, load: true }));
    try {
      const loadedTemas = await temasService.getTemas();
      setTemas(loadedTemas);
    } catch (error) {
      console.error('Error al cargar temas', error);
    } finally {
      setLoading(prev => ({ ...prev, load: false }));
    }
  }, []);

  useEffect(() => {
    loadTemas();
  }, [loadTemas]);

  useEffect(() => {
    if (!temas.length) return;
    const exists = selectedId ? temas.some(t => t.id === selectedId) : false;
    if (!exists && temas.length > 0) {
      handleSelectTema(temas[0].id);
    }
  }, [temas, selectedId, handleSelectTema]);

  const handleCreate = async (title: string, words: string[]) => {
    setLoading(prev => ({ ...prev, create: true }));
    try {
      const result = await temasService.createTema(title, words);
      setTemas(prev => [result, ...prev]);
      handleSelectTema(result.id);
    } catch (error) {
      console.error('Error al crear el tema', error);
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdate = async (id: string, title: string, words: string[]) => {
    setLoading(prev => ({ ...prev, update: true }));
    try {
      const updated = await temasService.updateTema(id, title, words);
      setTemas(prev => prev.map(t => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Error al guardar cambios', error);
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await temasService.deleteTema(id);
      setTemas(prev => prev.filter(t => t.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (error) {
      console.error('Error al eliminar tema', error);
    }
  };

  const handleImport = async (importedTemas: Tema[]) => {
    setLoading(prev => ({ ...prev, import: true }));
    try {
      const newTemas = await temasService.bulkImport(importedTemas);
      setTemas(newTemas);
    } catch (error) {
      console.error('Error al importar temas', error);
    } finally {
      setLoading(prev => ({ ...prev, import: false }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Gestión de Temas</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Crea, edita y organiza tus temas para sopas de letras</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white">
              {temas.length} temas
            </span>
          </div>
        </div>
      </div>

      {/* Contenido Principal - Panorámico */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 p-6 overflow-hidden">
        {/* Panel de Entrada Colapsable */}
        <div className={`relative flex-shrink-0 transition-all duration-300 ease-in-out ${isEntradaPanelCollapsed ? 'lg:w-16' : 'lg:w-80'} w-full`}>
          <button 
              onClick={() => setEntradaPanelCollapsed(!isEntradaPanelCollapsed)} 
              className="absolute top-1/2 -right-3 z-20 bg-gray-200 dark:bg-slate-700 p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 hidden lg:block"
              title={isEntradaPanelCollapsed ? 'Expandir panel' : 'Contraer panel'}
          >
              <span className="font-bold text-lg">{isEntradaPanelCollapsed ? '»' : '«'}</span>
          </button>
          <div className={`h-full ${isEntradaPanelCollapsed ? 'overflow-hidden' : ''}`}>
            <div className={isEntradaPanelCollapsed ? 'hidden' : 'h-full'}>
                <TemaPanelEntrada
                    onCreate={handleCreate}
                    loading={loading.create}
                />
            </div>
            {isEntradaPanelCollapsed && (
                <div className="h-full flex items-center justify-center rounded-xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                    <span className="transform -rotate-90 whitespace-nowrap text-sm font-semibold tracking-wider uppercase">Entrada</span>
                </div>
            )}
          </div>
        </div>

        {/* Panel de Temas Colapsable */}
        <div className={`relative transition-all duration-300 ease-in-out ${isTemasPanelCollapsed ? 'lg:w-16' : 'flex-1'} w-full`}>
            <button 
                onClick={() => setTemasPanelCollapsed(!isTemasPanelCollapsed)} 
                className="absolute top-1/2 -left-3 z-20 bg-gray-200 dark:bg-slate-700 p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600 hidden lg:block"
                title={isTemasPanelCollapsed ? 'Expandir panel' : 'Contraer panel'}
            >
                <span className="font-bold text-lg">{isTemasPanelCollapsed ? '«' : '»'}</span>
            </button>
            <div className={`h-full ${isTemasPanelCollapsed ? 'overflow-hidden' : ''}`}>
                <div className={isTemasPanelCollapsed ? 'hidden' : 'h-full'}>
                    <TemasPanel
                        temas={temas}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onImport={handleImport}
                        onEdit={handleOpenEditModal}
                        loading={loading.update}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        selectedId={selectedId}
                        onSelect={handleSelectTema}
                    />
                </div>
                {isTemasPanelCollapsed && (
                    <div className="h-full flex items-center justify-center rounded-xl border bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
                        <span className="transform -rotate-90 whitespace-nowrap text-sm font-semibold tracking-wider uppercase">Temas</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Botón Continuar */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          disabled={!selectedId || loading.load}
          onClick={() => nav(`/diagramacion/${selectedId}`)}
          className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed smooth-transition flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105 text-base"
        >
          <span>Continuar</span>
          <span className="text-lg">→</span>
        </button>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={`Editando: ${editingTema?.nombre}`}
        className="max-w-6xl">
          {editingTema && (
            <TemaPanelEdicion
              tema={editingTema}
              onUpdateTitle={handleUpdateTitle}
              onUpdateWords={handleUpdateWords}
              onUndo={handleCloseEditModal}
              isLoading={false}
            />
          )}
      </Modal>
    </div>
  );
}
