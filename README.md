# 🎯 Sistema de Creación e Impresión de Sopas de Letras

**Aplicación web completa para crear, gestionar y generar sopas de letras con persistencia de datos.**

## ✨ Características Principales

- 🎨 **Interfaz Moderna**: React + TailwindCSS con diseño responsive
- 🔧 **API REST Completa**: FastAPI con documentación automática
- 💾 **Persistencia JSON**: Base de datos local sin configuración
- 🎪 **Generador Inteligente**: Algoritmo de colocación de palabras
- 🧪 **Testing Completo**: Jest + Pytest con alta cobertura
- 📱 **Accesibilidad**: Cumple estándares WCAG con navegación por teclado
- 🎨 **Temas Personalizables**: CRUD completo de temas y palabras

## 🚀 Inicio Rápido

### Prerrequisitos

- Python 3.11 o superior
- Node.js 18 o superior
- PowerShell (para Windows)

### Instalación y Ejecución

1. **Método Simple (Recomendado)**

   Ejecuta el launcher que configura todo automáticamente:

   ```powershell
   .\launcher.ps1
   ```

   Esto:
   - Crea/activa el entorno virtual de Python
   - Instala todas las dependencias (Python y Node)
   - Inicia el backend y frontend
   - Muestra las URLs de acceso

2. **Método Manual**

   Si prefieres arrancar los servicios por separado:

   ```powershell
   # Backend (en una terminal)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000

   # Frontend (en otra terminal)
   npm install
   npm run dev
   ```

## 📚 Arquitectura del Sistema

```
/
├── 📁 puzzle_generator_starter/     # Aplicación principal
│   ├── 🎨 src/                      # Frontend (React + Vite)
│   │   ├── 🧩 components/           # Componentes reutilizables
│   │   │   ├── TemaCard.jsx        # Tarjetas de temas
│   │   │   ├── TemaGallery.jsx     # Galería de temas
│   │   │   └── Toast.jsx           # Notificaciones
│   │   ├── 📱 modules/             # Módulos principales
│   │   │   ├── 🏠 splash/          # Página de inicio
│   │   │   ├── 📝 temas/           # Gestión de temas
│   │   │   └── 🎯 diagramacion/    # Generador de puzzles
│   │   ├── 🔗 services/            # Servicios API
│   │   │   ├── apiClient.js        # Cliente HTTP
│   │   │   └── temas.js            # API de temas
│   │   └── 🧪 utils/               # Utilidades y tests
│   │       └── parseWords.js       # Procesamiento de palabras
│   ├── ⚙️ backend_fastapi/         # Backend (FastAPI)
│   │   ├── main.py                 # API principal (523 líneas)
│   │   ├── data/temas.json         # Base de datos JSON
│   │   └── requirements.txt        # Dependencias Python
│   └── 📋 package.json             # Dependencias Node.js
├── 🚀 start_server.py             # Script de inicio
├── 📝 README.md                    # Documentación
└── 🎯 launcher.ps1                 # Launcher automático
```

## 🌐 URLs Disponibles

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🎯 Funcionalidades Implementadas

### ✅ Módulo de Temas
- **CRUD Completo**: Crear, leer, actualizar y eliminar temas
- **Gestión de Palabras**: Agregar, editar y eliminar palabras por tema
- **Persistencia JSON**: Datos guardados automáticamente en `data/temas.json`
- **Validación**: Palabras únicas, temas sin duplicados
- **Interfaz Intuitiva**: Formularios con validación en tiempo real

### ✅ Módulo de Diagramación
- **Generador de Puzzles**: Algoritmo inteligente de colocación de palabras
- **Múltiples Direcciones**: Horizontal, vertical y diagonal
- **Configuración Flexible**: Tamaños de grid personalizables (10x10, 15x15, 20x20)
- **Dificultades**: Fácil, medio y difícil
- **Visualización**: Grid interactivo con resaltado de palabras
- **Exportación**: JSON con posiciones exactas de palabras

### ✅ API REST Completa
- **FastAPI**: Framework moderno con documentación automática
- **Endpoints**:
  - `GET/POST/PUT/DELETE /api/temas` - Gestión de temas
  - `POST /api/diagramacion/generate` - Generar puzzles
  - `GET /api/health` - Estado del sistema
- **Pydantic Models**: Validación automática de datos
- **CORS**: Configurado para desarrollo frontend

### ✅ Testing y Calidad
- **Frontend**: Jest con 24 tests ejecutándose
- **Backend**: Pytest con tests de integración
- **Linting**: ESLint + Pylint configurados
- **Cobertura**: Tests para componentes y utilidades

## 💻 Tecnologías Utilizadas

- **Frontend**: React 18.2.0 + Vite + TailwindCSS
- **Backend**: FastAPI + Pydantic + Uvicorn
- **Testing**: Jest + Pytest + React Testing Library
- **Calidad**: ESLint + Pylint + Prettier
- **Persistencia**: JSON local (sin base de datos externa)

## ⚙️ Configuración del Sistema

- **Puerto Backend**: 8001 (FastAPI + Uvicorn)
- **Puerto Frontend**: 5174 (Vite dev server)
- **API Base URL**: `/api` (proxy configurado)
- **Base de Datos**: JSON local en `backend_fastapi/data/temas.json`
- **Entorno**: Python virtual environment (`.venv`)

## 📊 Estadísticas del Proyecto

- **📁 Archivos**: 76 archivos versionados
- **📝 Líneas de Código**: 27,084 líneas
- **🧪 Tests**: 24 tests ejecutándose correctamente
- **✅ Linting**: Código limpio sin errores
- **🔗 Commit**: `c2915ad` - Sistema completo funcional

## 🚀 Despliegue

### Opción 1: Launcher Automático (Recomendado)
```powershell
.\launcher.ps1
```

### Opción 2: Inicio Manual
```powershell
# Terminal 1: Backend
cd puzzle_generator_starter/backend_fastapi
python main.py

# Terminal 2: Frontend
cd puzzle_generator_starter
npm run dev
```

## 🌐 Acceder a la Aplicación

- **🏠 Frontend**: http://localhost:5174
- **🔧 API Backend**: http://localhost:8001
- **📚 Documentación API**: http://localhost:8001/docs
- **❤️ Health Check**: http://localhost:8001/api/health