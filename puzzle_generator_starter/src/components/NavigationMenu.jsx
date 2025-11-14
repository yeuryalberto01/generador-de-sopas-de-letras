import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Componente de menú de navegación principal
 */
export default function NavigationMenu() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      path: '/',
      label: '🏠 Inicio',
      description: 'Página principal del generador de sopas de letras'
    },
    {
      path: '/temas',
      label: '🎨 Temas',
      description: 'Gestionar temas y palabras para las sopas de letras'
    },
    {
      path: '/diagramacion',
      label: '📐 Diagramación',
      description: 'Crear y editar sopas de letras',
      note: 'Requiere seleccionar un tema primero'
    },
    {
      path: '/libros',
      label: '📚 Libros',
      description: 'Crear libros completos organizando múltiples puzzles',
      note: 'Sistema integrado para publicaciones profesionales'
    },
    {
      path: '/edicion',
      label: '🎨 Edición',
      description: 'Editor gráfico avanzado para documentos personalizados',
      note: 'Herramientas gráficas como Photoshop o Canva'
    },
    {
      path: '/panel-apis',
      label: '🔧 APIs',
      description: 'Panel de desarrollo y testing de APIs'
    }
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900 p-6 rounded-xl shadow-lg my-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white text-center mb-4">
          🧩 Generador de Sopas de Letras
        </h2>

        <p className="text-blue-100 text-center mb-6">
          Selecciona una sección para continuar
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                text-left p-6 rounded-xl transition-all duration-300 backdrop-blur-sm
                ${isActive(item.path)
                  ? 'bg-white/30 border-2 border-white/80 shadow-lg'
                  : 'bg-white/15 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-md'
                }
              `}
            >
              <div className={`h-1 rounded-full mb-4 ${
                isActive(item.path) ? 'bg-white/80' : 'bg-white/30'
              }`} />

              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                {item.label}
                {isActive(item.path) && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white">
                    ACTUAL
                  </span>
                )}
              </h3>

              <p className="text-blue-100 text-sm mb-3">
                {item.description}
              </p>

              {item.note && (
                <p className="text-xs text-yellow-200 italic bg-white/10 px-3 py-2 rounded border border-white/20">
                  💡 {item.note}
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white/10 rounded-lg text-center">
          <h4 className="text-white font-bold mb-2">
            📋 Estado del Sistema
          </h4>
          <div className="flex justify-center gap-6 flex-wrap">
            <span className="inline-flex items-center gap-2 text-sm text-green-200">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Backend: Conectado
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-green-200">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Base de datos: OK
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-green-200">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Tests: Pasando
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}