#!/usr/bin/env python3
"""
Script de prueba para verificar la funcionalidad completa de la base de datos
"""

import json
import os
import sys
from datetime import datetime, timezone

# Agregar el directorio actual al path para importar módulos
sys.path.append(os.path.dirname(__file__))

# Evitar carga automática durante pruebas
import main
main._SKIP_AUTO_LOAD = True

from main import (
    load_temas, load_libros, save_temas, save_libros,
    initialize_data, TEMAS, LIBROS, TemaOut, LibroOut, BookTemplateOut,
    PuzzlePageOut
)

def test_temas_persistence():
    """Prueba la persistencia de temas"""
    print("🧪 Probando persistencia de temas...")

    # Cargar temas existentes
    initial_count = len(TEMAS)
    print(f"   📊 Temas iniciales: {initial_count}")

    # Crear un tema de prueba
    test_tema = TemaOut(
        id="test-tema-123",
        nombre="Tema de Prueba",
        descripcion="Tema creado para testing",
        words=["prueba", "test", "funcionalidad"],
        updated_at=datetime.now(timezone.utc).isoformat()
    )

    TEMAS.append(test_tema)
    save_temas()

    # Verificar que se guardó
    TEMAS.clear()
    load_temas()

    found = any(t.id == "test-tema-123" for t in TEMAS)
    if found:
        print("   ✅ Tema guardado correctamente")
    else:
        print("   ❌ Error: Tema no se guardó")
        return False

    # Limpiar tema de prueba
    TEMAS[:] = [t for t in TEMAS if t.id != "test-tema-123"]
    save_temas()

    # Recargar para verificar limpieza
    TEMAS.clear()
    load_temas()

    return True

def test_libros_persistence():
    """Prueba la persistencia de libros"""
    print("🧪 Probando persistencia de libros...")

    # Cargar libros existentes
    initial_count = len(LIBROS)
    print(f"   📊 Libros iniciales: {initial_count}")

    # Crear un libro de prueba
    test_template = BookTemplateOut(
        id="test-template",
        name="Plantilla de Prueba",
        description="Plantilla de testing",
        category="test",
        pageSize="LETTER",
        layout={
            "puzzlesPerPage": 1,
            "margin": {"top": 1, "right": 1, "bottom": 1, "left": 1},
            "spacing": 0.5,
            "showPageNumbers": True,
            "showTitles": True
        },
        styles={
            "backgroundColor": "#ffffff",
            "titleFont": "Arial",
            "titleSize": 24,
            "decorations": False
        }
    )

    test_libro = LibroOut(
        id="test-libro-123",
        name="Libro de Prueba",
        description="Libro creado para testing",
        template=test_template,
        temaIds=["test-tema-123"],
        pages=[],
        metadata={
            "author": "Test Script",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "version": "1.0"
        },
        settings={
            "autoGeneratePages": True,
            "includeIndex": False,
            "includeSolutions": False
        },
        createdAt=datetime.now(timezone.utc).isoformat(),
        updatedAt=datetime.now(timezone.utc).isoformat()
    )

    LIBROS.append(test_libro)
    save_libros()

    # Verificar que se guardó
    LIBROS.clear()
    load_libros()

    found = any(l.id == "test-libro-123" for l in LIBROS)
    if found:
        print("   ✅ Libro guardado correctamente")
    else:
        print("   ❌ Error: Libro no se guardó")
        return False

    # Agregar una página de prueba
    test_page = PuzzlePageOut(
        id="test-page-123",
        title="Página de Prueba",
        puzzleData={
            "grid": [["A", "B"], ["C", "D"]],
            "words": [{"text": "AB", "positions": []}],
            "config": {"rows": 2, "cols": 2}
        },
        layout={
            "position": {"x": 50, "y": 100},
            "size": {"width": 200, "height": 150},
            "pageNumber": 1
        },
        elements=[],
        createdAt=datetime.now(timezone.utc).isoformat(),
        updatedAt=datetime.now(timezone.utc).isoformat()
    )

    libro = next((l for l in LIBROS if l.id == "test-libro-123"), None)
    if libro:
        libro.pages.append(test_page)
        save_libros()

        # Recargar y verificar
        LIBROS.clear()
        load_libros()

        libro_actualizado = next((l for l in LIBROS if l.id == "test-libro-123"), None)
        if libro_actualizado and len(libro_actualizado.pages) > 0:
            print("   ✅ Página agregada correctamente")
        else:
            print("   ❌ Error: Página no se agregó")
            return False

    # Limpiar libro de prueba
    LIBROS[:] = [l for l in LIBROS if l.id != "test-libro-123"]
    save_libros()

    # Recargar para verificar limpieza
    LIBROS.clear()
    load_libros()

    return True

def test_data_integrity():
    """Prueba la integridad de los datos"""
    print("🧪 Probando integridad de datos...")

    # Recargar datos para verificar integridad
    load_temas()
    load_libros()

    # Verificar estructura de temas
    for tema in TEMAS:
        if not hasattr(tema, 'id') or not hasattr(tema, 'nombre') or not hasattr(tema, 'words'):
            print(f"   ❌ Tema {getattr(tema, 'id', 'unknown')} tiene estructura incorrecta")
            return False

    print(f"   ✅ {len(TEMAS)} temas con estructura correcta")

    # Verificar estructura de libros
    for libro in LIBROS:
        if not hasattr(libro, 'id') or not hasattr(libro, 'name') or not hasattr(libro, 'template') or not hasattr(libro, 'pages'):
            print(f"   ❌ Libro {getattr(libro, 'id', 'unknown')} tiene estructura incorrecta")
            return False

    print(f"   ✅ {len(LIBROS)} libros con estructura correcta")

    return True

def main():
    """Función principal de pruebas"""
    print("🚀 Iniciando pruebas de funcionalidad de base de datos\n")

    # Cargar datos iniciales
    initialize_data()

    # Limpiar datos de pruebas anteriores
    print("🧹 Limpiando datos de pruebas anteriores...")
    TEMAS[:] = [t for t in TEMAS if not t.id.startswith("test-")]
    LIBROS[:] = [l for l in LIBROS if not l.id.startswith("test-")]
    save_temas()
    save_libros()

    # Recargar datos limpios
    TEMAS.clear()
    LIBROS.clear()
    load_temas()
    load_libros()

    print(f"📊 Estado inicial (limpio):")
    print(f"   Temas: {len(TEMAS)}")
    print(f"   Libros: {len(LIBROS)}\n")

    # Ejecutar pruebas
    tests = [
        ("Persistencia de Temas", test_temas_persistence),
        ("Persistencia de Libros", test_libros_persistence),
        ("Integridad de Datos", test_data_integrity),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        try:
            if test_func():
                print(f"✅ {test_name}: PASÓ\n")
                passed += 1
            else:
                print(f"❌ {test_name}: FALLÓ\n")
        except (ValueError, TypeError, IOError) as e:
            print(f"❌ {test_name}: ERROR - {str(e)}\n")

    print(f"📊 Resultados: {passed}/{total} pruebas pasaron")

    if passed == total:
        print("🎉 ¡Todas las pruebas pasaron! La base de datos está funcionando correctamente.")
        return 0
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa los logs anteriores.")
        return 1

if __name__ == "__main__":
    sys.exit(main())