#!/usr/bin/env python3
"""
Script de prueba directa de las APIs de base de datos (sin servidor HTTP)
"""

import json
from database import get_db, init_database, Tema, Libro, PaginaLibro
from main import TemaCreate, TemaResponse, LibroCreate, LibroResponse

def test_temas_logic():
    """Probar la lógica de temas directamente"""
    print("🔬 Probando lógica de Temas (Base de Datos)...")

    # Inicializar BD
    init_database()

    # 1. Crear un tema
    tema_data = {
        "nombre": "Frutas Tropicales",
        "descripcion": "Tema con frutas exóticas",
        "palabras": [
            {"texto": "piña"},
            {"texto": "mango"},
            {"texto": "papaya"},
            {"texto": "guayaba"}
        ],
        "categoria": "frutas",
        "etiquetas": ["tropical", "exotico", "facil"],
        "dificultad": "facil"
    }

    print("1. Creando tema...")
    db = next(get_db())

    try:
        # Verificar si ya existe
        existing = db.query(Tema).filter(Tema.nombre == tema_data["nombre"]).first()
        if existing:
            print(f"   ⚠️  Tema ya existe: {tema_data['nombre']}")
            tema_id = existing.id
        else:
            # Crear tema
            db_tema = Tema(
                nombre=tema_data["nombre"],
                descripcion=tema_data["descripcion"],
                palabras=json.dumps(tema_data["palabras"]),
                categoria=tema_data["categoria"],
                etiquetas=json.dumps(tema_data["etiquetas"]),
                dificultad=tema_data["dificultad"]
            )

            db.add(db_tema)
            db.commit()
            db.refresh(db_tema)
            tema_id = db_tema.id
            print(f"   ✅ Tema creado: {db_tema.nombre} (ID: {tema_id})")

        # 2. Obtener el tema
        print("2. Obteniendo tema...")
        tema = db.query(Tema).filter(Tema.id == tema_id).first()
        if tema:
            print(f"   ✅ Tema obtenido: {tema.nombre}")
        else:
            print("   ❌ Tema no encontrado")

        # 3. Listar todos los temas
        print("3. Listando temas...")
        temas = db.query(Tema).all()
        print(f"   📊 Total temas: {len(temas)}")

        return tema_id

    finally:
        db.close()

def test_libros_logic():
    """Probar la lógica de libros directamente"""
    print("🔬 Probando lógica de Libros (Base de Datos)...")

    db = next(get_db())

    try:
        # 1. Crear un libro
        libro_data = {
            "nombre": "Mi Libro de Frutas",
            "descripcion": "Un libro educativo sobre frutas",
            "plantilla": "infantil"
        }

        print("1. Creando libro...")
        db_libro = Libro(
            nombre=libro_data["nombre"],
            descripcion=libro_data["descripcion"],
            plantilla=libro_data["plantilla"]
        )

        db.add(db_libro)
        db.commit()
        db.refresh(db_libro)
        libro_id = db_libro.id
        print(f"   ✅ Libro creado: {db_libro.nombre} (ID: {libro_id})")

        # 2. Obtener el libro
        print("2. Obteniendo libro...")
        libro = db.query(Libro).filter(Libro.id == libro_id).first()
        if libro:
            print(f"   ✅ Libro obtenido: {libro.nombre}")
        else:
            print("   ❌ Libro no encontrado")

        # 3. Crear una página
        pagina_data = {
            "numero_pagina": 1,
            "titulo": "Página de Frutas",
            "tema_id": None,
            "contenido_json": {
                "layout": "grid",
                "elementos": [
                    {"tipo": "titulo", "texto": "Frutas Deliciosas", "x": 100, "y": 50},
                    {"tipo": "imagen", "src": "fruta.jpg", "x": 50, "y": 100, "width": 200, "height": 150}
                ]
            }
        }

        print("3. Creando página...")
        db_pagina = PaginaLibro(
            libro_id=libro_id,
            numero_pagina=pagina_data["numero_pagina"],
            titulo=pagina_data["titulo"],
            tema_id=pagina_data["tema_id"],
            contenido_json=json.dumps(pagina_data["contenido_json"])
        )

        db.add(db_pagina)
        db.commit()
        db.refresh(db_pagina)
        print(f"   ✅ Página creada: {db_pagina.titulo} (ID: {db_pagina.id})")

        # 4. Obtener páginas del libro
        print("4. Obteniendo páginas del libro...")
        paginas = db.query(PaginaLibro).filter(PaginaLibro.libro_id == libro_id).all()
        print(f"   📄 Total páginas: {len(paginas)}")

        # 5. Listar todos los libros
        print("5. Listando libros...")
        libros = db.query(Libro).all()
        print(f"   📚 Total libros: {len(libros)}")

        return libro_id

    finally:
        db.close()

def main():
    """Función principal de pruebas"""
    print("🚀 Iniciando pruebas DIRECTAS de APIs con Base de Datos")
    print("=" * 60)

    try:
        # Probar temas
        tema_id = test_temas_logic()
        print()

        # Probar libros
        libro_id = test_libros_logic()
        print()

        print("✅ ¡Todas las pruebas directas completadas!")
        print(f"📊 Resumen: Tema ID: {tema_id}, Libro ID: {libro_id}")

    except Exception as e:
        print(f"❌ Error en pruebas: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()