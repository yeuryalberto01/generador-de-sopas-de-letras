#!/usr/bin/env python3
"""
Script para verificar el contenido de la base de datos antigua
"""

import os
import sys
from pathlib import Path

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(__file__))

def check_database_content(db_path):
    """Verificar contenido de una base de datos"""
    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return

    try:
        # Importar SQLAlchemy después de verificar que existe
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from database import Tema, Libro, PaginaLibro

        # Crear engine temporal
        engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})

        # Crear sesión
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()

        try:
            # Contar registros
            temas_count = db.query(Tema).count()
            libros_count = db.query(Libro).count()
            paginas_count = db.query(PaginaLibro).count()

            print(f"📊 Contenido de {db_path}:")
            print(f"   Temas: {temas_count}")
            print(f"   Libros: {libros_count}")
            print(f"   Páginas: {paginas_count}")

            if temas_count > 0:
                print("\n🏷️  Temas encontrados:")
                temas = db.query(Tema).limit(5).all()
                for tema in temas:
                    print(f"   • {tema.nombre} ({len(tema.palabras) if tema.palabras else 0} palabras)")

            if libros_count > 0:
                print("\n📚 Libros encontrados:")
                libros = db.query(Libro).limit(5).all()
                for libro in libros:
                    print(f"   • {libro.nombre} ({libro.paginas_totales} páginas)")

        finally:
            db.close()

    except Exception as e:
        print(f"❌ Error al leer la base de datos: {e}")

def main():
    print("🔍 VERIFICADOR DE CONTENIDO DE BASES DE DATOS")
    print("=" * 50)

    databases = [
        ("puzzle_generator.db", "Base de datos actual"),
        ("puzzle_generator.db.bak", "Backup original"),
        ("puzzle_generator_old.db", "Copia del backup")
    ]

    for db_path, description in databases:
        print(f"\n{description} ({db_path}):")
        check_database_content(db_path)

    print("\n" + "=" * 50)
    print("💡 Si quieres restaurar datos antiguos, usa: python restore_old_database.py")

if __name__ == "__main__":
    main()