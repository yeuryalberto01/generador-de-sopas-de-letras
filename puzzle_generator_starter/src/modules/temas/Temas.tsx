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
    <div className="max-w-7xl mx-auto"> {/* This div was missing in the user's snippet, but it's part of the Layout's main content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Gestión de Temas</h1>
          <p className="text-sm text-secondary mt-1">Crea, edita y organiza tus temas para sopas de letras</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-secondary">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{temas.length} temas</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-140px)]">
        <div className="w-full lg:w-80 flex-shrink-0">
          <TemaPanelEntrada
            onCreate={handleCreate}
            loading={loading.create}
          />
        </div>

        <div className="flex-1 bg-card rounded-xl border border-border-primary overflow-hidden">
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
      </div>

      {/* Botón Continuar */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          disabled={!selectedId || loading.load}
          onClick={() => nav(`/diagramacion/${selectedId}`)}
          className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg relative 
                     bg-accent-primary hover:bg-accent-primary-hover text-accent-text 
                     disabled:bg-disabled-bg disabled:text-disabled disabled:cursor-not-allowed"
        >
          Continuar
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
