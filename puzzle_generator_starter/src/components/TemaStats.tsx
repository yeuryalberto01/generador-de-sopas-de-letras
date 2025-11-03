import { BarChart3, BookOpen, Calendar, Hash, Type } from 'lucide-react'
import { memo } from 'react'
import type { Tema } from '../types'
import { getTemaStats } from '../utils/temaUtils'

interface TemaStatsProps {
  tema: Tema
  className?: string
}

/**
 * Componente para mostrar estadísticas detalladas de un tema
 * Optimizado con React.memo para evitar re-renders innecesarios
 */
const TemaStats = memo<TemaStatsProps>(({ tema, className = '' }) => {
  const stats = getTemaStats(tema)

  const statItems = [
    {
      icon: Hash,
      label: 'Palabras',
      value: stats.totalWords,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Type,
      label: 'Longitud promedio',
      value: `${stats.avgLength} chars`,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: BarChart3,
      label: 'Caracteres únicos',
      value: stats.uniqueChars,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: BookOpen,
      label: 'Descripción',
      value: stats.hasDescription ? 'Sí' : 'No',
      color: stats.hasDescription ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
    },
    {
      icon: Calendar,
      label: 'Última actualización',
      value: stats.lastUpdated.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      color: 'text-orange-600 dark:text-orange-400'
    }
  ]

  return (
    <div className={`bg-secondary rounded-lg border border-primary p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        <BarChart3 size={20} className="text-accent" />
        Estadísticas del Tema
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-primary rounded-md border border-primary hover:shadow-md smooth-transition"
            >
              <Icon size={18} className={item.color} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-secondary font-medium uppercase tracking-wider">
                  {item.label}
                </div>
                <div className="text-sm text-primary font-semibold truncate">
                  {item.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Barra de progreso para completitud del tema */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-secondary">Completitud del tema</span>
          <span className="text-sm font-semibold text-primary">
            {Math.round((stats.totalWords / 10) * 100)}%
          </span>
        </div>
        <div className="w-full bg-tertiary rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full smooth-transition"
            style={{ width: `${Math.min((stats.totalWords / 10) * 100, 100)}%` }}
          />
        </div>
        <div className="text-xs text-tertiary mt-1">
          {stats.totalWords < 5 && 'Añade más palabras para un mejor tema'}
          {stats.totalWords >= 5 && stats.totalWords < 10 && '¡Buen progreso!'}
          {stats.totalWords >= 10 && '¡Tema completo!'}
        </div>
      </div>
    </div>
  )
})

TemaStats.displayName = 'TemaStats'

export default TemaStats