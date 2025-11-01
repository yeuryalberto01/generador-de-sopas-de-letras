"""
Backend FastAPI para el sistema de generación de sopas de letras

Este módulo proporciona una API REST para gestionar temas y palabras
para la generación de sopas de letras.
"""

# Standard library imports
import json
import os
import random
from datetime import datetime, timezone
from typing import Optional, List
from uuid import uuid4

# Third party imports
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Puzzle API")

# CORS opcional si no usas proxy de Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de persistencia
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TEMAS_FILE = os.path.join(DATA_DIR, "temas.json")

# Asegurar que el directorio de datos existe
os.makedirs(DATA_DIR, exist_ok=True)

# Variable global para temas (ahora con persistencia)
# NOTA: La inicialización se hace en load_temas(), no aquí
TEMAS = []


def load_temas():
    """Cargar temas desde archivo JSON."""
    # pylint: disable=global-statement
    global TEMAS
    try:
        if os.path.exists(TEMAS_FILE):
            with open(TEMAS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Convertir los datos del archivo a objetos TemaOut
                TEMAS = []
                for item in data:
                    TEMAS.append(TemaOut(**item))
                print(f"✅ Cargados {len(TEMAS)} temas desde {TEMAS_FILE}")
        else:
            TEMAS = []
            print(f"ℹ️  Archivo {TEMAS_FILE} no existe, iniciando con lista vacía")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"❌ Error al cargar temas: {e}")
        TEMAS = []


def save_temas():
    """Guardar temas en archivo JSON."""
    try:
        # Convertir objetos TemaOut a diccionarios para JSON
        data = [tema.dict() for tema in TEMAS]
        with open(TEMAS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"💾 Temas guardados en {TEMAS_FILE} ({len(TEMAS)} temas)")
    except (IOError, TypeError) as e:
        print(f"❌ Error al guardar temas: {e}")


class TemaIn(BaseModel):
    """Modelo de entrada para crear o actualizar un tema."""
    nombre: str
    descripcion: Optional[str] = ""
    words: Optional[List[str]] = []


class TemaOut(BaseModel):
    """Modelo de salida para representar un tema."""
    id: str
    nombre: str
    descripcion: Optional[str] = ""
    words: List[str] = []
    updated_at: str


# Inicializar TEMAS llamando a load_temas()
load_temas()


@app.get("/api/health")
def health():
    """Endpoint de salud para verificar que la API está funcionando."""
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/temas")
def list_temas():
    """Obtener lista de todos los temas ordenados por fecha de actualización."""
    return sorted(TEMAS, key=lambda x: x.updated_at, reverse=True)


@app.post("/api/temas")
def create_tema(tema_input: TemaIn):
    """Crear un nuevo tema."""
    if not tema_input.nombre or len(tema_input.nombre.strip()) < 2:
        raise HTTPException(status_code=422, detail="Nombre muy corto")

    # Verificar si ya existe un tema con el mismo nombre (case insensitive)
    if any(t.nombre.lower() == tema_input.nombre.strip().lower() for t in TEMAS):
        raise HTTPException(status_code=422, detail="Ya existe un tema con ese nombre")

    item = TemaOut(
        id=str(uuid4()),
        nombre=tema_input.nombre.strip(),
        descripcion=tema_input.descripcion or "",
        words=tema_input.words or [],
        updated_at=datetime.now(timezone.utc).isoformat()
    )
    TEMAS.append(item)
    save_temas()  # Guardar cambios
    return item


