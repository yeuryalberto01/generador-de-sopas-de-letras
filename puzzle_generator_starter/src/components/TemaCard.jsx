import { memo } from 'react'
import { motion } from 'framer-motion'

// Categorías con colores e iconos
const CATEGORIAS = {
  educativo: { nombre: 'Educativo', color: '#10b981', icon: '📚' },
  entretenimiento: { nombre: 'Entretenimiento', color: '#f59e0b', icon: '🎮' },
  profesional: { nombre: 'Profesional', color: '#3b82f6', icon: '💼' },
  general: { nombre: 'General', color: '#6b7280', icon: '📝' },
  personalizado: { nombre: 'Personalizado', color: '#8b5cf6', icon: '🎨' }
}

// Función para determinar categoría basada en el nombre
const getCategoria = (nombre) => {
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

const TemaCard = memo(({
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
  const categoriaKey = getCategoria(tema.nombre)
  const categoria = CATEGORIAS[categoriaKey]
  
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'relative',
          border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
          borderRadius: 16,
          padding: 16,
          background: 'white',
          opacity: isLoading ? 0.6 : 1,
          cursor: 'default'
        }}
        role="form"
        aria-label={`Editando tema ${tema.nombre}`}
      >
        <label htmlFor={`edit-nombre-${tema.id}`} style={{ display: 'none' }}>
          Nombre del tema
        </label>
        <input
          id={`edit-nombre-${tema.id}`}
          value={editForm.nombre}
          onChange={(e) => onEditFormChange('nombre', e.target.value)}
          style={{ 
            width: '100%', 
            marginBottom: 8, 
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            padding: '6px 8px'
          }}
          placeholder="Nombre del tema"
          autoFocus
          aria-required="true"
          aria-invalid={!editForm.nombre.trim()}
        />
        <label htmlFor={`edit-descripcion-${tema.id}`} style={{ display: 'none' }}>
          Descripción del tema
        </label>
        <textarea
          id={`edit-descripcion-${tema.id}`}
          value={editForm.descripcion}
          onChange={(e) => onEditFormChange('descripcion', e.target.value)}
          style={{ 
            width: '100%', 
            minHeight: 60, 
            marginBottom: 8,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            padding: '6px 8px',
            resize: 'vertical'
          }}
          placeholder="Descripción (opcional)"
          aria-label="Descripción del tema (opcional)"
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => onSaveEdit(tema.id)}
            disabled={isLoading || !editForm.nombre.trim()}
            style={{
              padding: '6px 12px',
              background: isLoading || !editForm.nombre.trim() ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: isLoading || !editForm.nombre.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
            aria-label={`Guardar cambios para ${tema.nombre}`}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </button>
          <button 
            onClick={onCancelEdit}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
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
      style={{
        position: 'relative',
        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: 16,
        padding: 16,
        background: 'white',
        opacity: isLoading ? 0.6 : 1,
        cursor: 'pointer'
      }}
      role="button"
      tabIndex={0}
      aria-label={`${tema.nombre}${tema.descripcion ? ': ' + tema.descripcion : ''}. ${isSelected ? 'Seleccionado' : 'No seleccionado'}. ${isFavorite ? 'Favorito' : 'No favorito'}. Haga clic para seleccionar.`}
      onClick={() => onSelect(tema.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(tema.id)
        }
      }}
    >
      {/* Botones de acción */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        display: 'flex',
        gap: 6
      }}>
        {/* Botón favorito */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(tema.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 16,
            color: isFavorite ? '#f59e0b' : '#cbd5e1',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 4
          }}
          aria-label={isFavorite ? `Quitar ${tema.nombre} de favoritos` : `Agregar ${tema.nombre} a favoritos`}
          aria-pressed={isFavorite}
        >
          {isFavorite ? '★' : '☆'}
        </motion.button>

        {/* Botón editar */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(tema)
          }}
          disabled={isLoading}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
          aria-label={`Editar tema ${tema.nombre}`}
        >
          ✏️
        </button>

        {/* Botón eliminar */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(tema)
          }}
          disabled={isLoading}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 12,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
          aria-label={`Eliminar tema ${tema.nombre}`}
        >
          ×
        </button>
      </div>

      {/* Indicador de categoría */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: categoria.color + '20',
        padding: '4px 8px',
        borderRadius: 12,
        border: `1px solid ${categoria.color}40`
      }}>
        <span style={{ fontSize: 12 }}>{categoria.icon}</span>
        <span style={{ fontSize: 10, color: categoria.color, fontWeight: 500 }}>
          {categoria.nombre}
        </span>
      </div>

      {/* Contenido de la tarjeta */}
      <div onClick={() => onSelect(tema.id)} style={{ marginTop: 40 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 8,
            color: isSelected ? '#3b82f6' : '#111827'
          }}
          aria-hidden="true"
        >
          {tema.nombre}
        </div>

        {tema.descripcion && (
          <div
            style={{ fontSize: 14, color: '#64748b', marginBottom: 12, lineHeight: 1.4 }}
            aria-hidden="true"
          >
            {tema.descripcion.length > 80 ? tema.descripcion.substring(0, 80) + '...' : tema.descripcion}
          </div>
        )}

        {/* Miniatura visual (placeholder) */}
        <div style={{
          height: 60,
          background: `linear-gradient(135deg, ${categoria.color}20, ${categoria.color}10)`,
          borderRadius: 8,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${categoria.color}30`
        }}>
          <span style={{ fontSize: 24, opacity: 0.6 }}>{categoria.icon}</span>
        </div>

        <div
          style={{ fontSize: 12, color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          aria-hidden="true"
        >
          <span>Actualizado: {new Date(tema.updated_at || Date.now()).toLocaleDateString()}</span>
          {isFavorite && <span style={{ color: '#f59e0b' }}>⭐</span>}
        </div>
      </div>
    </motion.div>
  )
})

TemaCard.displayName = 'TemaCard'

export default TemaCard