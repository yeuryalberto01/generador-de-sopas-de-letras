import { motion } from 'framer-motion';
import { memo, useCallback, useMemo } from 'react';
import type { Categoria, CategoriaKey, Tema } from '../types';

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

const CATEGORIAS: Record<CategoriaKey, Categoria> = {
  educativo: { nombre: 'Educativo', color: '#10b981', icon: '📚' },
  entretenimiento: { nombre: 'Entretenimiento', color: '#f59e0b', icon: '🎮' },
  profesional: { nombre: 'Profesional', color: '#3b82f6', icon: '💼' },
  general: { nombre: 'General', color: '#6b7280', icon: '📝' },
  personalizado: { nombre: 'Personalizado', color: '#8b5cf6', icon: '🎨' }
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

const TemaCard = memo<TemaCardProps>(({
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

  // Optimización de rendimiento con useCallback
  const handleSelect = useCallback(() => {
    onSelect(tema.id)
  }, [onSelect, tema.id])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(tema)
  }, [onEdit, tema])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(tema)
  }, [onDelete, tema])

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite(tema.id)
  }, [onToggleFavorite, tema.id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(tema.id)
    }
  }, [onSelect, tema.id])
  
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`relative border-2 rounded-2xl p-4 bg-primary smooth-transition ${isSelected ? 'border-accent shadow-lg' : 'border-primary'} ${isLoading ? 'opacity-60 cursor-default' : ''}`}
        role="form"
        aria-label={`Editando tema ${tema.nombre}`}
      >
        <label htmlFor={`edit-nombre-${tema.id}`} className="sr-only">
          Nombre del tema
        </label>
        <input
          id={`edit-nombre-${tema.id}`}
          value={editForm.nombre}
          onChange={(e) => onEditFormChange('nombre', e.target.value)}
          className="w-full mb-2 border border-primary rounded-md px-2 py-1.5 bg-primary text-primary focus:outline-none focus:ring-1 focus:ring-accent smooth-transition"
          placeholder="Nombre del tema"
          autoFocus
          aria-required="true"
          aria-invalid={!editForm.nombre.trim()}
        />
        <label htmlFor={`edit-descripcion-${tema.id}`} className="sr-only">
          Descripción del tema
        </label>
        <textarea
          id={`edit-descripcion-${tema.id}`}
          value={editForm.descripcion}
          onChange={(e) => onEditFormChange('descripcion', e.target.value)}
          className="w-full min-h-[60px] mb-2 border border-primary rounded-md px-2 py-1.5 resize-y bg-primary text-primary focus:outline-none focus:ring-1 focus:ring-accent smooth-transition"
          placeholder="Descripción (opcional)"
          aria-label="Descripción del tema (opcional)"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSaveEdit(tema.id)}
            disabled={isLoading || !editForm.nombre.trim()}
            className="px-3 py-1.5 text-white rounded-md smooth-transition disabled:bg-disabled disabled:cursor-not-allowed bg-accent hover:bg-accent-hover"
            aria-label={`Guardar cambios para ${tema.nombre}`}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onCancelEdit}
            disabled={isLoading}
            className="px-3 py-1.5 bg-secondary text-primary rounded-md smooth-transition hover:bg-secondary-hover disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Cancelar edición"
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative border-2 rounded-xl p-4 bg-primary cursor-pointer ${isSelected ? 'border-accent shadow-lg' : 'border-primary'} ${isLoading ? 'opacity-60' : ''} hover:shadow-xl smooth-transition`}
      role="button"
      tabIndex={0}
      aria-label={`${tema.nombre}${tema.descripcion ? ': ' + tema.descripcion : ''}. ${isSelected ? 'Seleccionado' : 'No seleccionado'}. ${isFavorite ? 'Favorito' : 'No favorito'}. Haga clic para seleccionar.`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      {/* Botones de acción */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleFavorite}
          className={`bg-none border-none text-lg p-1 rounded smooth-transition ${isFavorite ? 'text-amber-500' : 'text-tertiary'}`}
          aria-label={isFavorite ? `Quitar ${tema.nombre} de favoritos` : `Agregar ${tema.nombre} a favoritos`}
          aria-pressed={isFavorite}
        >
          {isFavorite ? '★' : '☆'}
        </motion.button>

        <button
          onClick={handleEdit}
          disabled={isLoading}
          className="bg-accent text-white border-none rounded-md px-2 py-1 text-xs smooth-transition hover:bg-accent-hover disabled:opacity-60"
          aria-label={`Editar tema ${tema.nombre}`}
        >
          ✏️
        </button>

        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="bg-error text-white border-none rounded-md px-2 py-1 text-xs smooth-transition hover:bg-error-hover disabled:opacity-60"
          aria-label={`Eliminar tema ${tema.nombre}`}
        >
          ×
        </button>
      </div>

      {/* Indicador de categoría */}
      <div 
        className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
        style={{ 
          backgroundColor: `${categoria.color}20`,
          border: `1px solid ${categoria.color}40`
        }}
      >
        <span className="text-xs">{categoria.icon}</span>
        <span 
          className="text-[10px] font-medium"
          style={{ color: categoria.color }}
        >
          {categoria.nombre}
        </span>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="mt-10">
        <div
          className={`font-semibold text-base mb-2 ${isSelected ? 'text-accent' : 'text-primary'}`}
          aria-hidden="true"
        >
          {tema.nombre}
        </div>

        {tema.descripcion && (
          <div
            className="text-sm text-secondary mb-3 leading-snug"
            aria-hidden="true"
          >
            {tema.descripcion.length > 80 ? `${tema.descripcion.substring(0, 80)}...` : tema.descripcion}
          </div>
        )}

        <div 
          className="h-16 rounded-lg mb-3 flex items-center justify-center border"
          style={{
            background: `linear-gradient(135deg, ${categoria.color}20, ${categoria.color}10)`,
            borderColor: `${categoria.color}30`
          }}
        >
          <span className="text-3xl opacity-60">{categoria.icon}</span>
        </div>

        <div
          className="text-xs text-tertiary flex justify-between items-center"
          aria-hidden="true"
        >
          <span>Actualizado: {new Date(tema.updated_at || Date.now()).toLocaleDateString()}</span>
          {isFavorite && <span className="text-amber-500">⭐</span>}
        </div>
      </div>
    </motion.div>
  )
})

TemaCard.displayName = 'TemaCard'

export default TemaCard