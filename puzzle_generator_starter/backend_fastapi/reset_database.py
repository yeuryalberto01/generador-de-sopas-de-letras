"""
Utilidad para reiniciar la base de datos local de forma segura.

El proyecto utiliza SQLite por defecto (DATABASE_URL=sqlite:///./puzzle_generator.db).
Este script elimina el archivo actual y vuelve a invocar init_database() para que
SQLAlchemy genere el esquema definido en database.py.
"""

from __future__ import annotations

import os
from pathlib import Path

from database import init_database


def _resolve_sqlite_path(database_url: str) -> Path | None:
    """
    Convierte un DATABASE_URL de SQLite (sqlite:///path/to/file.db) en un Path absoluto.
    Si el URL apunta a otro motor, devuelve None.
    """
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        return None
    # El path puede ser relativo al backend_fastapi
    relative_path = database_url[len(prefix) :]
    return Path(relative_path).resolve()


def main() -> None:
    database_url = os.getenv("DATABASE_URL", "sqlite:///./puzzle_generator.db")
    sqlite_path = _resolve_sqlite_path(database_url)

    if sqlite_path is None:
        print(
            "[reset_database] La variable DATABASE_URL no apunta a SQLite. "
            "Elimina o reinicia tu base manualmente."
        )
        init_database()
        return

    if sqlite_path.exists():
        sqlite_path.unlink()
        print(f"[reset_database] Archivo eliminado: {sqlite_path}")
    else:
        print(f"[reset_database] No se encontró la base {sqlite_path}, se creará una nueva.")

    init_database()
    print("[reset_database] Base de datos recreada correctamente.")


if __name__ == "__main__":
    main()
