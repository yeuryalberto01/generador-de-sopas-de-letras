#!/usr/bin/env python3
"""
Servidor Flask simple para desarrollo del frontend
"""

import uuid
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Datos de ejemplo
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

@app.route('/api/health')
def health():
    """Endpoint de health check para verificar que la API está funcionando."""
    return jsonify({"status": "ok", "message": "Puzzle Generator API is running"})

@app.route('/api/db/temas', methods=['GET'])
def get_temas():
    """Obtiene la lista completa de temas disponibles."""
    return jsonify(TEMAS)

@app.route('/api/db/temas', methods=['POST'])
def create_tema():
    """Crea un nuevo tema con los datos proporcionados en el request."""
    data = request.get_json()

    new_tema = {
        "id": str(uuid.uuid4()),
        "nombre": data.get("nombre", ""),
        "descripcion": data.get("descripcion"),
        "palabras": data.get("palabras", []),
        "categoria": data.get("categoria"),
        "etiquetas": data.get("etiquetas", []),
        "dificultad": data.get("dificultad", "medio"),
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }

    TEMAS.append(new_tema)
    return jsonify(new_tema), 201

@app.route('/api/db/temas/<tema_id>', methods=['GET'])
def get_tema(tema_id):
    """Obtiene un tema específico por su ID."""
    tema = next((t for t in TEMAS if t["id"] == tema_id), None)
    if not tema:
        return jsonify({"error": "Tema no encontrado"}), 404
    return jsonify(tema)

@app.route('/api/db/libros', methods=['GET'])
def get_libros():
    """Obtiene la lista completa de libros disponibles."""
    return jsonify(LIBROS)

@app.route('/api/db/libros', methods=['POST'])
def create_libro():
    """Crea un nuevo libro con los datos proporcionados en el request."""
    data = request.get_json()

    new_libro = {
        "id": str(uuid.uuid4()),
        "nombre": data.get("nombre", ""),
        "descripcion": data.get("descripcion"),
        "plantilla": data.get("plantilla", "basico"),
        "created_at": datetime.utcnow().isoformat() + "Z",
        "updated_at": datetime.utcnow().isoformat() + "Z"
    }

    LIBROS.append(new_libro)
    return jsonify(new_libro), 201

@app.route('/api/db/libros/<libro_id>', methods=['GET'])
def get_libro(libro_id):
    """Obtiene un libro específico por su ID."""
    libro = next((l for l in LIBROS if l["id"] == libro_id), None)
    if not libro:
        return jsonify({"error": "Libro no encontrado"}), 404
    return jsonify(libro)

@app.route('/api/db/libros/<libro_id>/paginas', methods=['GET'])
def get_paginas(_libro_id):
    """Obtiene las páginas de un libro específico (simulado)."""
    # Simular páginas vacías - parámetro reservado para futura implementación
    return jsonify({"paginas": [], "total_paginas": 0})

if __name__ == '__main__':
    print("🚀 Starting Flask Development Server...")
    print("📡 API available at: http://127.0.0.1:8001")
    print("📚 Sample data loaded:")
    print(f"   - {len(TEMAS)} temas")
    print(f"   - {len(LIBROS)} libros")
    print()
    app.run(host='127.0.0.1', port=8001, debug=True)
