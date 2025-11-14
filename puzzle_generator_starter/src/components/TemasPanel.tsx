import { ArrowUpDown, Clock, Download, Loader2, Search, Star, Upload } from 'lucide-react';
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react';
import { exportToJSON, importFromJSON } from '../services/temas';
import type { Tema } from '../types';
import { getPalabrasForSearch } from '../utils/temaConverters';
import TemaItem from './TemaItem';

// Hook local para debounce
function useDebounce(value: any, delay: number = 300): any {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- TIPOS ---

interface TemasPanelProps {
  temas: Tema[];
  onUpdate: (id: string, title: string, words: string[]) => void;
  onDelete: (id: string) => void;
  onImport: (importedTemas: Tema[]) => void;
  onEdit: (tema: Tema) => void;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showToast?: (message: string, type?: string) => void;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// =============================================================================
// COMPONENTE
// =============================================================================

const TemasPanel: FC<TemasPanelProps> = ({
  temas,
  onUpdate,
  onDelete,
  onImport,
  onEdit,
  loading,
  searchTerm,
  setSearchTerm,
  showToast,
  favorites = new Set(),
  onToggleFavorite,
  selectedId,
  onSelect
}) => {
  const [importing, setImporting] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'nombre' | 'created'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredTemas = useMemo(() => {
    let filtered = temas.filter(tema => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const nombreMatch = tema.nombre.toLowerCase().includes(searchLower);
      const palabrasMatch = getPalabrasForSearch(tema.palabras || [])
        .some(word => word.toLowerCase().includes(searchLower));
      return nombreMatch || palabrasMatch;
    });

    if (showOnlyFavorites) {
      filtered = filtered.filter(tema => favorites.has(tema.id));
    }

    // Ordenar los temas
    filtered.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      return multiplier * a.nombre.localeCompare(b.nombre);
    });

    return filtered;
  }, [temas, debouncedSearchTerm, showOnlyFavorites, favorites, sortBy, sortOrder]);

  const handleFileImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    importFromJSON(
      file,
      (importedTemas: Tema[]) => {
        onImport(importedTemas);
        setImporting(false);
        if(event.target) event.target.value = '';
      },
      (error: string) => {
        setImporting(false);
        if(event.target) event.target.value = '';
        if (showToast) showToast(error, 'error');
      }
    );
  }, [onImport]);

  return (
    <div className="rounded-xl shadow-xl border h-auto xl:h-full flex flex-col smooth-transition bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Temas</h2>
          <span className="text-xs text-gray-900 dark:text-slate-100 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full">
            {temas.length}
          </span>
        </div>

        {/* Barra de búsqueda compacta */}
        <div className="mb-3">
          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm focus-within:ring-2 focus-within:ring-blue-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
            {searchTerm !== debouncedSearchTerm ? (
              <Clock size={14} className="text-warning animate-pulse" />
            ) : (
              <Search size={16} className="text-tertiary" />
            )}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar temas..."
              className="flex-1 bg-transparent placeholder:text-secondary focus:outline-none"
              aria-label="Buscar temas"
            />
          </div>
        </div>

        {/* Barra de herramientas compacta */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => exportToJSON(temas)}
                disabled={temas.length === 0}
                className="w-9 h-9 border border-success text-success rounded-lg hover:bg-success/10 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition flex items-center justify-center transition-all"
                title="Exportar temas"
              >
                <Download size={16} />
              </button>
              <label className="w-9 h-9 border border-accent text-accent rounded-lg hover:bg-accent/10 cursor-pointer smooth-transition flex items-center justify-center transition-all" title="Importar temas">
                <Upload size={16} />
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
              <button
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`w-9 h-9 border rounded-lg smooth-transition flex items-center justify-center transition-all ${
                  showOnlyFavorites
                    ? 'border-warning text-warning bg-warning/10'
                    : 'border-border-secondary text-secondary hover:bg-primary/10'
                }`}
                title={`${showOnlyFavorites ? 'Mostrar todos' : 'Solo favoritos'}`}
                aria-pressed={showOnlyFavorites}
              >
                <Star size={16} className={showOnlyFavorites ? 'fill-current' : ''} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                aria-label="Ordenar temas por"
              >
                <option value="updated">Recientes</option>
                <option value="nombre">Alfabético</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-9 h-9 border border-border-secondary text-secondary rounded-lg hover:bg-primary/10 smooth-transition flex items-center justify-center transition-all"
                title={`Orden ${sortOrder === 'asc' ? 'ascendente' : 'descendente'}`}
              >
                <ArrowUpDown size={16} />
              </button>
            </div>
          </div>

        {importing && (
          <div className="flex items-center gap-2 text-accent text-sm">
            <Loader2 size={16} className="animate-spin" />
            Importando temas...
          </div>
        )}
      </div>
      <div className="flex-1 overflow-visible xl:overflow-y-auto p-3 sm:p-4">
        {filteredTemas.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-secondary">
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
              showToast={showToast}
              isFavorite={favorites.has(tema.id)}
              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(tema.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
};

TemasPanel.displayName = 'TemasPanel';

export default TemasPanel;
