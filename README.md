# Generador de Sopas de Letras

Aplicación web para crear y gestionar sopas de letras.

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

## 📚 Estructura del Proyecto

```
/
├── src/                    # Frontend (React + Vite)
│   ├── components/         # Componentes reutilizables
│   ├── modules/           # Módulos/páginas
│   └── services/          # Servicios API
├── main.py                # Backend (FastAPI)
├── requirements.txt       # Dependencias Python
└── package.json          # Dependencias Node
```

## 🌐 URLs Disponibles

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 💻 Desarrollo

- El backend usa FastAPI y guarda los temas en memoria
- El frontend usa React + Vite con proxy a la API
- La UI muestra un badge de conexión en tiempo real

## ⚙️ Configuración

- **Puerto Backend**: 8000 (configurable en launcher.ps1)
- **Puerto Frontend**: 5173 (automático por Vite)
- **API Base URL**: /api (configurado en vite.config.js)