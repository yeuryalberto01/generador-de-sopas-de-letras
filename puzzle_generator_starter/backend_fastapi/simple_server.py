#!/usr/bin/env python3
"""
Servidor simple para desarrollo del frontend
"""

import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Puzzle Generator API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class Palabra(BaseModel):
    texto: str

class TemaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    palabras: List[Palabra]
    categoria: Optional[str] = None
    etiquetas: Optional[List[str]] = None
    dificultad: Optional[str] = "medio"

class TemaResponse(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str]
    palabras: List[Palabra]
    categoria: Optional[str]
    etiquetas: Optional[List[str]]
    dificultad: str
    created_at: str
    updated_at: str

class LibroCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    plantilla: Optional[str] = "basico"

class LibroResponse(BaseModel):
    id: str
    nombre: str
    descripcion: Optional[str]
    plantilla: str
    created_at: str
    updated_at: str

# Datos en memoria para desarrollo
TEMAS = [
    {
        "id": "tema-1",
        "nombre": "Frutas Tropicales",
        "descripcion": "Tema con frutas exóticas",
        "palabras": [{"texto": "piña"}, {"texto": "mango"}, {"texto": "papaya"}],
        "categoria": "frutas",
        "etiquetas": ["tropical", "exotico"],
        "dificultad": "facil",
        "created_at": "2025-11-13T00:00:00Z",
        "updated_at": "2025-11-13T00:00:00Z"
    },
    {
        "id": "tema-2",
        "nombre": "Animales de la Selva",
        "descripcion": "Animales que viven en la selva",
        "palabras": [{"texto": "tigre"}, {"texto": "mono"}, {"texto": "jaguar"}],
        "categoria": "animales",
        "etiquetas": ["selva", "salvaje"],
        "dificultad": "medio",
        "created_at": "2025-11-13T00:00:00Z",
        "updated_at": "2025-11-13T00:00:00Z"
    }
]

LIBROS = [
    {
        "id": "libro-1",
        "nombre": "Mi Libro de Frutas",
        "descripcion": "Un libro educativo sobre frutas",
        "plantilla": "infantil",
        "created_at": "2025-11-13T00:00:00Z",
        "updated_at": "2025-11-13T00:00:00Z"
    }
]

# Rutas de API
@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Puzzle Generator API is running"}

@app.get("/api/db/temas")
def get_temas():
    return TEMAS

@app.post("/api/db/temas")
def create_tema(tema: TemaCreate):
    import uuid
    from datetime import datetime

    new_tema = {
        "id": str(uuid.uuid4()),
        "nombre": tema.nombre,
        "descripcion": tema.descripcion,
        "palabras": [p.dict() for p in tema.palabras],
        "categoria": tema.categoria,
        "etiquetas": tema.etiquetas or [],
        "dificultad": tema.dificultad,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }

    TEMAS.append(new_tema)
    return new_tema

@app.get("/api/db/temas/{tema_id}")
def get_tema(tema_id: str):
    tema = next((t for t in TEMAS if t["id"] == tema_id), None)
    if not tema:
        raise HTTPException(status_code=404, detail="Tema no encontrado")
    return tema

@app.get("/api/db/libros")
def get_libros():
    return LIBROS

@app.post("/api/db/libros")
def create_libro(libro: LibroCreate):
    import uuid
    from datetime import datetime

    new_libro = {
        "id": str(uuid.uuid4()),
        "nombre": libro.nombre,
        "descripcion": libro.descripcion,
        "plantilla": libro.plantilla,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }

    LIBROS.append(new_libro)
    return new_libro

@app.get("/api/db/libros/{libro_id}")
def get_libro(libro_id: str):
    libro = next((l for l in LIBROS if l["id"] == libro_id), None)
    if not libro:
        raise HTTPException(status_code=404, detail="Libro no encontrado")
    return libro

@app.get("/api/db/libros/{libro_id}/paginas")
def get_paginas(libro_id: str):
    # Simular páginas vacías por ahora
    return {"paginas": [], "total_paginas": 0}

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Simple Development Server...")
    print("📡 API available at: http://127.0.0.1:8001")
    print("📚 Sample data loaded:")
    print(f"   - {len(TEMAS)} temas")
    print(f"   - {len(LIBROS)} libros")
    print()

    # Configuración más simple para evitar problemas
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8001,
            log_level="info",
            access_log=False,
            server_header=False
        )
    except KeyboardInterrupt:
        print("Server stopped by user")
    except Exception as e:
        print(f"Server error: {e}")
        import traceback
        traceback.print_exc()