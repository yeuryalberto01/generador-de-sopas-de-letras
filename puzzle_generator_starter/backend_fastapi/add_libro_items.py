#!/usr/bin/env python3
"""
Script para añadir la tabla libro_items a la base de datos existente
"""

import sqlite3
import os

def add_libro_items_table():
    """Añadir tabla libro_items a la base de datos existente."""
    db_path = "puzzle_generator.db"

    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔄 Añadiendo tabla libro_items...")

        # Crear tabla libro_items si no existe
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS libro_items (
                id TEXT PRIMARY KEY,
                libro_id TEXT NOT NULL,
                tema_id TEXT NOT NULL,
                orden INTEGER DEFAULT 0,
                configuracion TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (libro_id) REFERENCES libros (id),
                FOREIGN KEY (tema_id) REFERENCES temas (id)
            )
        """)
        print("   ✅ Creada tabla 'libro_items'")

        # Crear índices si no existen
        indices = [
            ("ix_libro_item_libro_id", "CREATE INDEX IF NOT EXISTS ix_libro_item_libro_id ON libro_items (libro_id)"),
            ("ix_libro_item_tema_id", "CREATE INDEX IF NOT EXISTS ix_libro_item_tema_id ON libro_items (tema_id)"),
            ("ix_libro_item_orden", "CREATE INDEX IF NOT EXISTS ix_libro_item_orden ON libro_items (orden)")
        ]

        for index_name, sql in indices:
            try:
                cursor.execute(sql)
                print(f"   ✅ Creado índice '{index_name}'")
            except sqlite3.OperationalError as e:
                print(f"   ℹ️  Índice '{index_name}' ya existe o error: {e}")

        conn.commit()
        conn.close()

        print("✅ Tabla libro_items y índices añadidos exitosamente")
        return True

    except Exception as e:
        print(f"❌ Error general: {e}")
        return False

if __name__ == "__main__":
    print("🔧 AÑADIENDO TABLA LIBRO_ITEMS A BASE DE DATOS EXISTENTE")
    print("=" * 60)

    success = add_libro_items_table()

    print("\n" + "=" * 60)
    if success:
        print("✅ Tabla libro_items añadida. Ahora ejecuta: python migrate_database.py")
    else:
        print("❌ Error añadiendo tabla.")