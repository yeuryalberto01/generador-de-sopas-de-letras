¡Excelente pregunta! Ahora que hemos actualizado los modelos de SQLAlchemy en `database.py` y los esquemas Pydantic en `schemas.py` para soportar el almacenamiento del layout de las páginas (vía `contenido_json`) y la referencia a archivos externos (vía `url_o_ruta`), el siguiente paso es **crear los endpoints en tu backend de FastAPI (`main.py`) para interactuar con estos nuevos campos y funcionalidades.**

La base de datos ya está "preparada" para almacenar la información de los gráficos y la estructura editable de las páginas. Ahora necesitamos las "puertas de entrada y salida" (los endpoints de la API) para que el frontend pueda guardar y recuperar esa información.

### **Fase 2: Implementación de Endpoints CRUD y Subida de Archivos en FastAPI (`main.py`)**

Vamos a crear los endpoints necesarios para:

1.  **Gestionar `PaginaLibro`:** Crear, leer, actualizar y eliminar páginas, incluyendo el campo `contenido_json`.
2.  **Subida de Archivos:** Permitir al frontend subir imágenes u otros recursos y que el backend los guarde en el servidor, devolviendo su URL. Esto se vinculará con `RecursoPagina` y `RecursoTema`.

---

**Paso 1: Configuración de Almacenamiento de Archivos Estáticos**

Primero, necesitas una carpeta en tu proyecto de FastAPI donde se guardarán los archivos subidos (imágenes, etc.) y desde donde FastAPI los servirá como archivos estáticos.

**Modifica `puzzle_generator_starter/backend_fastapi/main.py`:**

Asegúrate de tener la configuración para servir archivos estáticos. Si no la tienes, añade esto al principio de tu `main.py`:

```python
# puzzle_generator_starter/backend_fastapi/main.py

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import shutil # Para mover archivos subidos
from fastapi.staticfiles import StaticFiles # Para servir archivos estáticos
from starlette.middleware.cors import CORSMiddleware # Para permitir CORS si el frontend está en otro puerto

from . import models, schemas # Tus modelos y esquemas
from .database import engine, get_db, init_database # Tu configuración de base de datos

app = FastAPI()

# Configuración CORS para permitir la comunicación con tu frontend de React
# Si tu frontend está en http://localhost:3000
origins = [
    "http://localhost",
    "http://localhost:3000", # ¡Asegúrate de que este sea el puerto de tu frontend de React!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuración para servir archivos estáticos ---
# Directorio donde se guardarán los archivos subidos
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True) # Crea el directorio si no existe

# Montar el directorio 'static' para que FastAPI sirva su contenido
# Esto hará que http://localhost:8000/static/uploads/mi_imagen.png sea accesible
app.mount("/static", StaticFiles(directory="static"), name="static")


# Evento de inicio para inicializar la base de datos
@app.on_event("startup")
def on_startup():
    print("Inicializando base de datos...")
    init_database()
    print("Base de datos inicializada.")

# ... Tus rutas existentes para /api/temas y /api/db/temas
# ... Tus rutas existentes para /api/db/libros
```

---

**Paso 2: Crear Endpoints para `PaginaLibro` (CRUD)**

Estos endpoints te permitirán crear, obtener, actualizar y eliminar páginas de un libro, y serán cruciales para el editor visual.

**Añadir al final de `puzzle_generator_starter/backend_fastapi/main.py`:**

```python
# puzzle_generator_starter/backend_fastapi/main.py (continuación)

# =========================================================
# Endpoints para PaginaLibro
# =========================================================

# Crear una nueva página para un libro
@app.post("/api/db/libros/{libro_id}/paginas/", response_model=schemas.PaginaLibro, status_code=status.HTTP_201_CREATED)
def create_pagina_libro(
    libro_id: int,
    pagina: schemas.PaginaLibroCreate,
    db: Session = Depends(get_db)
):
    db_libro = db.query(models.Libro).filter(models.Libro.id == libro_id).first()
    if not db_libro:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    db_pagina = models.PaginaLibro(**pagina.dict(), libro_id=libro_id)
    db.add(db_pagina)
    db.commit()
    db.refresh(db_pagina)

    # Actualizar paginas_totales del libro (opcional, pero buena práctica)
    db_libro.paginas_totales = len(db_libro.paginas) # Esto contará todas las páginas relacionadas
    db.commit()
    db.refresh(db_libro)

    return db_pagina

# Obtener todas las páginas de un libro
@app.get("/api/db/libros/{libro_id}/paginas/", response_model=List[schemas.PaginaLibro])
def get_paginas_libro(
    libro_id: int,
    db: Session = Depends(get_db)
):
    db_libro = db.query(models.Libro).filter(models.Libro.id == libro_id).first()
    if not db_libro:
        raise HTTPException(status_code=404, detail="Libro no encontrado")

    # Cargar las páginas con sus temas si es necesario
    return db_libro.paginas

# Obtener una página específica por ID
@app.get("/api/db/paginas/{pagina_id}", response_model=schemas.PaginaLibro)
def get_pagina_libro(
    pagina_id: int,
    db: Session = Depends(get_db)
):
    db_pagina = db.query(models.PaginaLibro).filter(models.PaginaLibro.id == pagina_id).first()
    if not db_pagina:
        raise HTTPException(status_code=404, detail="Página no encontrada")
    return db_pagina

# Actualizar una página
@app.put("/api/db/paginas/{pagina_id}", response_model=schemas.PaginaLibro)
def update_pagina_libro(
    pagina_id: int,
    pagina: schemas.PaginaLibroUpdate,
    db: Session = Depends(get_db)
):
    db_pagina = db.query(models.PaginaLibro).filter(models.PaginaLibro.id == pagina_id).first()
    if not db_pagina:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    for key, value in pagina.dict(exclude_unset=True).items():
        setattr(db_pagina, key, value)

    db.commit()
    db.refresh(db_pagina)
    return db_pagina

# Eliminar una página
@app.delete("/api/db/paginas/{pagina_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pagina_libro(
    pagina_id: int,
    db: Session = Depends(get_db)
):
    db_pagina = db.query(models.PaginaLibro).filter(models.PaginaLibro.id == pagina_id).first()
    if not db_pagina:
        raise HTTPException(status_code=404, detail="Página no encontrada")

    db.delete(db_pagina)
    db.commit()
    return {"message": "Página eliminada exitosamente"}

```