@app.put("/api/temas/{tema_id}")
def update_tema(tema_id: str, tema_input: TemaIn):
    """Actualizar un tema existente."""
    # Buscar el tema por ID
    tema_index = None
    for i, tema in enumerate(TEMAS):
        if tema.id == tema_id:
            tema_index = i
            break

    if tema_index is None:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    # Validar nombre
    if not tema_input.nombre or len(tema_input.nombre.strip()) < 2:
        raise HTTPException(status_code=422, detail="Nombre muy corto")

    # Verificar si ya existe otro tema con el mismo nombre (excluyendo el actual)
    for i, tema in enumerate(TEMAS):
        if i != tema_index and tema.nombre.lower() == tema_input.nombre.strip().lower():
            raise HTTPException(status_code=422, detail="Ya existe otro tema con ese nombre")

    # Actualizar tema
    TEMAS[tema_index] = TemaOut(
        id=tema_id,
        nombre=tema_input.nombre.strip(),
        descripcion=tema_input.descripcion or "",
        words=tema_input.words or TEMAS[tema_index].words,
        updated_at=datetime.now(timezone.utc).isoformat()
    )

    save_temas()  # Guardar cambios
    return TEMAS[tema_index]


@app.delete("/api/temas/{tema_id}")
def delete_tema(tema_id: str):
    """Eliminar un tema existente."""
    # Buscar el tema por ID
    tema_index = None
    for i, tema in enumerate(TEMAS):
        if tema.id == tema_id:
            tema_index = i
            break

    if tema_index is None:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    # Eliminar tema
    deleted_tema = TEMAS.pop(tema_index)
    save_temas()  # Guardar cambios
    return {"message": f"Tema '{deleted_tema.nombre}' eliminado correctamente"}


# Endpoints para gestión de palabras dentro de temas


class PalabraIn(BaseModel):
    """Modelo de entrada para una palabra."""
    palabra: str


@app.get("/api/temas/{tema_id}/palabras")
def get_palabras_tema(tema_id: str):
    """Obtener todas las palabras de un tema."""
    tema = next((t for t in TEMAS if t.id == tema_id), None)
    if not tema:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    return {"palabras": tema.words, "total": len(tema.words)}


@app.post("/api/temas/{tema_id}/palabras")
def add_palabra_tema(tema_id: str, palabra_data: PalabraIn):
    """Agregar una palabra a un tema."""
    tema_index = None
    for i, tema in enumerate(TEMAS):
        if tema.id == tema_id:
            tema_index = i
            break

    if tema_index is None:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    palabra = palabra_data.palabra.strip()
    if not palabra:
        raise HTTPException(status_code=422, detail="La palabra no puede estar vacía")

    # Verificar si la palabra ya existe (case insensitive)
    if any(p.lower() == palabra.lower() for p in TEMAS[tema_index].words):
        raise HTTPException(status_code=422, detail="La palabra ya existe en este tema")

    # Agregar palabra
    TEMAS[tema_index].words.append(palabra)
    TEMAS[tema_index].updated_at = datetime.now(timezone.utc).isoformat()

    save_temas()  # Guardar cambios

    return {
        "palabra": palabra,
        "index": len(TEMAS[tema_index].words) - 1,
        "total_palabras": len(TEMAS[tema_index].words)
    }


@app.put("/api/temas/{tema_id}/palabras/{index}")
def update_palabra_tema(tema_id: str, index: int, palabra_data: PalabraIn):
    """Actualizar una palabra específica en un tema."""
    tema_index = None
    for i, tema in enumerate(TEMAS):
        if tema.id == tema_id:
            tema_index = i
            break

    if tema_index is None:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    if index < 0 or index >= len(TEMAS[tema_index].words):
        raise HTTPException(status_code=404, detail="Índice de palabra no válido")

    palabra = palabra_data.palabra.strip()
    if not palabra:
        raise HTTPException(status_code=422, detail="La palabra no puede estar vacía")

    # Verificar si la palabra ya existe en otras posiciones (case insensitive)
    for i, p in enumerate(TEMAS[tema_index].words):
        if i != index and p.lower() == palabra.lower():
            raise HTTPException(status_code=422, detail="La palabra ya existe en este tema")

    # Actualizar palabra
    old_palabra = TEMAS[tema_index].words[index]
    TEMAS[tema_index].words[index] = palabra
    TEMAS[tema_index].updated_at = datetime.now(timezone.utc).isoformat()

    save_temas()  # Guardar cambios

    return {
        "old_palabra": old_palabra,
        "new_palabra": palabra,
        "index": index
    }


