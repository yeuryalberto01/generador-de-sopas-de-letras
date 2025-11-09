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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTema, setEditingTema] = useState<Tema | null>(null);

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
      // TODO: Manejar error al actualizar título
      console.error('Error al actualizar título');
    }
  };

  const handleUpdateWords = async (id: string, words: string[]) => {
    const result = await temaOps.replaceTemaPalabras(id, { palabras: words });
    if (result.ok) {
      setTemas(prev => prev.map(t => (t.id === id ? { ...t, palabras: words } : t)));
    } else {
      // TODO: Manejar error al actualizar palabras
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
    if (!exists) {
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
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Temas</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-auto xl:h-[calc(100vh-150px)]">
          <TemaPanelEntrada
            onCreate={handleCreate}
            loading={loading.create}
          />

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

        {/* Botón Continuar */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            disabled={!selectedId || loading.load}
            onClick={() => nav(`/diagramacion/${selectedId}`)}
            className="bg-blue-600 dark:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg relative"
          >
            Continuar
          </button>
        </div>
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
              isLoading={false} // O pasar el estado de carga real si es necesario
            />
          )}
      </Modal>
    </div>
  );
}
