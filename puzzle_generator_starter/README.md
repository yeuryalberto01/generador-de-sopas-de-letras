# 🎯 Puzzle Generator — Sistema de Creación de Libros de Sopas de Letras

Herramienta completa para diseñar, organizar y exportar libros profesionales de sopas de letras.

## 🏗️ Arquitectura del Sistema

### Flujo de Trabajo Reorganizado

```
🏠 INICIO → 📚 LIBROS → 🏷️ TEMAS → 🎨 DIAGRAMACIÓN
```

#### 1. **📚 Módulo Libros** (Punto Central)
- **Función**: Crear y gestionar libros completos como productos finales
- **Características**:
  - Crear nuevos libros con plantillas profesionales
  - Agregar/quitar temas a libros existentes
  - Ensamblar libros como productos reales de producción
  - Vista previa de libros completos
  - Gestión de proyectos de libros
  - Exportación a PDF

#### 2. **🏷️ Módulo Temas** (Gestión de Contenido)
- **Función**: Crear y editar temas para puzzles
- **Características**:
  - Crear temas con palabras personalizadas
  - Editar palabras existentes
  - Organizar temas por categorías
  - Importar/exportar temas

#### 3. **🎨 Módulo Diagramación** (Editor Visual)
- **Función**: Editor completo de todos los elementos del libro
- **Características**:
  - Generación automática de sopas de letras
  - Personalización visual completa
  - Controles de layout y diseño
  - Vista previa en tiempo real
  - Exportación de páginas individuales

## 🚀 Cómo Usar

### Backend
```bash
cd backend_fastapi
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
En otra terminal:
```bash
npm install
npm run dev
```

Abre `http://localhost:5173/`

## 🛣️ Rutas del Sistema

- **`/`** - 🏠 **Inicio**: Pantalla de bienvenida
- **`/libros`** - 📚 **Libros**: Gestión central de libros (punto principal)
- **`/temas`** - 🏷️ **Temas**: Creación y edición de temas
- **`/diagramacion`** - 🎨 **Diagramación**: Editor visual de puzzles

## 📦 Tecnologías

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + Pydantic
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **UI/UX**: Framer Motion + Lucide Icons

## 🎯 Flujo de Usuario Típico

1. **Crear Libro** → Seleccionar plantilla y configurar propiedades
2. **Agregar Temas** → Crear o seleccionar temas existentes
3. **Diagramar** → Generar puzzles visuales con el editor
4. **Exportar** → Obtener libro completo en PDF

## 🔧 Variables de Entorno

- `.env.example` → Copia a `.env` para configurar:
  - `VITE_API_BASE_URL`: URL del backend
  - `VITE_APP_STORAGE_KEY`: Clave de almacenamiento local

¡Listo para crear libros profesionales de sopas de letras! 🎉 
