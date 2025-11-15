#!/usr/bin/env python3
"""
Script para reiniciar completamente la base de datos
"""

from database import Base, engine

def reset_database():
    """Eliminar todas las tablas y recrearlas"""
    print("🔄 Reiniciando base de datos...")

    try:
        # Eliminar todas las tablas
        Base.metadata.drop_all(bind=engine)
        print("✅ Tablas eliminadas")

        # Recrear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas recreadas")

        print("🎉 Base de datos reiniciada completamente")

    except Exception as e:
        print(f"❌ Error reiniciando base de datos: {e}")
        raise

if __name__ == "__main__":
    reset_database()