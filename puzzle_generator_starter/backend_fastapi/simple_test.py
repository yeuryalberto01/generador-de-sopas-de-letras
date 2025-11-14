#!/usr/bin/env python3
"""
Script simple para probar persistencia básica
"""

import os
import sys
import json
from pydantic import BaseModel
from typing import List, Optional

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

# Modelo copiado directamente
class TemaOut(BaseModel):
    """Modelo de salida para representar un tema."""
    id: str
    nombre: str
    descripcion: Optional[str] = ""
    words: List[str] = []
    updated_at: str

# Configuración de persistencia
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
TEMAS_FILE = os.path.join(DATA_DIR, "temas.json")

# Variable global
TEMAS = []

def load_temas():
    """Cargar temas desde archivo JSON."""
    try:
        if os.path.exists(TEMAS_FILE):
            with open(TEMAS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                TEMAS.clear()
                for item in data:
                    TEMAS.append(TemaOut(**item))
                print(f"✅ Cargados {len(TEMAS)} temas desde {TEMAS_FILE}")
        else:
            TEMAS.clear()
            print(f"ℹ️  Archivo {TEMAS_FILE} no existe, iniciando con lista vacía")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"❌ Error al cargar temas: {e}")
        TEMAS.clear()

def save_temas():
    """Guardar temas en archivo JSON."""
    try:
        print(f"DEBUG save_temas: Intentando guardar {len(TEMAS)} temas")
        print(f"DEBUG save_temas: IDs: {[t.id for t in TEMAS]}")
        # Convertir objetos TemaOut a diccionarios para JSON
        data = []
        for tema in TEMAS:
            try:
                tema_dict = tema.dict()
                data.append(tema_dict)
                print(f"DEBUG save_temas: Convertido tema {tema.id}")
            except Exception as e:
                print(f"DEBUG save_temas: Error convirtiendo tema {tema.id}: {e}")
        print(f"DEBUG save_temas: Datos a guardar: {len(data)} items")
        with open(TEMAS_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"💾 Temas guardados en {TEMAS_FILE} ({len(data)} temas)")
    except (IOError, TypeError) as e:
        print(f"❌ Error al guardar temas: {e}")
        import traceback
        traceback.print_exc()

def simple_test():
    print("🔬 Prueba simple de persistencia")

    # Paso 1: Cargar datos existentes
    print("1. Cargando datos existentes...")
    load_temas()
    print(f"   Temas cargados: {len(TEMAS)}")

    # Paso 2: Agregar un tema de prueba
    print("2. Agregando tema de prueba...")
    print(f"   TEMAS antes de append: {len(TEMAS)} items, IDs: {[t.id for t in TEMAS]}")
    test_tema = TemaOut(
        id="simple-test-123",
        nombre="Tema Simple",
        descripcion="Prueba simple",
        words=["simple", "test"],
        updated_at="2025-01-01T00:00:00+00:00"
    )
    print(f"   Tema a agregar: {test_tema.id}, nombre: {test_tema.nombre}")
    print(f"   Tema válido: {test_tema.dict()}")
    TEMAS.append(test_tema)
    print(f"   Después de append, último tema: {TEMAS[-1].id if TEMAS else 'None'}")
    print(f"   TEMAS después de append: {len(TEMAS)} items, IDs: {[t.id for t in TEMAS]}")
    print(f"   Temas en memoria: {len(TEMAS)}")

    # Paso 3: Guardar
    print("3. Guardando...")
    print(f"   Justo antes de save_temas: {len(TEMAS)} items, IDs: {[t.id for t in TEMAS]}")
    save_temas()

    # Paso 4: Limpiar y recargar
    print("4. Limpiando y recargando...")
    TEMAS.clear()
    load_temas()
    print(f"   Temas después de recargar: {len(TEMAS)}")

    # Paso 5: Verificar
    found = any(t.id == "simple-test-123" for t in TEMAS)
    if found:
        print("✅ ¡ÉXITO! El tema se guardó y se recuperó correctamente")
        return True
    else:
        print("❌ FALLÓ: El tema no se encontró después de recargar")
        print(f"   IDs encontrados: {[t.id for t in TEMAS]}")
        return False

if __name__ == "__main__":
    success = simple_test()
    sys.exit(0 if success else 1)