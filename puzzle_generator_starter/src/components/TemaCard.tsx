import { motion } from 'framer-motion';
import { memo, useCallback, useMemo } from 'react';
import type { Categoria, CategoriaKey, Tema } from '../types';
import { Star, Pencil, Trash2, Save, X } from 'lucide-react';

// --- TIPOS ---

interface TemaCardProps {
  tema: Tema;
  isSelected: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isFavorite: boolean;
  onSelect: (id: string) => void;
  onEdit: (tema: Tema) => void;
  onDelete: (tema: Tema) => void;
  onToggleFavorite: (id: string) => void;
  editForm: { nombre: string; descripcion: string };
  onEditFormChange: (field: 'nombre' | 'descripcion', value: string) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
}

// --- CONSTANTES ---

// Se actualizan las categorías para usar clases de Tailwind en lugar de colores fijos.
const CATEGORIAS: Record<CategoriaKey, Categoria & { className: string }> = {
  educativo: { nombre: 'Educativo', color: '', icon: '📚', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
  entretenimiento: { nombre: 'Entretenimiento', color: '', icon: '🎮', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
  profesional: { nombre: 'Profesional', color: '', icon: '💼', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-500/30' },
  general: { nombre: 'General', color: '', icon: '📝', className: 'bg-slate-100 text-slate-800 dark:bg-slate-700/60 dark:text-slate-300 border-slate-200 dark:border-slate-500/30' },
  personalizado: { nombre: 'Personalizado', color: '', icon: '🎨', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-300 border-violet-200 dark:border-violet-500/30' }
}

// --- HELPERS ---

const getCategoria = (nombre: string): CategoriaKey => {
  const lowerNombre = nombre.toLowerCase()

  if (lowerNombre.includes('edu') || lowerNombre.includes('escuela') || lowerNombre.includes('clase')) {
    return 'educativo'
  } else if (lowerNombre.includes('juego') || lowerNombre.includes('diver') || lowerNombre.includes('entrete')) {
    return 'entretenimiento'
  } else if (lowerNombre.includes('trabajo') || lowerNombre.includes('empresa') || lowerNombre.includes('profesional')) {
    return 'profesional'
  } else if (lowerNombre.includes('personal') || lowerNombre.includes('custom')) {
    return 'personalizado'
  }

  return 'general'
}

// --- COMPONENTE ---

const TemaCard = memo<TemaCardProps>( ({
  tema,
  isSelected,
  isEditing,
  isLoading,
  isFavorite,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit
}) => {
  const categoria = useMemo(() => {
    const categoriaKey = getCategoria(tema.nombre)
    return CATEGORIAS[categoriaKey]
  }, [tema.nombre])

  // Callbacks optimizados
  const handleSelect = useCallback(() => onSelect(tema.id), [onSelect, tema.id]);
  const handleEdit = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onEdit(tema); }, [onEdit, tema]);
  const handleDelete = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onDelete(tema); }, [onDelete, tema]);
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onToggleFavorite(tema.id); }, [onToggleFavorite, tema.id]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(tema.id); } }, [onSelect, tema.id]);
  
  if (isEditing) {
    return (
      <motion.div
        layoutId={`card-${tema.id}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative border rounded-xl p-4 bg-card ${isSelected ? 'ring-2 ring-border-focus ring-offset-2 ring-offset-surface' : 'border-border-secondary'} ${isLoading ? 'opacity-60 cursor-default' : ''}`}
        role="form"
        aria-label={`Editando tema ${tema.nombre}`}
      >
        <div className="flex flex-col h-full">
          <input
            value={editForm.nombre}
            onChange={(e) => onEditFormChange('nombre', e.target.value)}
            className="w-full mb-2 border-border-secondary rounded-md px-3 py-2 bg-input text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-border-focus"
            placeholder="Nombre del tema"
            autoFocus
            aria-required="true"
          />
          <textarea
            value={editForm.descripcion}
            onChange={(e) => onEditFormChange('descripcion', e.target.value)}
            className="w-full flex-grow min-h-[80px] mb-3 border-border-secondary rounded-md px-3 py-2 resize-none bg-input text-secondary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-border-focus"
            placeholder="Descripción (opcional)"
          />
          <div className="flex gap-2 items-center justify-end">
            <button
              onClick={onCancelEdit}
              disabled={isLoading}
              className="p-2 rounded-md text-secondary hover:bg-surface disabled:opacity-50"
              aria-label="Cancelar edición"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => onSaveEdit(tema.id)}
              disabled={isLoading || !editForm.nombre.trim()}
              className="flex items-center gap-2 px-4 py-2 text-accent-text rounded-md bg-accent-primary hover:bg-accent-primary-hover disabled:bg-disabled-bg disabled:text-disabled disabled:cursor-not-allowed"
              aria-label={`Guardar cambios para ${tema.nombre}`}
            >
              <Save size={16} />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      layoutId={`card-${tema.id}`}
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
      transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 20 }}
      className={`relative border rounded-xl p-4 bg-card cursor-pointer ${isSelected ? 'border-transparent ring-2 ring-border-focus' : 'border-border-primary'} ${isLoading ? 'opacity-60' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${tema.nombre}. ${isSelected ? 'Seleccionado' : ''}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-card/50 backdrop-blur-sm px-1 py-0.5 rounded-full border border-border-primary">
        <motion.button
          whileHover={{ scale: 1.15, rotate: [0, 15, -10, 0] }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleFavorite}
          className={`p-1.5 rounded-full text-tertiary hover:text-amber-400 ${isFavorite ? 'text-amber-500' : ''}`}
          aria-label={isFavorite ? `Quitar de favoritos` : `Marcar como favorito`}
          aria-pressed={isFavorite}
        >
          <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </motion.motion.button>

        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="p-1.5 rounded-full text-tertiary hover:text-primary transition-colors disabled:opacity-50"
          aria-label={`Editar tema`}
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="p-1.5 rounded-full text-tertiary hover:text-accent-danger transition-colors disabled:opacity-50"
          aria-label={`Eliminar tema`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${categoria.className}`}>
        {categoria.icon}
        <span>{categoria.nombre}</span>
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-lg text-primary truncate" title={tema.nombre}>
          {tema.nombre}
        </h3>

        <p className="text-sm text-secondary mt-1 h-10">
          {tema.descripcion.length > 60 ? `${tema.descripcion.substring(0, 60)}...` : tema.descripcion}
        </p>

        <div className="text-xs text-tertiary mt-4 flex justify-between items-center">
          <span>{new Date(tema.updated_at || Date.now()).toLocaleDateString()}</span>
          <div className="flex items-center gap-1">
            <span className='font-mono'>{tema.palabras.length}</span>
            <span>palabras</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

TemaCard.displayName = 'TemaCard'

export default TemaCard;