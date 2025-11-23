from typing import List, Optional, Union
import sys
import os

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from services.sopa_generator import WordSearchGenerator  # noqa: E402
from database import get_db, Tema  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

router = APIRouter(prefix="/api/diagramacion", tags=["diagramacion"])

class GenerateRequest(BaseModel):
    tema_id: Optional[str] = None
    palabras: Optional[List[str]] = None
    grid_size: Optional[Union[int, str]] = None
    allow_diagonal: bool = True
    allow_reverse: bool = True
    word_box_style: Optional[str] = "columns"
    word_box_columns: Optional[int] = 3
    word_box_numbered: Optional[bool] = True

@router.post("/generate")
async def generar_sopa_de_letras(request: GenerateRequest, db: Session = Depends(get_db)):
    palabras_entrada: List[str] = []

    if request.tema_id:
        tema = db.query(Tema).filter(Tema.id == request.tema_id, Tema.deleted_at.is_(None)).first()
        if not tema:
            raise HTTPException(status_code=404, detail="Tema no encontrado")
        if not tema.palabras:
            raise HTTPException(status_code=422, detail="El tema no tiene palabras")
        palabras_entrada = [
            p.get("texto", "").strip() if isinstance(p, dict) else str(p).strip()
            for p in tema.palabras
        ]
    elif request.palabras:
        palabras_entrada = [p.strip() for p in request.palabras]
    else:
        raise HTTPException(status_code=400, detail="Debe proporcionar al menos una palabra o un tema_id")

    palabras_entrada = [p for p in palabras_entrada if p]
    if not palabras_entrada:
        raise HTTPException(status_code=422, detail="No hay palabras válidas")

    grid_size_val: Optional[int] = None
    if isinstance(request.grid_size, int):
        grid_size_val = request.grid_size
    elif isinstance(request.grid_size, str):
        if "x" in request.grid_size.lower():
            partes = request.grid_size.lower().split("x")
            try:
                nums = [int(p) for p in partes if p.isdigit() or p.strip().isdigit()]
                if nums:
                    grid_size_val = max(nums)
            except ValueError:
                grid_size_val = None
        else:
            try:
                grid_size_val = int(request.grid_size)
            except ValueError:
                grid_size_val = None

    try:
        generator = WordSearchGenerator(
            palabras_entrada,
            grid_size=grid_size_val,
            allow_diagonal=request.allow_diagonal,
            allow_reverse=request.allow_reverse,
        )
        resultado = generator.generate()
        resultado["grid_size"] = resultado.get("tamaño", generator.grid_size)
        resultado["tamaño"] = resultado.get("tamaño", generator.grid_size)
        resultado["word_box_style"] = request.word_box_style
        resultado["word_box_columns"] = request.word_box_columns
        resultado["word_box_numbered"] = request.word_box_numbered
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando la sopa: {str(e)}")
