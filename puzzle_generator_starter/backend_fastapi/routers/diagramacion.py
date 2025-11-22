from typing import List, Optional
import sys
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.sopa_generator import WordSearchGenerator  # noqa: E402

router = APIRouter(prefix="/api/diagramacion", tags=["diagramacion"])

class GenerateRequest(BaseModel):
    palabras: List[str]
    grid_size: Optional[int] = None
    allow_diagonal: bool = True
    allow_reverse: bool = True

@router.post("/generate")
async def generar_sopa_de_letras(request: GenerateRequest):
    if not request.palabras or len(request.palabras) == 0:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos una palabra")

    try:
        generator = WordSearchGenerator(
            request.palabras,
            grid_size=request.grid_size,
            allow_diagonal=request.allow_diagonal,
            allow_reverse=request.allow_reverse,
        )
        resultado = generator.generate()
        resultado["grid_size"] = resultado.get("tamaño", generator.grid_size)
        resultado["tamaño"] = resultado.get("tamaño", generator.grid_size)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando la sopa: {str(e)}")
