from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.sopa_generator import WordSearchGenerator

router = APIRouter(prefix="/api/diagramacion", tags=["diagramacion"])

class GenerateRequest(BaseModel):
    palabras: List[str]

@router.post("/generate")
async def generar_sopa_de_letras(request: GenerateRequest):
    if not request.palabras or len(request.palabras) == 0:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos una palabra")

    try:
        generator = WordSearchGenerator(request.palabras)
        resultado = generator.generate()
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando la sopa: {str(e)}")