#!/usr/bin/env python3
"""
Script para añadir columnas faltantes a la base de datos existente
"""

import sqlite3
import os

def add_missing_columns():
    """Añadir columnas faltantes a tablas existentes."""
    db_path = "puzzle_generator.db"

    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔄 Añadiendo columnas faltantes...")

        # Añadir columna deleted_at a temas si no existe
        try:
            cursor.execute("ALTER TABLE temas ADD COLUMN deleted_at TIMESTAMP")
            print("   ✅ Añadida columna 'deleted_at' a tabla 'temas'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("   ℹ️  Columna 'deleted_at' ya existe en 'temas'")
            else:
                print(f"   ⚠️  Error añadiendo 'deleted_at' a 'temas': {e}")

        # Añadir columna es_publico a temas si no existe
        try:
            cursor.execute("ALTER TABLE temas ADD COLUMN es_publico BOOLEAN DEFAULT 0")
            print("   ✅ Añadida columna 'es_publico' a tabla 'temas'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("   ℹ️  Columna 'es_publico' ya existe en 'temas'")
            else:
                print(f"   ⚠️  Error añadiendo 'es_publico' a 'temas': {e}")

        # Añadir columna deleted_at a libros si no existe
        try:
            cursor.execute("ALTER TABLE libros ADD COLUMN deleted_at TIMESTAMP")
            print("   ✅ Añadida columna 'deleted_at' a tabla 'libros'")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("   ℹ️  Columna 'deleted_at' ya existe en 'libros'")
            else:
                print(f"   ⚠️  Error añadiendo 'deleted_at' a 'libros': {e}")

        # Crear tabla sopas_generadas si no existe
        try:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sopas_generadas (
                    id TEXT PRIMARY KEY,
                    tema_id TEXT,
                    palabras TEXT NOT NULL,
                    grid TEXT NOT NULL,
                    word_positions TEXT NOT NULL,
                    grid_size INTEGER DEFAULT 15,
                    dificultad TEXT DEFAULT 'medio',
                    tiempo_generacion REAL,
                    compartible BOOLEAN DEFAULT 0,
                    enlace_publico TEXT UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (tema_id) REFERENCES temas (id)
                )
            """)
            print("   ✅ Creada tabla 'sopas_generadas'")
        except sqlite3.OperationalError as e:
            print(f"   ⚠️  Error creando tabla 'sopas_generadas': {e}")

        # Crear índices si no existen
        indices = [
            ("ix_tema_nombre", "CREATE INDEX IF NOT EXISTS ix_tema_nombre ON temas (nombre)"),
            ("ix_tema_categoria", "CREATE INDEX IF NOT EXISTS ix_tema_categoria ON temas (categoria)"),
            ("ix_tema_dificultad", "CREATE INDEX IF NOT EXISTS ix_tema_dificultad ON temas (dificultad)"),
            ("ix_tema_es_publico", "CREATE INDEX IF NOT EXISTS ix_tema_es_publico ON temas (es_publico)"),
            ("ix_tema_deleted_at", "CREATE INDEX IF NOT EXISTS ix_tema_deleted_at ON temas (deleted_at)"),
            ("ix_libro_estado", "CREATE INDEX IF NOT EXISTS ix_libro_estado ON libros (estado)"),
            ("ix_libro_plantilla", "CREATE INDEX IF NOT EXISTS ix_libro_plantilla ON libros (plantilla)"),
            ("ix_libro_deleted_at", "CREATE INDEX IF NOT EXISTS ix_libro_deleted_at ON libros (deleted_at)"),
            ("ix_sopa_tema_id", "CREATE INDEX IF NOT EXISTS ix_sopa_tema_id ON sopas_generadas (tema_id)"),
            ("ix_sopa_dificultad", "CREATE INDEX IF NOT EXISTS ix_sopa_dificultad ON sopas_generadas (dificultad)"),
            ("ix_sopa_compartible", "CREATE INDEX IF NOT EXISTS ix_sopa_compartible ON sopas_generadas (compartible)"),
            ("ix_sopa_enlace_publico", "CREATE INDEX IF NOT EXISTS ix_sopa_enlace_publico ON sopas_generadas (enlace_publico)")
        ]

        for index_name, sql in indices:
            try:
                cursor.execute(sql)
                print(f"   ✅ Creado índice '{index_name}'")
            except sqlite3.OperationalError as e:
                print(f"   ℹ️  Índice '{index_name}' ya existe o error: {e}")

        conn.commit()
        conn.close()

        print("✅ Columnas e índices añadidos exitosamente")
        return True

    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

if __name__ == "__main__":
    print("🔧 AÑADIENDO COLUMNAS FALTANTES A BASE DE DATOS EXISTENTE")
    print("=" * 60)

    success = add_missing_columns()

    print("\n" + "=" * 60)
    if success:
        print("✅ Columnas añadidas. Ahora ejecuta: python migrate_database.py")
    else:
        print("❌ Error añadiendo columnas.")