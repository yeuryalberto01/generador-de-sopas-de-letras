# backend_fastapi/services/sopa_generator.py
import random
from typing import List, Dict, Optional
from enum import Enum

class Direction(Enum):
    HORIZONTAL = (0, 1)
    HORIZONTAL_INV = (0, -1)
    VERTICAL = (1, 0)
    VERTICAL_INV = (-1, 0)
    DIAGONAL = (1, 1)
    DIAGONAL_INV = (1, -1)
    ANTI_DIAGONAL = (-1, 1)
    ANTI_DIAGONAL_INV = (-1, -1)

ALL_DIRECTIONS = list(Direction)

def normalize_text(text: str) -> str:
    replacements = str.maketrans("ÁÉÍÓÚÑ", "AEIOUN")
    return text.upper().translate(replacements)

class WordSearchGenerator:
    def __init__(
        self,
        words: List[str],
        grid_size: Optional[int] = None,
        allow_diagonal: bool = True,
        allow_reverse: bool = True,
    ):
        self.original_words = [w.strip() for w in words if w.strip()]
        self.words = [normalize_text(w) for w in self.original_words]
        self.words = list(dict.fromkeys(self.words))  # eliminar duplicados

        if not self.words:
            raise ValueError("No hay palabras válidas")

        min_size = max(len(w) for w in self.words)
        self.grid_size = grid_size or max(16, min_size + 6)
        self.allow_diagonal = allow_diagonal
        self.allow_reverse = allow_reverse
        self.directions = self._build_directions()
        self.grid = None
        self.placed_words = []

    def _build_directions(self) -> List[Direction]:
        """Construir la lista de direcciones permitidas según la configuración."""
        directions = [Direction.HORIZONTAL, Direction.VERTICAL]

        if self.allow_diagonal:
            directions.extend([Direction.DIAGONAL, Direction.ANTI_DIAGONAL])

        if self.allow_reverse:
            directions.extend([Direction.HORIZONTAL_INV, Direction.VERTICAL_INV])
            if self.allow_diagonal:
                directions.extend([Direction.DIAGONAL_INV, Direction.ANTI_DIAGONAL_INV])

        return directions or [Direction.HORIZONTAL, Direction.VERTICAL]

    def can_place(self, word: str, row: int, col: int, direction: Direction) -> bool:
        dr, dc = direction.value
        for i, letter in enumerate(word):
            r = row + i * dr
            c = col + i * dc
            if not (0 <= r < self.grid_size and 0 <= c < self.grid_size):
                return False
            if self.grid[r][c] not in ("", letter):
                return False
        return True

    def place_word(self, word_normalized: str, original_word: str, row: int, col: int, direction: Direction):
        dr, dc = direction.value
        positions = []
        for i, letter in enumerate(word_normalized):
            r = row + i * dr
            c = col + i * dc
            self.grid[r][c] = letter
            positions.append((r, c))

        self.placed_words.append({
            "palabra": original_word,
            "inicio": (row, col),
            "fin": (row + (len(word_normalized)-1)*dr, col + (len(word_normalized)-1)*dc),
            "direccion": direction.name.replace("_", " ")
        })

    def generate(self) -> Dict:
        original_grid_size = self.grid_size
        max_attempts_per_size = 200
        max_grid_size = 100  # Sin límite práctico, máximo 100x100

        while self.grid_size <= max_grid_size:
            attempts = 0
            while attempts < max_attempts_per_size:
                self.grid = [["" for _ in range(self.grid_size)] for _ in range(self.grid_size)]
                self.placed_words = []  # Reset placed words for each attempt

                words_to_place = sorted(self.words, key=len, reverse=True)
                random.shuffle(words_to_place)

                if self._place_all_words(words_to_place):
                    self._fill_empty()
                    return {
                        "success": True,
                        "grid": self.grid,
                        "soluciones": self.placed_words,
                        "tamaño": self.grid_size,
                        "grid_size": self.grid_size,
                        "todas_colocadas": True
                    }
                attempts += 1

            # Si no se pudo con este tamaño, aumentar y continuar
            self.grid_size += 2

        # Si llegó aquí, no se pudo generar con ningún tamaño
        return {
            "success": False,
            "error": "No se pudieron colocar todas las palabras incluso con grid aumentado",
            "tamaño": self.grid_size,
            "grid_size": self.grid_size
        }

    def _place_all_words(self, words: List[str]) -> bool:
        if not self.directions:
            return False

        for idx, word_norm in enumerate(words):
            original = self.original_words[self.words.index(word_norm)]
            placed = False
            local_attempts = 0

            while local_attempts < 400 and not placed:
                direction = random.choice(self.directions)
                row = random.randint(0, self.grid_size - 1)
                col = random.randint(0, self.grid_size - 1)

                if self.can_place(word_norm, row, col, direction):
                    self.place_word(word_norm, original, row, col, direction)
                    placed = True
                local_attempts += 1

            if not placed:
                return False
        return True

    def _fill_empty(self):
        letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if not self.grid[i][j]:
                    self.grid[i][j] = random.choice(letters)
