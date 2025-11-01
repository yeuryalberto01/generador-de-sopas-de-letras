#!/usr/bin/env python3
"""
Script de inicio para el servidor de la API de sopas de letras.

Este script inicia el servidor FastAPI para la aplicación de generación
de sopas de letras usando Uvicorn.
"""

import uvicorn
from puzzle_generator_starter.backend_fastapi.main import app

if __name__ == "__main__":
    print("Starting Puzzle API server...")
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")
