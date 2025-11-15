#!/usr/bin/env python3
"""
Script para restaurar la base de datos antigua desde el backup
"""

import os
import shutil
from pathlib import Path

def restore_old_database():
    """Restaurar la base de datos antigua"""
    current_db = Path("puzzle_generator.db")
    backup_db = Path("puzzle_generator.db.bak")
    old_db = Path("puzzle_generator_old.db")

    print("🔄 Restaurando base de datos antigua...")

    if not backup_db.exists():
        print("❌ No se encontró el archivo de respaldo puzzle_generator.db.bak")
        return False

    try:
        # Hacer backup de la base de datos actual
        if current_db.exists():
            shutil.copy2(current_db, "puzzle_generator_current_backup.db")
            print("✅ Backup de la base de datos actual creado")

        # Restaurar desde el backup
        shutil.copy2(backup_db, current_db)
        print("✅ Base de datos antigua restaurada")

        print("🎉 ¡Base de datos antigua restaurada exitosamente!")
        print("💡 Reinicia el servidor para que los cambios surtan efecto")

        return True

    except Exception as e:
        print(f"❌ Error al restaurar: {e}")
        return False

def show_database_info():
    """Mostrar información sobre las bases de datos disponibles"""
    files = [
        ("puzzle_generator.db", "Base de datos actual"),
        ("puzzle_generator.db.bak", "Backup original"),
        ("puzzle_generator_old.db", "Copia del backup"),
        ("puzzle_generator_current_backup.db", "Backup de la actual")
    ]

    print("📊 Información de bases de datos:")
    print("-" * 50)

    for filename, description in files:
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            print("15")
        else:
            print("15")

if __name__ == "__main__":
    print("🗄️  HERRAMIENTA DE RESTAURACIÓN DE BASE DE DATOS")
    print("=" * 50)

    show_database_info()

    print("\n¿Quieres restaurar la base de datos antigua?")
    print("Esto reemplazará la base de datos actual con los datos antiguos.")
    response = input("Escribe 'SI' para confirmar: ")

    if response.upper() == 'SI':
        if restore_old_database():
            print("\n✅ Proceso completado exitosamente")
        else:
            print("\n❌ El proceso falló")
    else:
        print("\n❌ Operación cancelada")