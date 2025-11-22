"""
Configuración de base de datos PostgreSQL/SQLite con SQLAlchemy.
Administra modelos para temas, libros y recursos asociados.
"""

import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
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

# Mixin para soft-delete
class SoftDeleteMixin:
    deleted_at = Column(DateTime(timezone=True), nullable=True)


# ========== MODELOS DE BASE DE DATOS ==========

class Tema(Base, SoftDeleteMixin):
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
    es_publico = Column(Boolean, default=False)  # Para temas compartidos
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Índices para rendimiento
    __table_args__ = (
        Index('ix_tema_nombre', "nombre"),
        Index('ix_tema_categoria', "categoria"),
        Index('ix_tema_dificultad', "dificultad"),
        Index('ix_tema_es_publico', "es_publico"),
        Index('ix_tema_deleted_at', "deleted_at"),
    )

    # Relaciones
    recursos = relationship("RecursoTema", back_populates="tema", cascade="all, delete-orphan")
    paginas = relationship("PaginaLibro", back_populates="tema")
    libro_items = relationship("LibroItem", back_populates="tema", cascade="all, delete-orphan")


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


class Libro(Base, SoftDeleteMixin):
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

    # Índices para rendimiento
    __table_args__ = (
        Index('ix_libro_estado', "estado"),
        Index('ix_libro_plantilla', "plantilla"),
        Index('ix_libro_deleted_at', "deleted_at"),
    )

    # Relaciones
    paginas = relationship("PaginaLibro", back_populates="libro", cascade="all, delete-orphan")
    items = relationship("LibroItem", back_populates="libro", cascade="all, delete-orphan", order_by="LibroItem.orden")


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


class SopaGenerada(Base):
    """Histórico de sopas de letras generadas."""

    __tablename__ = "sopas_generadas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tema_id = Column(String(36), ForeignKey("temas.id"), nullable=True)
    palabras = Column(JSON_TYPE, nullable=False)  # Lista de palabras usadas
    grid = Column(JSON_TYPE, nullable=False)      # Matriz de la sopa
    word_positions = Column(JSON_TYPE, nullable=False)  # Posiciones de las palabras
    grid_size = Column(Integer, default=15)       # Tamaño del grid
    dificultad = Column(String(20), default="medio")
    tiempo_generacion = Column(Float)             # Tiempo en segundos
    compartible = Column(Boolean, default=False)  # Si se puede compartir por enlace
    enlace_publico = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Índices para rendimiento
    __table_args__ = (
        Index('ix_sopa_tema_id', "tema_id"),
        Index('ix_sopa_dificultad', "dificultad"),
        Index('ix_sopa_compartible', "compartible"),
        Index('ix_sopa_enlace_publico', "enlace_publico"),
    )

    # Relaciones
    tema = relationship("Tema", backref="sopas_generadas")


class LibroItem(Base):
    """Elementos individuales dentro de un libro (temas organizados)."""

    __tablename__ = "libro_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    libro_id = Column(String(36), ForeignKey("libros.id"), nullable=False)
    tema_id = Column(String(36), ForeignKey("temas.id"), nullable=False)
    orden = Column(Integer, default=0)  # Orden dentro del libro
    configuracion = Column(JSON_TYPE, default=dict)  # Configuración específica (grid_size, dificultad, etc.)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Índices para rendimiento
    __table_args__ = (
        Index('ix_libro_item_libro_id', "libro_id"),
        Index('ix_libro_item_tema_id', "tema_id"),
        Index('ix_libro_item_orden', "orden"),
    )

    # Relaciones
    libro = relationship("Libro", back_populates="items")
    tema = relationship("Tema", back_populates="libro_items")


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
        print("Base de datos inicializada correctamente")
    except Exception as exc:
        print(f"⚠ Error inicializando base de datos: {exc}")
        raise


# Crear tablas al importar (con manejo de errores)
try:
    init_database()
except Exception as exc:
    print(f"⚠ Error en inicialización automática de BD: {exc}")
    print("La base de datos se inicializará cuando sea necesaria")
