import { CheckCircle, Construction, Download, FileText, Globe, Puzzle, Settings } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'
import type { Tema } from '../../types'
import { exportPuzzle } from '../../utils/puzzleExporter'

interface DiagramacionProps {
  selectedTema?: Tema
}

/**
 * Módulo de Diagramación - Generador de Sopas de Letras
 */
const Diagramacion: FC<DiagramacionProps> = ({ selectedTema }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)

  const handleExport = async (format: 'text' | 'html') => {
    if (!selectedTema) return

    setIsGenerating(true)
    try {
      exportPuzzle(selectedTema, format, {
        title: `Sopa de Letras - ${selectedTema.nombre}`,
        includeHints: true,
        includeSolution: true
      })
      setLastGenerated(`${format.toUpperCase()} - ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      console.error('Error al exportar:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-full">
            <Puzzle className="h-10 w-10 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Diagramación</h1>
            <p className="text-xl text-secondary">Generador de Sopas de Letras</p>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de generación */}
          <div className="bg-secondary rounded-xl border border-primary shadow-lg p-6">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Download className="h-5 w-5 text-accent" />
              Generar Sopa de Letras
            </h3>

            {!selectedTema ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-tertiary rounded-full mb-4">
                  <Puzzle className="h-6 w-6 text-tertiary" />
                </div>
                <p className="text-secondary font-medium mb-2">Selecciona un tema primero</p>
                <p className="text-tertiary text-sm">
                  Ve a la sección de Temas y selecciona uno para generar tu sopa de letras
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tema seleccionado */}
                <div className="bg-primary rounded-lg border border-primary p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium text-primary">Tema seleccionado:</span>
                  </div>
                  <h4 className="text-lg font-semibold text-primary">{selectedTema.nombre}</h4>
                  {selectedTema.descripcion && (
                    <p className="text-secondary text-sm mt-1">{selectedTema.descripcion}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-tertiary">
                    <span>{selectedTema.palabras?.length || 0} palabras</span>
                    <span>•</span>
                    <span>Actualizado: {new Date(selectedTema.updated_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Opciones de exportación */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleExport('text')}
                    disabled={isGenerating}
                    className="flex items-center justify-center px-4 py-3 border border-primary rounded-lg shadow-sm text-sm font-medium text-primary bg-primary hover:bg-secondary smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generando...' : 'Exportar como TXT'}
                  </button>

                  <button
                    onClick={() => handleExport('html')}
                    disabled={isGenerating}
                    className="flex items-center justify-center px-4 py-3 border border-primary rounded-lg shadow-sm text-sm font-medium text-primary bg-primary hover:bg-secondary smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generando...' : 'Exportar como HTML'}
                  </button>
                </div>

                {/* Estado de última generación */}
                {lastGenerated && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Última exportación: {lastGenerated}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panel de información */}
          <div className="space-y-6">
            {/* Características disponibles */}
            <div className="bg-secondary rounded-xl border border-primary shadow-lg p-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" />
                Características
              </h3>
              <ul className="space-y-3 text-secondary">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Generación automática</span>
                    <p className="text-sm text-tertiary">Crea sopas de letras automáticamente con las palabras de tu tema</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Múltiples formatos</span>
                    <p className="text-sm text-tertiary">Exporta como texto plano o HTML imprimible</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Solución incluida</span>
                    <p className="text-sm text-tertiary">Cada exportación incluye pistas y la solución completa</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Próximas características */}
            <div className="bg-accent/5 rounded-xl border border-accent/20 p-6">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Construction className="h-5 w-5 text-orange-500" />
                Próximamente
              </h3>
              <ul className="space-y-2 text-secondary">
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-sm">Múltiples tamaños de grid (10x10, 15x15, 20x20)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-sm">Niveles de dificultad ajustables</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-sm">Exportación directa a PDF</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span className="text-sm">Vista previa interactiva con solución</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diagramacion