---

**Paso 3: Crear Endpoint para Subida de Archivos**

Este endpoint permitirá que el frontend suba imágenes (o cualquier archivo) al servidor y reciba una URL para acceder a ellos.

**Añadir al final de `puzzle_generator_starter/backend_fastapi/main.py`:**

```python
# puzzle_generator_starter/backend_fastapi/main.py (continuación)

# =========================================================
# Endpoint para Subida de Archivos
# =========================================================

@app.post("/api/upload-file/", response_model=Dict[str, str])
async def upload_file(file: UploadFile = File(...)):
    try:
        # Generar un nombre de archivo único para evitar colisiones
        # Esto es una simplificación, en producción usarías UUIDs
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{os.urandom(8).hex()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Guardar el archivo en el sistema de archivos
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Construir la URL pública del archivo
        # Asumiendo que FastAPI está en http://localhost:8000 y el directorio estático es '/static'
        # La URL será http://localhost:8000/static/uploads/unique_filename.ext
        file_url = f"/static/uploads/{unique_filename}"

        return {"filename": unique_filename, "url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir el archivo: {str(e)}")

# =========================================================
# Endpoint para Generación de Sopa de Letras (¡Mover lógica aquí!)
# =========================================================
# Este endpoint es conceptual por ahora, aquí es donde moveremos la lógica
# de src/services/wordSearchAlgorithm.js del frontend al backend.
# Lo implementaremos en una fase posterior.

class GenerateWordSearchRequest(BaseModel):
    words: List[str]
    width: int = 15
    height: int = 15
    difficulty: str = "Normal" # Fácil, Normal, Difícil

@app.post("/api/diagramacion/generate/", response_model=Dict[str, Any])
def generate_wordsearch_backend(request: GenerateWordSearchRequest):
    # TODO: Implementar aquí la lógica de generación de la sopa de letras.
    # Por ahora, es un placeholder.
    # Podrías llamar a una función que contenga el algoritmo o reescribir
    # tu WordSearchGenerator de JS a Python.
    print(f"Generando sopa de letras con: {request.words}, {request.width}x{request.height}, {request.difficulty}")
    # Ejemplo de respuesta
    return {
        "grid": [["A", "B"], ["C", "D"]], # La grilla de la sopa de letras
        "placed_words": [{"word": "AB", "start_x": 0, "start_y": 0, "direction": "horizontal"}],
        "unplaced_words": []
    }

```

---

### **Cómo Probar y Continuar:**

1.  **Guarda todos los cambios** en `main.py`.
2.  **Reinicia tu servidor FastAPI:**
    ```bash
    cd puzzle_generator_starter/backend_fastapi
    python main.py
    ```
    Asegúrate de que no haya errores de sintaxis y que se inicie correctamente. Deberías ver los mensajes de inicialización de la base de datos y de que FastAPI está corriendo.
3.  **Verifica los Nuevos Endpoints:**
    *   **Subida de archivos:** Puedes usar una herramienta como Postman, Insomnia, o incluso la interfaz de Swagger UI de FastAPI (`http://localhost:8000/docs`) para probar el endpoint `/api/upload-file/`. Sube una imagen y verifica que se guarda en `backend_fastapi/static/uploads` y que obtienes una URL.
    *   **`PaginaLibro`:** También puedes probar los endpoints de `PaginaLibro` a través de Swagger UI.

Ahora tu backend está mucho mejor preparado. Tienes:
*   Modelos de DB que soportan el diseño de páginas JSON y referencias a archivos.
*   Endpoints CRUD para `PaginaLibro`.
*   Un endpoint para subir archivos y servirlos estáticamente.
*   Un placeholder para mover el algoritmo de generación de sopa de letras al backend.

El siguiente paso lógico sería ir al **frontend (React/Vite)** y empezar a construir la interfaz para:

1.  **Crear Libros:** Con un formulario que use estos nuevos endpoints.
2.  **Añadir Páginas a Libros:** Con la capacidad de subir imágenes o referenciar temas.
3.  **El Editor Visual:** Empezar a integrar una librería como `Fabric.js` o `Konva.js` en React para el lienzo de edición, usando los endpoints de subida de archivos y `PaginaLibro`.

¡Avísame cuando hayas implementado estos cambios y reiniciado tu backend!