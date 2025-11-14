#!/usr/bin/env python3
"""
Script de prueba para la base de datos SQLite
"""

import json
from database import SessionLocal, Tema, Libro, PaginaLibro, RecursoTema

def test_database():
    """Prueba básica de operaciones CRUD"""
    print("🔬 Probando base de datos SQLite...")

    db = SessionLocal()

    try:
        # 1. Crear un tema de prueba
        print("1. Creando tema de prueba...")
        tema_data = {
            "nombre": "Animales de la Granja",
            "descripcion": "Tema para niños con animales de granja",
            "palabras": json.dumps([
                {"texto": "vaca"},
                {"texto": "cerdo"},
                {"texto": "gallina"},
                {"texto": "caballo"}
            ]),
            "categoria": "animales",
            "etiquetas": json.dumps(["facil", "infantil", "granja"]),
            "dificultad": "facil"
        }

        tema = Tema(**tema_data)
        db.add(tema)
        db.commit()
        db.refresh(tema)
        print(f"   ✅ Tema creado: {tema.nombre} (ID: {tema.id})")

        # 2. Crear un libro
        print("2. Creando libro de prueba...")
        libro_data = {
            "nombre": "Mi Primer Libro de Sopas de Letras",
            "descripcion": "Libro educativo para niños",
            "plantilla": "infantil",
            "estado": "creado",
            "progreso_creacion": 0.0,
            "paginas_totales": 0
        }

        libro = Libro(**libro_data)
        db.add(libro)
        db.commit()
        db.refresh(libro)
        print(f"   ✅ Libro creado: {libro.nombre} (ID: {libro.id})")

        # 3. Crear una página
        print("3. Creando página de prueba...")
        pagina_data = {
            "libro_id": libro.id,
            "numero_pagina": 1,
            "tipo_pagina": "contenido",
            "estado": "completada",
            "titulo": "Página de Animales",
            "tema_id": tema.id,
            "contenido_json": json.dumps({
                "layout": "grid",
                "elementos": [
                    {"tipo": "puzzle", "x": 50, "y": 100, "width": 400, "height": 300}
                ]
            }),
            "elementos_count": 1,
            "tiempo_generacion": 2.5
        }

        pagina = PaginaLibro(**pagina_data)
        db.add(pagina)
        db.commit()
        db.refresh(pagina)
        print(f"   ✅ Página creada: {pagina.titulo} (ID: {pagina.id})")

        # 4. Consultar datos
        print("4. Consultando datos...")

        # Contar temas
        temas_count = db.query(Tema).count()
        print(f"   📊 Total temas: {temas_count}")

        # Contar libros
        libros_count = db.query(Libro).count()
        print(f"   📊 Total libros: {libros_count}")

        # Contar páginas
        paginas_count = db.query(PaginaLibro).count()
        print(f"   📊 Total páginas: {paginas_count}")

        # Obtener libro con páginas
        libro_con_paginas = db.query(Libro).filter(Libro.id == libro.id).first()
        if libro_con_paginas:
            print(f"   📖 Libro '{libro_con_paginas.nombre}' tiene {len(libro_con_paginas.paginas)} páginas")

        print("✅ ¡Todas las pruebas pasaron exitosamente!")

    except Exception as e:
        print(f"❌ Error en pruebas: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_database()