@app.delete("/api/temas/{tema_id}/palabras/{index}")
def delete_palabra_tema(tema_id: str, index: int):
    """Eliminar una palabra específica de un tema."""
    tema_index = None
    for i, tema in enumerate(TEMAS):
        if tema.id == tema_id:
            tema_index = i
            break

    if tema_index is None:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    if index < 0 or index >= len(TEMAS[tema_index].words):
        raise HTTPException(status_code=404, detail="Índice de palabra no válido")

    # Eliminar palabra
    deleted_palabra = TEMAS[tema_index].words.pop(index)
    TEMAS[tema_index].updated_at = datetime.now(timezone.utc).isoformat()

    save_temas()  # Guardar cambios

    return {
        "deleted_palabra": deleted_palabra,
        "index": index,
        "remaining_palabras": len(TEMAS[tema_index].words)
    }


@app.put("/api/temas/{tema_id}/palabras")
def replace_palabras_tema(tema_id: str, palabras_data: dict):
    """Reemplazar todas las palabras de un tema."""
    tema_index = None
    for i, tema in enumerate(TEMAS):
        if tema.id == tema_id:
            tema_index = i
            break

    if tema_index is None:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    palabras = palabras_data.get("palabras", [])
    if not isinstance(palabras, list):
        raise HTTPException(status_code=422, detail="Las palabras deben ser una lista")

    # Validar palabras
    cleaned_palabras = []
    seen = set()
    for palabra in palabras:
        if not isinstance(palabra, str):
            raise HTTPException(status_code=422, detail="Todas las palabras deben ser strings")
        cleaned = palabra.strip()
        if not cleaned:
            continue  # Ignorar palabras vacías
        lower_cleaned = cleaned.lower()
        if lower_cleaned in seen:
            raise HTTPException(status_code=422, detail=f"Palabra duplicada: {cleaned}")
        seen.add(lower_cleaned)
        cleaned_palabras.append(cleaned)

    # Reemplazar palabras
    old_count = len(TEMAS[tema_index].words)
    TEMAS[tema_index].words = cleaned_palabras
    TEMAS[tema_index].updated_at = datetime.now(timezone.utc).isoformat()

    save_temas()  # Guardar cambios

    return {
        "old_count": old_count,
        "new_count": len(cleaned_palabras),
        "palabras": cleaned_palabras
    }


# ==================== DIAGRAMACIÓN ====================

class PuzzleRequest(BaseModel):
    """Modelo para solicitud de generación de sopa de letras."""
    tema_id: str
    grid_size: str = "15x15"  # Formato: "NxM"
    difficulty: str = "medium"  # "easy", "medium", "hard"

class WordPosition(BaseModel):
    """Modelo para posición de una palabra en el grid."""
    word: str
    start_row: int
    start_col: int
    end_row: int
    end_col: int
    direction: str  # "horizontal", "vertical", "diagonal"

class PuzzleResponse(BaseModel):
    """Modelo para respuesta de sopa de letras generada."""
    id: str
    tema_id: str
    tema_nombre: str
    grid: List[List[str]]
    words: List[str]
    word_positions: List[WordPosition]
    grid_size: str
    difficulty: str
    created_at: str

