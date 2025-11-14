import type { Tema } from '../types'

/**
 * Utilidades para exportar sopas de letras en diferentes formatos
 */

export interface PuzzleGrid {
  grid: string[][]
  words: Array<{
    word: string
    startRow: number
    startCol: number
    endRow: number
    endCol: number
    direction: 'horizontal' | 'vertical' | 'diagonal'
  }>
}

export interface ExportOptions {
  title?: string
  includeHints?: boolean
  includeSolution?: boolean
  gridSize?: number
  theme?: string
}

/**
 * Genera una sopa de letras básica a partir de un tema
 * Esta es una implementación simplificada - en producción se usaría un algoritmo más sofisticado
 */
export function generatePuzzle(tema: Tema, options: ExportOptions = {}): PuzzleGrid {
  const { gridSize = 15, includeHints = true } = options
  const words = [...tema.palabras].sort((a, b) => b.texto.length - a.texto.length) // Ordenar por longitud

  // Crear grid vacío
  const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''))

  // Llenar con letras aleatorias inicialmente
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    }
  }

  const placedWords: PuzzleGrid['words'] = []

  // Colocar palabras (implementación básica)
  words.forEach(word => {
    const upperWord = word.texto.toUpperCase()

    // Intentar colocar horizontalmente
    for (let attempts = 0; attempts < 50; attempts++) {
      const row = Math.floor(Math.random() * gridSize)
      const col = Math.floor(Math.random() * (gridSize - upperWord.length + 1))

      if (canPlaceWord(grid, upperWord, row, col, 0, 1)) {
        placeWord(grid, upperWord, row, col, 0, 1)
        placedWords.push({
          word: upperWord,
          startRow: row,
          startCol: col,
          endRow: row,
          endCol: col + upperWord.length - 1,
          direction: 'horizontal'
        })
        break
      }
    }
  })

  return { grid, words: placedWords }
}

/**
 * Verifica si una palabra puede colocarse en la posición especificada
 */
function canPlaceWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  deltaRow: number,
  deltaCol: number
): boolean {
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * deltaRow
    const col = startCol + i * deltaCol

    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
      return false
    }

    if (grid[row][col] !== '' && grid[row][col] !== word[i]) {
      return false
    }
  }
  return true
}

/**
 * Coloca una palabra en el grid
 */
function placeWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  deltaRow: number,
  deltaCol: number
): void {
  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * deltaRow
    const col = startCol + i * deltaCol
    grid[row][col] = word[i]
  }
}

/**
 * Exporta la sopa de letras como texto plano
 */
export function exportAsText(puzzle: PuzzleGrid, tema: Tema, options: ExportOptions = {}): string {
  const { title = `Sopa de Letras - ${tema.nombre}`, includeHints = true, includeSolution = false } = options

  let output = `${title}\n`
  output += '='.repeat(title.length) + '\n\n'

  if (tema.descripcion) {
    output += `${tema.descripcion}\n\n`
  }

  // Grid
  puzzle.grid.forEach(row => {
    output += row.join(' ') + '\n'
  })

  if (includeHints) {
    output += '\nPalabras a encontrar:\n'
    puzzle.words.forEach(({ word }) => {
      output += `- ${word}\n`
    })
  }

  if (includeSolution) {
    output += '\nSOLUCIÓN:\n'
    puzzle.words.forEach(({ word, startRow, startCol, endRow, endCol, direction }) => {
      output += `${word}: fila ${startRow + 1}, columna ${startCol + 1} (${direction})\n`
    })
  }

  return output
}

/**
 * Exporta como HTML para impresión/web
 */
export function exportAsHTML(puzzle: PuzzleGrid, tema: Tema, options: ExportOptions = {}): string {
  const { title = `Sopa de Letras - ${tema.nombre}`, includeHints = true, includeSolution = false } = options

  const gridHTML = puzzle.grid.map(row =>
    `<tr>${row.map(cell => `<td class="cell">${cell}</td>`).join('')}</tr>`
  ).join('')

  const hintsHTML = includeHints ? `
    <div class="hints">
      <h3>Palabras a encontrar:</h3>
      <ul>
        ${puzzle.words.map(({ word }) => `<li>${word}</li>`).join('')}
      </ul>
    </div>
  ` : ''

  const solutionHTML = includeSolution ? `
    <div class="solution">
      <h3>Solución:</h3>
      <ul>
        ${puzzle.words.map(({ word, startRow, startCol, direction }) =>
          `<li>${word}: fila ${startRow + 1}, columna ${startCol + 1} (${direction})</li>`
        ).join('')}
      </ul>
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; }
        .puzzle { border-collapse: collapse; margin: 20px 0; }
        .cell {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            font-weight: bold;
            min-width: 24px;
            min-height: 24px;
        }
        .hints, .solution { margin-top: 20px; }
        .hints ul, .solution ul { list-style-type: none; padding: 0; }
        .hints li, .solution li { margin: 5px 0; }
        @media print {
            body { margin: 0; }
            .cell { padding: 4px; font-size: 12px; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${tema.descripcion ? `<p>${tema.descripcion}</p>` : ''}
    <table class="puzzle">
        ${gridHTML}
    </table>
    ${hintsHTML}
    ${solutionHTML}
</body>
</html>
  `.trim()
}

/**
 * Descarga un archivo con el contenido especificado
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exporta y descarga la sopa de letras en el formato especificado
 */
export function exportPuzzle(
  tema: Tema,
  format: 'text' | 'html',
  options: ExportOptions = {}
): void {
  const puzzle = generatePuzzle(tema, options)

  const timestamp = new Date().toISOString().split('T')[0]
  const baseFilename = `${tema.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`

  if (format === 'text') {
    const content = exportAsText(puzzle, tema, options)
    downloadFile(content, `${baseFilename}.txt`)
  } else if (format === 'html') {
    const content = exportAsHTML(puzzle, tema, options)
    downloadFile(content, `${baseFilename}.html`, 'text/html')
  }
}