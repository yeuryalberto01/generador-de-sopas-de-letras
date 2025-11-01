import { Construction } from 'lucide-react'

/**
 * Módulo de Diagramación - Página en desarrollo
 */
export default function Diagramacion() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Icono de construcción */}
        <div className="flex justify-center">
          <Construction className="w-24 h-24 text-orange-500" />
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Diagramación</h1>
          <p className="text-xl text-gray-600">Generador de Sopas de Letras</p>
        </div>

        {/* Mensaje de desarrollo */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-orange-800 mb-4">
            🚧 En Desarrollo 🚧
          </h2>
          <p className="text-orange-700 leading-relaxed">
            Esta funcionalidad está actualmente en desarrollo.
            Pronto podrás generar sopas de letras personalizadas a partir de tus temas.
          </p>
        </div>

        {/* Características futuras */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-lg mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximamente:</h3>
          <ul className="text-left space-y-2 text-gray-600">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Generación automática de sopas de letras
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Múltiples tamaños de grid (10x10, 15x15, 20x20)
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Niveles de dificultad ajustables
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Exportación a PDF e imágenes
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Vista previa con solución
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