def generate_word_search(words: List[str], grid_size: str, difficulty: str) -> dict:
    """
    Genera una sopa de letras básica.

    Args:
        words: Lista de palabras a incluir
        grid_size: Tamaño del grid en formato "NxM"
        difficulty: Nivel de dificultad

    Returns:
        Diccionario con el puzzle generado
    """
    # Parsear tamaño del grid
    width, height = map(int, grid_size.split('x'))

    # Crear grid vacío
    grid = [['' for _ in range(width)] for _ in range(height)]

    # Limitar palabras según dificultad
    max_words = {'easy': 5, 'medium': 8, 'hard': 12}[difficulty]
    selected_words = words[:max_words]

    word_positions = []

    # Algoritmo simple de colocación (se puede mejorar significativamente)
    directions = [
        (0, 1),   # horizontal derecha
        (1, 0),   # vertical abajo
        (1, 1),   # diagonal abajo-derecha
    ]

    placed_words = []

    for word in selected_words:
        word = word.upper()
        placed = False

        # Intentar colocar la palabra en posiciones aleatorias
        for attempt in range(100):  # Máximo 100 intentos por palabra
            # Elegir dirección aleatoria
            direction = directions[attempt % len(directions)]

            # Elegir posición inicial aleatoria
            start_row = (attempt // 10 % (height - len(word) + 1)
                        if direction[0] else attempt // 10 % height)
            start_col = attempt % (width - len(word) + 1) if direction[1] else attempt % width

            # Verificar si cabe
            end_row = start_row + (len(word) - 1) * direction[0]
            end_col = start_col + (len(word) - 1) * direction[1]

            if end_row >= height or end_col >= width:
                continue

            # Verificar que no haya conflicto
            conflict = False
            for i, letter in enumerate(word):
                row = start_row + i * direction[0]
                col = start_col + i * direction[1]
                existing = grid[row][col]
                if existing and existing != letter:
                    conflict = True
                    break

            if not conflict:
                # Colocar la palabra
                for i, letter in enumerate(word):
                    row = start_row + i * direction[0]
                    col = start_col + i * direction[1]
                    grid[row][col] = letter

                # Registrar posición
                direction_name = {
                    (0, 1): "horizontal",
                    (1, 0): "vertical",
                    (1, 1): "diagonal"
                }[direction]

                word_positions.append({
                    "word": word,
                    "start_row": start_row,
                    "start_col": start_col,
                    "end_row": end_row,
                    "end_col": end_col,
                    "direction": direction_name
                })

                placed_words.append(word)
                placed = True
                break

        if not placed:
            # Si no se pudo colocar, continuar con la siguiente palabra
            continue

    # Llenar espacios vacíos con letras aleatorias
    for row in range(height):
        for col in range(width):
            if not grid[row][col]:
                grid[row][col] = chr(random.randint(65, 90))  # A-Z

    return {
        "grid": grid,
        "words": placed_words,
        "word_positions": word_positions,
        "grid_size": grid_size,
        "difficulty": difficulty
    }

@app.post("/api/diagramacion/generate", response_model=PuzzleResponse)
async def generate_puzzle(request: PuzzleRequest):
    """
    Genera una sopa de letras basada en un tema.

    - **tema_id**: ID del tema a usar
    - **grid_size**: Tamaño del grid (ej: "15x15")
    - **difficulty**: Dificultad ("easy", "medium", "hard")
    """
    # Validar que el tema existe
    tema = None
    for t in TEMAS:
        if t.id == request.tema_id:
            tema = t
            break

    if not tema:
        raise HTTPException(status_code=404, detail="Tema no encontrado")

    if not tema.words or len(tema.words) == 0:
        raise HTTPException(status_code=422, detail="El tema no tiene palabras")

    # Generar puzzle
    puzzle_data = generate_word_search(tema.words, request.grid_size, request.difficulty)

    # Crear respuesta
    response = PuzzleResponse(
        id=str(uuid4()),
        tema_id=request.tema_id,
        tema_nombre=tema.nombre,
        grid=puzzle_data["grid"],
        words=puzzle_data["words"],
        word_positions=[WordPosition(**pos) for pos in puzzle_data["word_positions"]],
        grid_size=request.grid_size,
        difficulty=request.difficulty,
        created_at=datetime.now(timezone.utc).isoformat()
    )

    return response
