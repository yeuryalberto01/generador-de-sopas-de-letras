import { AnimatePresence, motion } from 'framer-motion'
import { memo, useMemo, useState } from 'react'
import TemaCard from './TemaCard'

const CATEGORIAS = {
  educativo: { nombre: 'Educativo', color: '#10b981', icon: '📚' },
  entretenimiento: { nombre: 'Entretenimiento', color: '#f59e0b', icon: '🎮' },
  profesional: { nombre: 'Profesional', color: '#3b82f6', icon: '💼' },
  general: { nombre: 'General', color: '#6b7280', icon: '📝' },
  personalizado: { nombre: 'Personalizado', color: '#8b5cf6', icon: '🎨' }
}

const TemaGallery = memo(({
  temas,
  selectedId,
  editingId,
  loadingStates: _loadingStates,
  favorites,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
  isLoading
}) => {
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list' | 'categories'
  const [selectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filtrar temas por búsqueda y categoría
  const filteredTemas = useMemo(() => {
    let filtered = temas

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(tema =>
        tema.nombre.toLowerCase().includes(term) ||
        (tema.descripcion && tema.descripcion.toLowerCase().includes(term))
      )
    }

    // Filtrar por categoría (si se implementa en el futuro)
    if (selectedCategory !== 'all') {
      // Aquí se filtraría por categoría cuando se implemente
      // filtered = filtered.filter(tema => tema.category === selectedCategory)
    }

    return filtered
  }, [temas, searchTerm, selectedCategory])

  // Agrupar temas por categoría (simulado por ahora)
  const temasByCategory = useMemo(() => {
    const grouped = {}

    filteredTemas.forEach(tema => {
      // Simular categorías basadas en el nombre (puedes cambiar esto)
      let categoria = 'general'
      const nombre = tema.nombre.toLowerCase()

      if (nombre.includes('edu') || nombre.includes('escuela') || nombre.includes('clase')) {
        categoria = 'educativo'
      } else if (nombre.includes('juego') || nombre.includes('diver') || nombre.includes('entrete')) {
        categoria = 'entretenimiento'
      } else if (nombre.includes('trabajo') || nombre.includes('empresa') || nombre.includes('profesional')) {
        categoria = 'profesional'
      } else if (nombre.includes('personal') || nombre.includes('custom')) {
        categoria = 'personalizado'
      }

      if (!grouped[categoria]) {
        grouped[categoria] = []
      }
      grouped[categoria].push(tema)
    })

    return grouped
  }, [filteredTemas])

  const renderGridView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        padding: '20px 0'
      }}
    >
      <AnimatePresence>
        {filteredTemas.map(tema => (
          <motion.div
            key={tema.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <TemaCard
              tema={tema}
              isSelected={selectedId === tema.id}
              isEditing={editingId === tema.id}
              isLoading={isLoading(tema.id)}
              isFavorite={favorites.has(tema.id)}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              editForm={editForm}
              onEditFormChange={onEditFormChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )

  const renderCategoriesView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: '20px 0' }}
    >
      {Object.entries(temasByCategory).map(([categoriaKey, temasCategoria]) => {
        const categoria = CATEGORIAS[categoriaKey] || CATEGORIAS.general

        return (
          <motion.div
            key={categoriaKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 40 }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 16,
              padding: '12px 16px',
              background: categoria.color + '20',
              borderRadius: 12,
              border: `2px solid ${categoria.color}40`
            }}>
              <span style={{ fontSize: 24, marginRight: 12 }}>{categoria.icon}</span>
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: categoria.color,
                margin: 0
              }}>
                {categoria.nombre}
              </h3>
              <span style={{
                marginLeft: 'auto',
                background: categoria.color,
                color: 'white',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 500
              }}>
                {temasCategoria.length}
              </span>
            </div>

            <motion.div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16
              }}
            >
              <AnimatePresence>
                {temasCategoria.map(tema => (
                  <motion.div
                    key={tema.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TemaCard
                      tema={tema}
                      isSelected={selectedId === tema.id}
                      isEditing={editingId === tema.id}
                      isLoading={isLoading(tema.id)}
                      isFavorite={favorites.has(tema.id)}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleFavorite={onToggleFavorite}
                      editForm={editForm}
                      onEditFormChange={onEditFormChange}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )
      })}
    </motion.div>
  )

  const renderListView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ padding: '20px 0' }}
    >
      <div style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {filteredTemas.map((tema, index) => (
          <motion.div
            key={tema.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              padding: 16,
              borderBottom: index < filteredTemas.length - 1 ? '1px solid #f3f4f6' : 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => onSelect(tema.id)}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: selectedId === tema.id ? '#3b82f6' : '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              color: selectedId === tema.id ? 'white' : '#6b7280',
              fontWeight: 'bold'
            }}>
              {tema.nombre.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600,
                color: selectedId === tema.id ? '#3b82f6' : '#111827'
              }}>
                {tema.nombre}
              </div>
              {tema.descripcion && (
                <div style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                  {tema.descripcion}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite(tema.id)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 18,
                  color: favorites.has(tema.id) ? '#f59e0b' : '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                {favorites.has(tema.id) ? '★' : '☆'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(tema)
                }}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Editar
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(tema)
                }}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )

  return (
    <div>
      {/* Controles de vista */}
      <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap'
      }}>
        {/* Búsqueda */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar temas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 16px',
              paddingLeft: 40,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              width: 250,
              fontSize: 14
            }}
          />
          <span style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: 16
          }}>
            🔍
          </span>
        </div>

        {/* Selector de vista */}
        <div style={{ display: 'flex', gap: 4, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'grid' ? '#3b82f6' : 'white',
              color: viewMode === 'grid' ? 'white' : '#6b7280',
              borderRadius: '6px 0 0 6px',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            📐 Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'list' ? '#3b82f6' : 'white',
              color: viewMode === 'list' ? 'white' : '#6b7280',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            📋 Lista
          </button>
          <button
            onClick={() => setViewMode('categories')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'categories' ? '#3b82f6' : 'white',
              color: viewMode === 'categories' ? 'white' : '#6b7280',
              borderRadius: '0 6px 6px 0',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            🏷️ Categorías
          </button>
        </div>

        {/* Estadísticas */}
        <div style={{
          marginLeft: 'auto',
          fontSize: 14,
          color: '#6b7280',
          display: 'flex',
          gap: 16
        }}>
          <span>Total: {filteredTemas.length}</span>
          <span>Favoritos: {filteredTemas.filter(t => favorites.has(t.id)).length}</span>
        </div>
      </div>

      {/* Contenido según vista seleccionada */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'categories' && renderCategoriesView()}
      </AnimatePresence>

      {/* Mensaje cuando no hay resultados */}
      {filteredTemas.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: 60,
            color: '#9ca3af'
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
            No se encontraron temas
          </div>
          <div>
            {searchTerm ? `No hay resultados para "${searchTerm}"` : 'Crea tu primer tema para comenzar'}
          </div>
        </motion.div>
      )}
    </div>
  )
})

TemaGallery.displayName = 'TemaGallery'

export default TemaGallery