import { Download, Eye, EyeOff, Grid, Play, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useToast } from '../../hooks/useToast'
import { temasService } from '../../services/temas'

/**
 * Módulo de Diagramación - Generador de Sopas de Letras
 */
export default function Diagramacion() {
  const { showToast } = useToast()

  // Estados principales
  const [temas, setTemas] = useState([])
  const [selectedTema, setSelectedTema] = useState('')
  const [gridSize, setGridSize] = useState('15x15')
  const [difficulty, setDifficulty] = useState('medium')
  const [puzzle, setPuzzle] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  // Cargar temas al montar el componente
  useEffect(() => {
    loadTemas()
  }, [loadTemas])

  const loadTemas = useCallback(async () => {
    try {
      const temasData = await temasService.getTemas()
      setTemas(temasData)
    } catch (error) {
      showToast('Error al cargar temas', 'error')
    }
  }, [showToast])

  // Generar sopa de letras
  const generatePuzzle = useCallback(async () => {
    if (!selectedTema) {
      showToast('Selecciona un tema primero', 'warning')
      return
    }

    setIsGenerating(true)
    try {
      // Obtener palabras del tema seleccionado
      const tema = temas.find(t => t.id === selectedTema)
      if (!tema || !tema.words || tema.words.length === 0) {
        showToast('El tema seleccionado no tiene palabras', 'warning')
        return
      }

      // Llamar al servicio de generación (por ahora simulado)
      const generatedPuzzle = await generateWordSearch(tema.words, gridSize, difficulty)
      setPuzzle(generatedPuzzle)
      showToast('Sopa de letras generada exitosamente', 'success')
    } catch (error) {
      showToast('Error al generar la sopa de letras', 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTema, temas, gridSize, difficulty, showToast])

  // Función simulada para generar sopa de letras (se reemplazará con algoritmo real)
  const generateWordSearch = async (words, size, diff) => {
    // Simulación básica - en producción esto sería un algoritmo complejo
    const [width, height] = size.split('x').map(Number)

    // Crear grid vacío
    const grid = Array(height).fill().map(() => Array(width).fill(''))

    // Posiciones de palabras (simulado)
    const wordPositions = []

    // Llenar con letras aleatorias donde no hay palabras
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!grid[y][x]) {
          grid[y][x] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        }
      }
    }

    return {
      grid,
      words: words.slice(0, Math.min(words.length, 10)), // Máximo 10 palabras por ahora
      wordPositions,
      size: { width, height },
      difficulty: diff
    }
  }

  const regeneratePuzzle = useCallback(() => {
    generatePuzzle()
  }, [generatePuzzle])

  const exportPuzzle = useCallback(() => {
    if (!puzzle) return

    // Exportar como JSON (se puede extender para PDF, imagen, etc.)
    const exportData = {
      ...puzzle,
      exportedAt: new Date().toISOString(),
      tema: temas.find(t => t.id === selectedTema)?.nombre
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sopa-letras-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showToast('Sopa de letras exportada', 'success')
  }, [puzzle, selectedTema, temas, showToast])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diagramación</h1>
          <p className="text-gray-600">Genera sopas de letras a partir de tus temas</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Grid className="w-4 h-4 mr-2" />
          Generador de Sopas de Letras
        </Badge>
      </div>

      {/* Controles de Generación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Play className="w-5 h-5 mr-2" />
            Configuración de Generación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Selector de Tema */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tema</label>
              <Select value={selectedTema} onValueChange={setSelectedTema}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  {temas.map(tema => (
                    <SelectItem key={tema.id} value={tema.id}>
                      {tema.nombre} ({tema.words?.length || 0} palabras)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tamaño del Grid */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tamaño del Grid</label>
              <Select value={gridSize} onValueChange={setGridSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10x10">10x10 (Fácil)</SelectItem>
                  <SelectItem value="15x15">15x15 (Medio)</SelectItem>
                  <SelectItem value="20x20">20x20 (Difícil)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dificultad */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dificultad</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={generatePuzzle}
              disabled={isGenerating || !selectedTema}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Generar Sopa de Letras
                </>
              )}
            </Button>

            {puzzle && (
              <>
                <Button variant="outline" onClick={regeneratePuzzle}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerar
                </Button>
                <Button variant="outline" onClick={exportPuzzle}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSolution(!showSolution)}
                >
                  {showSolution ? (
                    <><EyeOff className="w-4 h-4 mr-2" /> Ocultar</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-2" /> Solución</>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista Previa de la Sopa de Letras */}
      {puzzle && (
        <Card>
          <CardHeader>
            <CardTitle>Sopa de Letras Generada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Información del Puzzle */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>Tema: <strong>{temas.find(t => t.id === selectedTema)?.nombre}</strong></span>
                <span>Tamaño: <strong>{gridSize}</strong></span>
                <span>Dificultad: <strong>{difficulty}</strong></span>
                <span>Palabras: <strong>{puzzle.words.length}</strong></span>
              </div>

              {/* Grid de la Sopa de Letras */}
              <div className="flex justify-center">
                <div
                  className="grid gap-1 p-4 bg-gray-50 rounded-lg border"
                  style={{
                    gridTemplateColumns: `repeat(${puzzle.size.width}, minmax(0, 1fr))`,
                    maxWidth: '600px'
                  }}
                >
                  {puzzle.grid.flat().map((letter, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded text-sm font-mono font-bold text-gray-800"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>

              {/* Lista de Palabras a Encontrar */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Palabras a encontrar:</h3>
                <div className="flex flex-wrap gap-2">
                  {puzzle.words.map((word, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {word}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay puzzle generado */}
      {!puzzle && !isGenerating && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Grid className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay sopa de letras generada</h3>
            <p>Selecciona un tema y configura los parámetros para generar tu primera sopa de letras.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
