import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { checkSystemHealth, SystemStatus } from '../services/health';
import { Loader2 } from 'lucide-react';

/**
 * Componente de indicador de estado.
 */
const StatusIndicator = ({ status, label }: { status: 'ok' | 'error' | 'loading'; label: string }) => {
  const baseClasses = "inline-flex items-center gap-2 text-sm";
  
  if (status === 'loading') {
    return (
      <span className={`${baseClasses} text-blue-200`}>
        <Loader2 size={14} className="animate-spin" />
        {label}: Cargando...
      </span>
    );
  }
  
  if (status === 'error') {
    return (
      <span className={`${baseClasses} text-red-300`}>
        <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        {label}: Error
      </span>
    );
  }

  return (
    <span className={`${baseClasses} text-green-200`}>
      <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>
      {label}: Conectado
    </span>
  );
};


/**
 * Componente de menú de navegación principal
 */
export default function NavigationMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({ api: 'loading', database: 'loading' });

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await checkSystemHealth();
      setSystemStatus(status);
    };
    fetchStatus();
  }, []);

  const menuItems = [
    {
      path: '/',
      label: '🏠 Inicio',
      description: 'Página principal y resumen del proyecto'
    },
    {
      path: '/crear',
      label: '✨ Crear Sopa de Letras',
      description: 'Asistente guiado para generar una nueva sopa de letras desde cero.'
    },
    {
      path: '/libros',
      label: '📚 Libros',
      description: 'Crear y gestionar libros completos con múltiples sopas de letras.'
    },
    {
      path: '/edicion',
      label: '🎨 Edición Avanzada',
      description: 'Editor gráfico para documentos personalizados y exportaciones.'
    },
    {
      path: '/panel-apis',
      label: '🔧 Panel de APIs',
      description: 'Herramientas de desarrollo y testing de las APIs del sistema.'
    }
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="bg-gradient-to-br from-indigo-700 to-purple-800 p-6 rounded-xl shadow-lg my-6 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-white text-center mb-3 tracking-tight">
          🧩 Generador de Sopas de Letras
        </h2>

        <p className="text-indigo-200 text-center mb-6 text-lg">
          Selecciona una sección para continuar
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                relative flex flex-col justify-between text-left p-6 rounded-xl transition-all duration-300
                focus:outline-none focus:ring-4 focus:ring-blue-400/50
                ${isActive(item.path)
                  ? 'bg-white/20 border border-indigo-300 shadow-md transform scale-105'
                  : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20'
                }
              `}
            >
              <div className={`h-1.5 rounded-full mb-4 ${
                isActive(item.path) ? 'bg-blue-300' : 'bg-gray-400'
              }`} />

              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                {item.label}
                {isActive(item.path) && (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white">
                    ACTUAL
                  </span>
                )}
              </h3>

              <p className="text-blue-200 text-sm mb-3 leading-relaxed">
                {item.description}
              </p>

            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-indigo-800/50 rounded-lg text-center border border-indigo-700">
          <h4 className="text-white font-bold mb-2">
            📋 Estado del Sistema
          </h4>
          <div className="flex justify-center gap-6 flex-wrap">
            <StatusIndicator status={systemStatus.api} label="Backend" />
            <StatusIndicator status={systemStatus.database} label="Base de Datos" />
          </div>
        </div>
      </div>
    </nav>
  )
}