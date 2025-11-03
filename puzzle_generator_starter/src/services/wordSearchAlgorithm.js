/**
 * Algoritmo optimizado para generar sopas de letras
 * Basado en técnicas de backtracking y heurísticas
 */

export const DIRECTIONS = {
  HORIZONTAL: { dx: 1, dy: 0, name: 'horizontal' },
  VERTICAL: { dx: 0, dy: 1, name: 'vertical' },
  DIAGONAL_DOWN: { dx: 1, dy: 1, name: 'diagonal-down' },
  DIAGONAL_UP: { dx: 1, dy: -1, name: 'diagonal-up' },
  HORIZONTAL_REVERSE: { dx: -1, dy: 0, name: 'horizontal-reverse' },
  VERTICAL_REVERSE: { dx: 0, dy: -1, name: 'vertical-reverse' },
  DIAGONAL_DOWN_REVERSE: { dx: -1, dy: -1, name: 'diagonal-down-reverse' },
  DIAGONAL_UP_REVERSE: { dx: -1, dy: 1, name: 'diagonal-up-reverse' }
};

class WordSearchGenerator {
  constructor(rows, cols, options = {}) {
    this.rows = rows;
    this.cols = cols;
    this.grid = this.createEmptyGrid();
    this.placedWords = [];
    this.options = {
      allowReverse: options.allowReverse ?? true,
      allowDiagonal: options.allowDiagonal ?? true,
      minWordLength: options.minWordLength ?? 3,
      maxAttempts: options.maxAttempts ?? 200,
      fillWithRandom: options.fillWithRandom ?? true,
      ...options
    };
  }

  createEmptyGrid() {
    return Array(this.rows).fill(null).map(() =>
      Array(this.cols).fill(null).map(() => ({
        letter: '',
        isWord: false,
        wordIds: []
      }))
    );
  }

  getAvailableDirections() {
    const directions = [
      DIRECTIONS.HORIZONTAL,
      DIRECTIONS.VERTICAL
    ];

    if (this.options.allowDiagonal) {
      directions.push(DIRECTIONS.DIAGONAL_DOWN, DIRECTIONS.DIAGONAL_UP);
    }

    if (this.options.allowReverse) {
      directions.push(
        DIRECTIONS.HORIZONTAL_REVERSE,
        DIRECTIONS.VERTICAL_REVERSE
      );
      if (this.options.allowDiagonal) {
        directions.push(
          DIRECTIONS.DIAGONAL_DOWN_REVERSE,
          DIRECTIONS.DIAGONAL_UP_REVERSE
        );
      }
    }

    return directions;
  }

  canPlaceWord(word, row, col, direction) {
    const wordText = word.toUpperCase();

    for (let i = 0; i < wordText.length; i++) {
      const newRow = row + (direction.dy * i);
      const newCol = col + (direction.dx * i);

      // Verificar límites
      if (newRow < 0 || newRow >= this.rows || newCol < 0 || newCol >= this.cols) {
        return false;
      }

      const cell = this.grid[newRow][newCol];

      // Si hay una letra y no coincide, no se puede colocar
      if (cell.letter !== '' && cell.letter !== wordText[i]) {
        return false;
      }
    }

    return true;
  }

  placeWord(word, wordId, row, col, direction) {
    const wordText = word.toUpperCase();
    const positions = [];

    for (let i = 0; i < wordText.length; i++) {
      const newRow = row + (direction.dy * i);
      const newCol = col + (direction.dx * i);

      this.grid[newRow][newCol].letter = wordText[i];
      this.grid[newRow][newCol].isWord = true;
      this.grid[newRow][newCol].wordIds.push(wordId);

      positions.push({ row: newRow, col: newCol, letter: wordText[i] });
    }

    return positions;
  }

  findBestPlacement(word, _wordId) {
    const wordText = word.toUpperCase();
    const directions = this.getAvailableDirections();
    const candidates = [];

    // Buscar todas las posiciones posibles
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        for (const direction of directions) {
          if (this.canPlaceWord(wordText, row, col, direction)) {
            // Calcular score (preferir posiciones con letras compartidas)
            let score = 0;
            let sharedLetters = 0;

            for (let i = 0; i < wordText.length; i++) {
              const newRow = row + (direction.dy * i);
              const newCol = col + (direction.dx * i);
              if (this.grid[newRow][newCol].letter === wordText[i]) {
                sharedLetters++;
                score += 10; // Bonus por compartir letras
              }
            }

            // Preferir posiciones más centrales
            const centerRow = this.rows / 2;
            const centerCol = this.cols / 2;
            const distanceFromCenter = Math.sqrt(
              Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2)
            );
            score -= distanceFromCenter * 0.5;

            candidates.push({
              row,
              col,
              direction,
              score,
              sharedLetters
            });
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // Ordenar por score y seleccionar el mejor
    candidates.sort((a, b) => b.score - a.score);

    // Añadir algo de aleatoriedad para variedad
    const topCandidates = candidates.slice(0, Math.min(5, candidates.length));
    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }

  generate(words) {
    // Ordenar palabras por longitud (más largas primero)
    const sortedWords = [...words]
      .filter(w => w.texto.length >= this.options.minWordLength)
      .sort((a, b) => b.texto.length - a.texto.length);

    // Intentar colocar cada palabra
    sortedWords.forEach((word, index) => {
      let attempts = 0;
      let placed = false;

      while (!placed && attempts < this.options.maxAttempts) {
        attempts++;

        const placement = this.findBestPlacement(word.texto, index);

        if (placement) {
          const positions = this.placeWord(
            word.texto,
            index,
            placement.row,
            placement.col,
            placement.direction
          );

          this.placedWords.push({
            id: index,
            text: word.texto.toUpperCase(),
            originalText: word.texto,
            startRow: placement.row,
            startCol: placement.col,
            direction: placement.direction.name,
            positions,
            attempts
          });

          placed = true;
        }
      }

      if (!placed) {
        // Palabra no pudo ser colocada después de maxAttempts intentos
      }
    });

    // Rellenar espacios vacíos
    if (this.options.fillWithRandom) {
      this.fillEmptySpaces();
    }

    return {
      grid: this.grid,
      placedWords: this.placedWords,
      stats: {
        totalWords: words.length,
        placedWords: this.placedWords.length,
        successRate: (this.placedWords.length / words.length) * 100
      }
    };
  }

  fillEmptySpaces() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Opcionalmente usar letras de las palabras colocadas para mayor dificultad
    let availableLetters = alphabet;

    if (this.options.useWordLetters) {
      const usedLetters = new Set();
      this.placedWords.forEach(word => {
        word.text.split('').forEach(letter => usedLetters.add(letter));
      });
      availableLetters = Array.from(usedLetters).join('');
    }

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col].letter === '') {
          const randomLetter = availableLetters[
            Math.floor(Math.random() * availableLetters.length)
          ];
          this.grid[row][col].letter = randomLetter;
        }
      }
    }
  }

  getGridAsString() {
    return this.grid.map(row =>
      row.map(cell => cell.letter).join(' ')
    ).join('\n');
  }
}

export default WordSearchGenerator;