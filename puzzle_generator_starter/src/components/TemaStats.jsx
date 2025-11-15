import React, { memo, useMemo } from 'react'
import { motion } from 'framer-motion'

const CATEGORIAS = {
  educativo: { nombre: 'Educativo', color: '#10b981', icon: '📚' },
  entretenimiento: { nombre: 'Entretenimiento', color: '#f59e0b', icon: '🎮' },
  profesional: { nombre: 'Profesional', color: '#3b82f6', icon: '💼' },
  general: { nombre: 'General', color: '#6b7280', icon: '📝' },
  personalizado: { nombre: 'Personalizado', color: '#8b5cf6', icon: '🎨' }
}

const TemaStats = memo(({ temas, favorites }) => {
  const stats = useMemo(() => {
    const totalTemas = temas.length
    const totalFavoritos = temas.filter(t => favorites.has(t.id)).length

    // Categorizar temas
    const temasByCategory = {}
    temas.forEach(tema => {
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

      if (!temasByCategory[categoria]) {
        temasByCategory[categoria] = []
      }
      temasByCategory[categoria].push(tema)
    })

    // Tema más reciente
    const masReciente = temas.length > 0 ?
      temas.reduce((prev, current) =>
        new Date(prev.updated_at || prev.created_at) > new Date(current.updated_at || current.created_at) ? prev : current
      ) : null

    // Tema más antiguo
    const masAntiguo = temas.length > 0 ?
      temas.reduce((prev, current) =>
        new Date(prev.updated_at || prev.created_at) < new Date(current.updated_at || current.created_at) ? prev : current
      ) : null

    return {
      totalTemas,
      totalFavoritos,
      temasByCategory,
      masReciente,
      masAntiguo,
      porcentajeFavoritos: totalTemas > 0 ? Math.round((totalFavoritos / totalTemas) * 100) : 0
    }
  }, [temas, favorites])

  const StatCard = ({ title, value, subtitle, color = '#3b82f6', icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        border: `1px solid #e5e7eb`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        {icon && <span style={{ fontSize: 24, marginRight: 12 }}>{icon}</span>}
        <div>
          <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
        </div>
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#9ca3af' }}>{subtitle}</div>
      )}
    </motion.div>
  )

  const CategoryChart = () => {
    const total = Object.values(stats.temasByCategory).reduce((sum, arr) => sum + arr.length, 0)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 20,
          border: '1px solid #e5e7eb'
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
          Distribución por Categorías
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.entries(stats.temasByCategory).map(([categoriaKey, temasCategoria]) => {
            const categoria = CATEGORIAS[categoriaKey] || CATEGORIAS.general
            const porcentaje = total > 0 ? Math.round((temasCategoria.length / total) * 100) : 0

            return (
              <div key={categoriaKey} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{categoria.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: categoria.color }}>
                      {categoria.nombre}
                    </span>
                    <span style={{ fontSize: 14, color: '#6b7280' }}>
                      {temasCategoria.length} ({porcentaje}%)
                    </span>
                  </div>
                  <div style={{
                    height: 8,
                    background: '#f3f4f6',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${porcentaje}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      style={{
                        height: '100%',
                        background: categoria.color,
                        borderRadius: 4
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  const RecentActivity = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #e5e7eb'
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>
        Actividad Reciente
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stats.masReciente && (
          <div style={{
            padding: 12,
            background: '#f0f9ff',
            borderRadius: 8,
            border: '1px solid #e0f2fe'
          }}>
            <div style={{ fontSize: 14, color: '#0369a1', fontWeight: 500, marginBottom: 4 }}>
              Tema más reciente
            </div>
            <div style={{ fontWeight: 600, color: '#0c4a6e' }}>
              {stats.masReciente.nombre}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Actualizado: {new Date(stats.masReciente.updated_at || stats.masReciente.created_at).toLocaleString()}
            </div>
          </div>
        )}

        {stats.masAntiguo && stats.totalTemas > 1 && (
          <div style={{
            padding: 12,
            background: '#fef3c7',
            borderRadius: 8,
            border: '1px solid #fde68a'
          }}>
            <div style={{ fontSize: 14, color: '#92400e', fontWeight: 500, marginBottom: 4 }}>
              Tema más antiguo
            </div>
            <div style={{ fontWeight: 600, color: '#78350f' }}>
              {stats.masAntiguo.nombre}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Creado: {new Date(stats.masAntiguo.updated_at || stats.masAntiguo.created_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )

  if (stats.totalTemas === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          textAlign: 'center',
          padding: 40,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#6b7280' }}>
          Estadísticas de Temas
        </div>
        <div style={{ color: '#9ca3af', marginTop: 8 }}>
          Crea algunos temas para ver estadísticas detalladas
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Estadísticas principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        <StatCard
          title="Total de Temas"
          value={stats.totalTemas}
          subtitle="Temas creados"
          color="#3b82f6"
          icon="📚"
        />

        <StatCard
          title="Favoritos"
          value={stats.totalFavoritos}
          subtitle={`${stats.porcentajeFavoritos}% del total`}
          color="#f59e0b"
          icon="⭐"
        />

        <StatCard
          title="Categorías"
          value={Object.keys(stats.temasByCategory).length}
          subtitle="Categorías activas"
          color="#10b981"
          icon="🏷️"
        />

        <StatCard
          title="Actividad"
          value={stats.masReciente ? new Date(stats.masReciente.updated_at).toLocaleDateString() : 'N/A'}
          subtitle="Última actualización"
          color="#8b5cf6"
          icon="📅"
        />
      </div>

      {/* Gráficos y actividad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 20
      }}>
        <CategoryChart />
        <RecentActivity />
      </div>
    </div>
  )
})

TemaStats.displayName = 'TemaStats'

export default TemaStats
