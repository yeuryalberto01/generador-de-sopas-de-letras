# Puzzle Generator — Starter (ZIP)

Este paquete contiene:
- Frontend (Vite + React 18) con Splash `/`, Temas `/temas`, y placeholder `/diagramacion/:id`
- Servicios API y NetBadge de conexión
- Backend FastAPI de ejemplo con `/api/health` y `/api/temas`
- Proxy Vite configurado para `/api` → `http://127.0.0.1:8000`
- `.env.example` con variables

## Cómo correr

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
# (Opcional) activar Tailwind: npm i -D tailwindcss postcss autoprefixer
# y descomentar directivas en src/index.css
npm run dev
```

Abre `http://localhost:5173/`

## Rutas
- `/` Splash (Puzzle Generator)
- `/temas` Listado y selección (GET/POST `/api/temas`)
- `/diagramacion/:id` Placeholder

## Variables
- `.env.example` → copia a `.env` si quieres cambiar `VITE_API_BASE_URL` o `VITE_APP_STORAGE_KEY`.

¡Listo para adaptar con tu asistente de IA! 
