import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';
import TemaPanelEntrada from '../../components/TemaPanelEntrada';
import TemasPanel from '../../components/TemasPanel';
import { useApp } from '../../hooks/useApp';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useTemaOperations } from '../../hooks/useTemaOperations';
import { temasService } from '../../services/temas';
import TemaPanelEdicion from './TemaPanelEdicion';

// ============= COMPONENTE PRINCIPAL MEJORADO =============
export default function Temas() {
  const nav = useNavigate();
  const { selectTema } = useApp();
  const temaOps = useTemaOperations();

  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState({ create: false, update: false, load: true, import: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useLocalStorage('selectedTemaId', null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTema, setEditingTema] = useState(null);

  const handleOpenEditModal = (tema) => {
    setEditingTema(tema);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTema(null);
    setIsEditModalOpen(false);
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
      setSelectedId(result.id);
      selectTema(result);
    } catch (error) {
      // Error al crear el tema
    } finally {
      setLoading(prev => ({ ...prev, create: false }));
    }
  };

  const handleUpdate = async (id, title, words) => {
    setLoading(prev => ({ ...prev, update: true }));
    try {
      const updated = await temasService.updateTema(id, title, words);
      setTemas(prev => prev.map(t => t.id === id ? updated : t));
    } catch (error) {
      // Error al guardar cambios
    } finally {
      setLoading(prev => ({ ...prev, update: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      await temasService.deleteTema(id);
      setTemas(prev => prev.filter(t => t.id !== id));

      // Si se eliminó el tema seleccionado, deseleccionar
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (error) {
      // Error al eliminar tema
    }
  };

  const handleImport = async (importedTemas) => {
    setLoading(prev => ({ ...prev, import: true }));
    try {
      const newTemas = await temasService.bulkImport(importedTemas);
      setTemas(newTemas);
    } catch (error) {
      // Error al importar temas
    } finally {
      setLoading(prev => ({ ...prev, import: false }));
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Gestión de Temas</h1>
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
            onEdit={handleOpenEditModal}
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
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-700 dark:hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg"
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
              isLoading={false}
            />
          )}
      </Modal>
    </div>
  );
}
