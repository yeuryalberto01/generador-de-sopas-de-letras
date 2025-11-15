"""
Configuración de base de datos PostgreSQL/SQLite con SQLAlchemy.
Administra modelos para temas, libros y recursos asociados.
"""

import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    create_engine,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

# Configuración de PostgreSQL con fallback a SQLite para desarrollo
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./puzzle_generator.db")

# Seleccionar tipo JSON adecuado según el motor
JSON_TYPE = JSONB if DATABASE_URL.startswith("postgresql") else JSON

# Crear engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

# Crear sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


# ========== MODELOS DE BASE DE DATOS ==========

class Tema(Base):
    """Modelo para temas reutilizables."""

    __tablename__ = "temas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    palabras = Column(JSON_TYPE, nullable=False, default=list)  # [{"texto": "perro"}]
    imagen_principal = Column(LargeBinary)  # Se mantiene para compatibilidad
    icono = Column(LargeBinary)
    categoria = Column(String(100))
    etiquetas = Column(JSON_TYPE, default=list)
    dificultad = Column(String(20), default="medio")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    recursos = relationship("RecursoTema", back_populates="tema", cascade="all, delete-orphan")
    paginas = relationship("PaginaLibro", back_populates="tema")


class RecursoTema(Base):
    """Recursos adicionales de un tema (imágenes, audio, etc.)."""

    __tablename__ = "recursos_tema"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tema_id = Column(String(36), ForeignKey("temas.id"), nullable=False)
    tipo = Column(String(50), nullable=False)  # 'imagen', 'audio', 'video', 'documento'
    url_o_ruta = Column(String(1024), nullable=False)  # Ruta local o URL pública
    metadata_json = Column(JSON_TYPE, default=dict)  # Información adicional
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    tema = relationship("Tema", back_populates="recursos")


class Libro(Base):
    """Modelo para libros de sopas de letras."""

    __tablename__ = "libros"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    plantilla = Column(String(100), default="basico")
    estado = Column(String(50), default="creado")
    progreso_creacion = Column(Float, default=0.0)
    paginas_totales = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    paginas = relationship("PaginaLibro", back_populates="libro", cascade="all, delete-orphan")


class PaginaLibro(Base):
    """Páginas individuales de un libro."""

    __tablename__ = "paginas_libro"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    libro_id = Column(String(36), ForeignKey("libros.id"), nullable=False)
    numero_pagina = Column(Integer, nullable=False)
    tipo_pagina = Column(String(50), default="contenido")
    estado = Column(String(50), default="pendiente")

    # Contenido de la página
    titulo = Column(String(255))
    tema_id = Column(String(36), ForeignKey("temas.id"), nullable=True)
    contenido_json = Column(JSON_TYPE, default=dict)
    imagen_generada = Column(LargeBinary)

    # Metadata
    tiempo_generacion = Column(Float)
    elementos_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    libro = relationship("Libro", back_populates="paginas")
    tema = relationship("Tema", back_populates="paginas")
    recursos = relationship("RecursoPagina", back_populates="pagina", cascade="all, delete-orphan")


class RecursoPagina(Base):
    """Recursos adicionales de una página (imágenes añadidas, etc.)."""

    __tablename__ = "recursos_pagina"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pagina_id = Column(String(36), ForeignKey("paginas_libro.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    url_o_ruta = Column(String(1024), nullable=False)
    posiciones = Column(JSON_TYPE, default=dict)  # Posición, tamaño, rotación, etc.
    metadata_json = Column(JSON_TYPE, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    pagina = relationship("PaginaLibro", back_populates="recursos")


# ========== FUNCIONES DE UTILIDAD ==========

def get_db():
    """Dependencia para obtener sesión de BD."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_database():
    """Inicializar base de datos y crear tablas."""
    try:
        Base.metadata.create_all(bind=engine)
        print("✔ Base de datos inicializada correctamente")
    except Exception as exc:
        print(f"⚠ Error inicializando base de datos: {exc}")
        raise


# Crear tablas al importar (con manejo de errores)
try:
    init_database()
except Exception as exc:
    print(f"⚠ Error en inicialización automática de BD: {exc}")
    print("La base de datos se inicializará cuando sea necesaria")
