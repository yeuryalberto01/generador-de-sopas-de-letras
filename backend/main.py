from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai
from modules.template_engine.router import router as template_engine_router
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Sopa de Letras AI Backend", version="1.0.0")

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
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(template_engine_router, prefix="/api", tags=["Template Engine"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Sopa de Letras AI Backend Running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    # Force reload trigger
