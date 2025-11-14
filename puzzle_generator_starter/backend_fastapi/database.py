"""
Configuración de base de datos PostgreSQL con SQLAlchemy
"""

import os
import json
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, LargeBinary, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import uuid
from datetime import datetime, timezone

# Configuración de PostgreSQL
# Para desarrollo local, usar SQLite como fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./puzzle_generator.db")

# Crear engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Crear sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

# ========== MODELOS DE BASE DE DATOS ==========

class Tema(Base):
    """Modelo para temas reutilizables"""
    __tablename__ = "temas"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    palabras = Column(Text, nullable=False)  # JSON string: [{"texto": "perro"}, {"texto": "gato"}]
    imagen_principal = Column(LargeBinary)  # Imagen principal del tema
    icono = Column(LargeBinary)  # Icono pequeño
    categoria = Column(String(100))  # "animales", "frutas", "colores", etc.
    etiquetas = Column(Text)  # JSON string: ["facil", "infantil"]
    dificultad = Column(String(20), default="medio")  # "facil", "medio", "dificil"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relaciones
    recursos = relationship("RecursoTema", back_populates="tema", cascade="all, delete-orphan")

class RecursoTema(Base):
    """Recursos adicionales de un tema (imágenes, audio, etc.)"""
    __tablename__ = "recursos_tema"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tema_id = Column(String(36), ForeignKey("temas.id"), nullable=False)
    tipo = Column(String(50), nullable=False)  # 'imagen', 'audio', 'video', 'documento'
    nombre_archivo = Column(String(255), nullable=False)
    contenido = Column(LargeBinary, nullable=False)  # Archivo binario
    tamano_bytes = Column(Integer)
    mime_type = Column(String(100))
    metadata_json = Column(Text)  # JSON string: {"width": 800, "height": 600}
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    tema = relationship("Tema", back_populates="recursos")

class Libro(Base):
    """Modelo para libros de sopas de letras"""
    __tablename__ = "libros"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    plantilla = Column(String(100), default="basico")  # "infantil", "educativo", "profesional"
    estado = Column(String(50), default="creado")  # "creado", "procesando", "completado", "error"
    progreso_creacion = Column(Float, default=0.0)  # 0-100
    paginas_totales = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relaciones
    paginas = relationship("PaginaLibro", back_populates="libro", cascade="all, delete-orphan")

class PaginaLibro(Base):
    """Páginas individuales de un libro"""
    __tablename__ = "paginas_libro"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    libro_id = Column(String(36), ForeignKey("libros.id"), nullable=False)
    numero_pagina = Column(Integer, nullable=False)
    tipo_pagina = Column(String(50), default="contenido")  # "portada", "contenido", "solucion", "contraportada"
    estado = Column(String(50), default="pendiente")  # "pendiente", "generando", "completada", "error"

    # Contenido de la página
    titulo = Column(String(255))
    tema_id = Column(String(36))  # Referencia al tema copiado
    contenido_json = Column(Text)  # JSON string: Layout, elementos, posiciones
    imagen_generada = Column(LargeBinary)  # Imagen final de la página

    # Metadata
    tiempo_generacion = Column(Float)  # Segundos para generar
    elementos_count = Column(Integer, default=0)  # Número de elementos en la página
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relaciones
    libro = relationship("Libro", back_populates="paginas")
    recursos = relationship("RecursoPagina", back_populates="pagina", cascade="all, delete-orphan")

class RecursoPagina(Base):
    """Recursos adicionales de una página (imágenes añadidas, etc.)"""
    __tablename__ = "recursos_pagina"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pagina_id = Column(String(36), ForeignKey("paginas_libro.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    contenido = Column(LargeBinary, nullable=False)
    tamano_bytes = Column(Integer)
    mime_type = Column(String(100))
    posicion_x = Column(Integer, default=0)
    posicion_y = Column(Integer, default=0)
    ancho = Column(Integer)
    alto = Column(Integer)
    metadata_json = Column(Text)  # JSON string
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relaciones
    pagina = relationship("PaginaLibro", back_populates="recursos")

# ========== FUNCIONES DE UTILIDAD ==========

def get_db():
    """Dependencia para obtener sesión de BD"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """Inicializar base de datos y crear tablas"""
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos inicializada correctamente")
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {e}")
        raise

# Crear tablas al importar (con manejo de errores)
try:
    init_database()
except Exception as e:
    print(f"⚠️  Error en inicialización automática de BD: {e}")
    print("La base de datos se inicializará cuando sea necesaria")