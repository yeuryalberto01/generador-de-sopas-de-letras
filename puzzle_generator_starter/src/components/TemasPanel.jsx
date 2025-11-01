import React, { useMemo, useCallback, useState } from 'react';
import { Search, Download, Upload, Loader2 } from 'lucide-react';
import TemaItem from './TemaItem';
import { exportToJSON, importFromJSON } from '../services/temas';

const TemasPanel = React.memo(({ temas, onUpdate, onDelete, onImport, onEdit, loading, searchTerm, setSearchTerm }) => {
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
        setImporting(false);
        event.target.value = ''; // Reset input
      }
    );
  }, [onImport]);

  return (
    <div className="bg-card rounded-lg shadow-md h-full flex flex-col transition-colors duration-300">
      <div className="p-6 border-b border-border-primary">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Temas Guardados</h2>
          <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-sm font-semibold px-3 py-1 rounded-full">
            {temas.length}
          </span>
        </div>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en temas y palabras..."
              className="w-full pl-10 pr-3 py-2 border border-border-secondary bg-input text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>
          <button
            onClick={() => exportToJSON(temas)}
            disabled={temas.length === 0}
            className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download size={18} />
            Exportar
          </button>
          <label className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer transition-colors flex items-center gap-2">
            <Upload size={18} />
            Importar
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>
        {importing && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Importando temas...
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemas.length === 0 ? (
          <div className="text-center py-12 text-text-secondary">
            {searchTerm ? 'No se encontraron temas' : 'Aún no hay temas guardados. ¡Crea tu primer tema!'}
          </div>
        ) : (
          filteredTemas.map((tema) => (
            <TemaItem
              key={tema.id}
              tema={tema}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onEdit={onEdit}
              loading={loading}
            />
          ))
        )}
      </div>
    </div>
  );
});

TemasPanel.displayName = 'TemasPanel';

export default TemasPanel;
