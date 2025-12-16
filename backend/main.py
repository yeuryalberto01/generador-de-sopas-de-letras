
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai, ml
from modules.template_engine.router import router as template_engine_router
from modules.brain.learning_engine import router as brain_router
from modules.brain.smart_brain import router as smart_brain_router
from modules.art_studio.router import art_studio_router
import uvicorn

# Load .env explicitly from the backend directory
# Trigger reload [FORCE RELOAD TEST 2]
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

# Force reload trigger
app = FastAPI(title="Sopa de Letras AI API", version="1.0.0")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(ml.router)
app.include_router(template_engine_router, prefix="/api", tags=["Template Engine"])
app.include_router(brain_router)
app.include_router(smart_brain_router)  # Smart Brain ML endpoints
app.include_router(art_studio_router)  # Art Studio layer generation


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Sopa de Letras AI Backend Running", "engine": "active"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)