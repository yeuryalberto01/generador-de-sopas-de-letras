import {
  ChevronRight,
  Clock,
  Home,
  Layout,
  Menu,
  Palette,
  Search,
  Settings,
  Star,
  X,
  Zap
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../hooks/useApp'

/**
 * Panel de navegación inteligente y moderno
 * Se adapta al contexto de la aplicación y preferencias del usuario
 */
export default function SmartNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { recentItems, addRecentItem } = useApp()
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navRef = useRef(null)

  const navigationItems = useMemo(() => [
    {
      path: '/',
      label: 'Inicio',
      icon: Home,
      description: 'Página principal del generador',
      category: 'principal',
      shortcut: '1'
    },
    {
      path: '/temas',
      label: 'Temas',
      icon: Palette,
      description: 'Gestionar temas y palabras',
      category: 'gestión',
      shortcut: '2',
      badge: 'popular'
    },
    {
      path: '/diagramacion',
      label: 'Diagramación',
      icon: Layout,
      description: 'Crear y editar sopas de letras',
      category: 'creación',
      shortcut: '3',
      note: 'Selecciona un tema primero'
    },
    {
      path: '/panel-apis',
      label: 'APIs',
      icon: Settings,
      description: 'Panel de desarrollo y testing',
      category: 'desarrollo',
      shortcut: '4'
    }
  ], [])

  // Agrupar items por categoría
  const groupedItems = itemsToShow.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  // Filtrar items basados en búsqueda
  const filteredItems = navigationItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Usar items filtrados si hay búsqueda, sino todos
  const itemsToShow = searchQuery ? filteredItems : navigationItems

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const handleNavigation = useCallback((item) => {
    navigate(item.path)
    addRecentItem(item)
    setIsExpanded(false)
    setSearchQuery('')
  }, [navigate, addRecentItem])

  // Cerrar navegación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Atajos de teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1
        if (navigationItems[index]) {
          handleNavigation(navigationItems[index])
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleNavigation, navigationItems])

  return (
    <>
      {/* Botón de hamburguesa para móvil */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-4 left-4 z-50 p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 lg:hidden"
        aria-label="Abrir menú de navegación"
      >
        {isExpanded ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay para móvil */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" />
      )}

      {/* Panel de navegación principal */}
      <nav
        ref={navRef}
        className={`
          fixed lg:sticky top-0 left-0 h-full
          bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900
          text-white z-40 transition-all duration-300 ease-in-out
          shadow-2xl border-r border-white/10
          ${isExpanded ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0 lg:w-20'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className={`flex items-center gap-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <div className={`${isExpanded ? 'block' : 'hidden lg:block'}`}>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Puzzle Generator
                </h1>
                <p className="text-sm text-blue-200">v2.0</p>
              </div>
            </div>
          </div>

          {/* Búsqueda */}
          <div className={`p-4 border-b border-white/10 transition-all duration-300 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="Buscar sección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Navegación principal */}
          <div className="flex-1 overflow-y-auto">
            {/* Items recientes */}
            {recentItems.length > 0 && isExpanded && (
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  Recientes
                </h3>
                <div className="space-y-2">
                  {recentItems.slice(0, 3).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleNavigation(item)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                    >
                      <item.icon size={16} className="text-blue-300" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navegación agrupada */}
            <div className="p-4">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <h3 className={`text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.path)
                      
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNavigation(item)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                            ${active 
                              ? 'bg-blue-600 shadow-lg shadow-blue-500/25' 
                              : 'hover:bg-white/10 hover:shadow-lg'
                            }
                            ${isExpanded ? 'justify-start' : 'justify-center lg:justify-start'}
                          `}
                          title={isExpanded ? '' : `${item.label} - ${item.description}`}
                        >
                          <div className={`relative flex-shrink-0 ${active ? 'text-white' : 'text-blue-300'}`}>
                            <Icon size={20} />
                            {item.badge && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
                            )}
                          </div>
                          
                          <div className={`flex-1 text-left transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{item.label}</span>
                              {item.shortcut && (
                                <kbd className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-blue-200">
                                  Alt+{item.shortcut}
                                </kbd>
                              )}
                            </div>
                            {isExpanded && (
                              <p className="text-xs text-blue-200 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            {item.note && isExpanded && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star size={12} className="text-yellow-400" />
                                <span className="text-xs text-yellow-300">{item.note}</span>
                              </div>
                            )}
                          </div>

                          {active && isExpanded && (
                            <ChevronRight size={16} className="text-white flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t border-white/10 transition-all duration-300 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300">Sistema OK</span>
              </div>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label={isExpanded ? "Contraer menú" : "Expandir menú"}
              >
                <ChevronRight 
                  size={16} 
                  className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}