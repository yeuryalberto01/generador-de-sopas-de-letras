"""
Art Studio Router - Endpoints para generación artística por capas
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio

from modules.art_studio import (
    get_layer_generator,
    StylePlan,
    LayerType,
    PuzzleLayout
)

router = APIRouter(prefix="/api/art-studio", tags=["Art Studio"])


class GenerateLayerRequest(BaseModel):
    """Request para generar una capa"""
    layer_type: str  # "background", "frame", "illustrations"
    style_plan: Dict[str, Any]
    layout: Optional[Dict[str, Any]] = None


class GenerateAllLayersRequest(BaseModel):
    """Request para generar todas las capas"""
    style_plan: Dict[str, Any]
    layout: Optional[Dict[str, Any]] = None


class LayerResponse(BaseModel):
    """Respuesta de generación de capa"""
    layer_type: str
    success: bool
    image_data: Optional[str] = None  # Base64
    error: Optional[str] = None


class AnalyzeStyleRequest(BaseModel):
    """Request para análisis de estilo usando API de razonamiento"""
    user_prompt: str
    puzzle_theme: Optional[str] = None
    target_audience: Optional[str] = None


class StylePlanResponse(BaseModel):
    """Respuesta con plan de estilo"""
    theme: str
    color_palette: List[str]
    elements: List[str]
    frame_style: str
    title_style: str
    mood: str


@router.get("/health")
async def health_check():
    """Verifica estado del sistema de generación por capas"""
    generator = get_layer_generator()
    comfyui_ready = await generator.check_comfyui_ready()
    
    return {
        "status": "online" if comfyui_ready else "comfyui_offline",
        "comfyui_ready": comfyui_ready,
        "available_layers": [lt.value for lt in LayerType]
    }


@router.post("/generate-layer", response_model=LayerResponse)
async def generate_layer(request: GenerateLayerRequest):
    """Genera una capa específica"""
    
    generator = get_layer_generator()
    
    # Verificar ComfyUI
    if not await generator.check_comfyui_ready():
        raise HTTPException(status_code=503, detail="ComfyUI no está disponible")
    
    # Parsear tipo de capa
    try:
        layer_type = LayerType(request.layer_type)
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de capa inválido: {request.layer_type}"
        )
    
    # Crear StylePlan
    style_plan = StylePlan.from_dict(request.style_plan)
    
    # Crear Layout si se proporciona
    layout = None
    if request.layout:
        layout = PuzzleLayout(**request.layout)
    
    # Generar capa
    result = await generator.generate_layer(layer_type, style_plan, layout)
    
    return LayerResponse(
        layer_type=result.layer_type.value,
        success=result.success,
        image_data=result.image_data,
        error=result.error
    )


@router.post("/generate-all-layers")
async def generate_all_layers(request: GenerateAllLayersRequest):
    """Genera todas las capas del puzzle"""
    
    generator = get_layer_generator()
    
    # Verificar ComfyUI
    if not await generator.check_comfyui_ready():
        raise HTTPException(status_code=503, detail="ComfyUI no está disponible")
    
    # Crear StylePlan
    style_plan = StylePlan.from_dict(request.style_plan)
    
    # Crear Layout si se proporciona
    layout = None
    if request.layout:
        layout = PuzzleLayout(**request.layout)
    
    # Generar todas las capas
    results = await generator.generate_all_layers(style_plan, layout)
    
    return {
        "success": all(r.success for r in results.values()),
        "layers": {
            lt.value: {
                "success": r.success,
                "image_data": r.image_data,
                "error": r.error
            }
            for lt, r in results.items()
        }
    }


@router.post("/analyze-style", response_model=StylePlanResponse)
async def analyze_style(request: AnalyzeStyleRequest):
    """
    Analiza un prompt y genera un plan de estilo.
    Por ahora usa reglas simples, después integrará con API de razonamiento.
    """
    
    prompt_lower = request.user_prompt.lower()
    
    # Detección simple de temas
    if any(word in prompt_lower for word in ["mar", "océano", "peces", "submarino", "acuático"]):
        theme = "underwater_ocean"
        color_palette = ["#0077be", "#00a86b", "#87ceeb", "#ffd700"]
        elements = ["tropical_fish", "coral", "seaweed", "bubbles", "starfish"]
        frame_style = "rope_seashell"
        mood = "playful_educational"
    elif any(word in prompt_lower for word in ["tech", "programación", "código", "digital"]):
        theme = "tech_modern"
        color_palette = ["#1e3a5f", "#00d4ff", "#ffffff", "#0a0a0a"]
        elements = ["laptop", "lightbulb", "gear", "code_brackets"]
        frame_style = "geometric_minimal"
        mood = "professional_modern"
    elif any(word in prompt_lower for word in ["antiguo", "vintage", "pergamino", "clásico"]):
        theme = "vintage_antique"
        color_palette = ["#d4a574", "#8b4513", "#f5deb3", "#2f4f4f"]
        elements = ["scroll", "quill", "compass", "old_map"]
        frame_style = "ornate_classical"
        mood = "elegant_nostalgic"
    elif any(word in prompt_lower for word in ["niños", "infantil", "colorido", "divertido"]):
        theme = "kids_playful"
        color_palette = ["#ff6b6b", "#4ecdc4", "#ffe66d", "#95e1d3"]
        elements = ["stars", "balloons", "clouds", "rainbow"]
        frame_style = "rounded_fun"
        mood = "cheerful_energetic"
    else:
        theme = "default_clean"
        color_palette = ["#ffffff", "#333333", "#5c9ead", "#e8e8e8"]
        elements = ["decorative_corner", "simple_border"]
        frame_style = "simple_elegant"
        mood = "clean_professional"
    
    return StylePlanResponse(
        theme=theme,
        color_palette=color_palette,
        elements=elements,
        frame_style=frame_style,
        title_style="bold_shadow" if "niños" in prompt_lower else "elegant_serif",
        mood=mood
    )


# ============================================
# ENDPOINT HÍBRIDO: Gemini + ComfyUI
# ============================================

class HybridGenerateRequest(BaseModel):
    """Request para generación híbrida con Gemini + ComfyUI"""
    puzzle_title: str
    puzzle_theme: str
    words: List[str]
    target_audience: str = "general"
    generate_layers: bool = True  # Si es False, solo retorna el plan de Gemini


@router.post("/generate-hybrid")
async def generate_hybrid(request: HybridGenerateRequest):
    """
    🧠 Generación Híbrida: Gemini razona, ComfyUI ejecuta.
    
    Flujo:
    1. Gemini analiza el puzzle y genera un plan de diseño detallado
    2. ComfyUI genera cada capa usando los prompts de Gemini
    3. Retorna el plan + las imágenes generadas
    """
    from .hybrid_generator import get_hybrid_generator
    
    hybrid = get_hybrid_generator()
    generator = get_layer_generator() if request.generate_layers else None
    
    # Verificar ComfyUI si vamos a generar
    if request.generate_layers:
        if not await generator.check_comfyui_ready():
            raise HTTPException(status_code=503, detail="ComfyUI no está disponible")
    
    # Ejecutar generación híbrida
    result = await hybrid.generate_complete_design(
        puzzle_title=request.puzzle_title,
        puzzle_theme=request.puzzle_theme,
        words=request.words,
        target_audience=request.target_audience,
        comfyui_generator=generator
    )
    
    return result


# ============================================
# ENDPOINTS DE APRENDIZAJE CONTINUO
# ============================================

class SaveExampleRequest(BaseModel):
    """Request para guardar un ejemplo de entrenamiento"""
    puzzle_title: str
    puzzle_theme: str
    words: List[str]
    target_audience: str
    design_plan: Dict[str, Any]
    prompts: Dict[str, str]


class FeedbackRequest(BaseModel):
    """Request para agregar feedback a un ejemplo"""
    example_id: str
    rating: int  # -1 = dislike, 0 = neutral, 1 = like
    feedback_text: Optional[str] = None
    feedback_tags: Optional[List[str]] = None
    problems: Optional[List[str]] = None  # NUEVO: problemas identificados
    improvements_needed: Optional[List[str]] = None  # NUEVO: mejoras necesarias


@router.post("/training/save-example")
async def save_training_example(request: SaveExampleRequest):
    """
    💾 Guarda una generación exitosa como ejemplo de entrenamiento.
    El sistema aprenderá de este ejemplo para mejorar futuras generaciones.
    """
    from .training_memory import get_training_memory
    
    training = get_training_memory()
    example_id = training.save_generation(
        puzzle_title=request.puzzle_title,
        puzzle_theme=request.puzzle_theme,
        words=request.words,
        target_audience=request.target_audience,
        design_plan=request.design_plan,
        prompts=request.prompts
    )
    
    return {
        "success": True,
        "example_id": example_id,
        "message": "Ejemplo guardado para entrenamiento"
    }


@router.post("/training/feedback")
async def add_training_feedback(request: FeedbackRequest):
    """
    👍/👎 Agrega feedback del usuario a un ejemplo de entrenamiento.
    
    Para feedback NEGATIVO, incluye:
    - problems: Lista de problemas (ej: ["ilegible", "colores opacos"])
    - improvements_needed: Lista de mejoras (ej: ["más contraste", "mejor espaciado"])
    
    El sistema aprenderá qué HACER y qué NO HACER.
    """
    from .training_memory import get_training_memory
    
    training = get_training_memory()
    success = training.add_feedback(
        example_id=request.example_id,
        rating=request.rating,
        feedback_text=request.feedback_text,
        feedback_tags=request.feedback_tags,
        problems=request.problems,
        improvements_needed=request.improvements_needed
    )
    
    return {
        "success": success,
        "message": "Feedback registrado" if success else "Ejemplo no encontrado"
    }


@router.get("/training/stats")
async def get_training_stats():
    """
    📊 Obtiene estadísticas del sistema de aprendizaje.
    """
    from .training_memory import get_training_memory
    
    training = get_training_memory()
    stats = training.get_stats()
    
    return stats


@router.get("/training/examples")
async def get_training_examples(limit: int = 10, positive_only: bool = False):
    """
    📋 Obtiene los ejemplos de entrenamiento guardados.
    """
    from .training_memory import get_training_memory
    
    training = get_training_memory()
    
    if positive_only:
        examples = training.get_positive_examples(limit)
    else:
        examples = training._examples[:limit]
    
    return {
        "count": len(examples),
        "examples": [
            {
                "id": ex.id,
                "title": ex.puzzle_title,
                "theme": ex.puzzle_theme,
                "rating": ex.rating,
                "art_style": ex.design_plan.get("art_style", "unknown")
            }
            for ex in examples
        ]
    }


# ============================================
# ENDPOINTS DEL DIRECTOR HÍBRIDO
# ============================================

@router.get("/director/test_ping")
def test_ping():
    return {"status": "alive"}


class DirectorBriefRequest(BaseModel):
    """Request para el Director Híbrido"""
    tema: str
    publico: str
    estilo: str
    titulo: str
    palabras: List[str]
    modo: str = "explorar"  # "explorar" o "producir"
    
    # Datos de la grilla
    grilla_letters: Optional[List[List[str]]] = None
    
    # Opcionales
    referencias: Optional[List[str]] = None  # base64 images
    paleta: Optional[List[str]] = None  # hex colors
    seed: Optional[int] = None # Semilla fija


class DirectorFeedbackRequest(BaseModel):
    """Request para feedback del Director"""
    generation_id: str
    rating: int  # -1 = rechazar, 1 = aprobar
    feedback_text: Optional[str] = None
    problems: Optional[List[str]] = None
    improvements_needed: Optional[List[str]] = None


@router.post("/director/generate")
async def director_generate(request: DirectorBriefRequest):
    """
    🎬 Endpoint principal del Director Híbrido.
    
    Ejecuta el pipeline completo:
    1. Planifica etapas según el brief
    2. Genera por capas (FONDO → GRILLA → TÍTULO → MÁRGENES)
    3. Ensambla
    4. Aplica QC
    5. Guarda para aprendizaje
    """
    import traceback
    try:
        from .hybrid_director import get_hybrid_director
        from .intent_planner import Brief, GenerationMode
        
        director = get_hybrid_director()
        
        # Crear Brief
        brief = Brief(
            tema=request.tema,
            publico=request.publico,
            estilo=request.estilo,
            modo=GenerationMode.EXPLORAR if request.modo == "explorar" else GenerationMode.PRODUCIR,
            titulo=request.titulo,
            palabras=request.palabras,
            grilla_data={
                "letters": request.grilla_letters or [["A", "B"], ["C", "D"]]
            },
            referencias=request.referencias or [],
            paleta=request.paleta or [],
            seed=request.seed # [NUEVO]
        )
        
        # Ejecutar pipeline
        result = await director.generar(brief)
        
        return {
            "success": result.success,
            "generation_id": result.generation_id,
            "stages_completed": [s.value for s in result.stages_completed],
            "final_image": result.final_image,
            "plan": result.plan, # [FRONTEND SYNC]
            "qc_result": {
                "passed": result.qc_result.passed,
                "grid_integrity": result.qc_result.grid_integrity,
                "title_contrast": result.qc_result.title_contrast,
                "visual_load": result.qc_result.visual_load,
                "issues": result.qc_result.issues,
            } if result.qc_result else None,
            "metadata": result.metadata, # [DEBUG/VISION]
            "prompts_used": result.prompts_used, # [DEBUG/EXPANSION]
            "errors": result.errors,
        }
    except Exception as e:
        error_msg = f"CRITICAL ERROR in Director: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return {
            "success": False,
            "errors": [error_msg],
            "generation_id": "error",
            "stages_completed": [],
            "final_image": None,
            "plan": None,
            "qc_result": None,
            "metadata": {},
            "prompts_used": {}
        }


@router.post("/director/feedback")
async def director_feedback(request: DirectorFeedbackRequest):
    """
    🧠 Registra feedback para una generación del Director.
    
    El sistema aprende de:
    - rating > 0: Qué estilos/paletas funcionan (IMITAR)
    - rating < 0: Qué problemas evitar (NO HACER)
    """
    from .hybrid_director import get_hybrid_director
    
    director = get_hybrid_director()
    
    director.aprender_de_feedback(
        generation_id=request.generation_id,
        rating=request.rating,
        feedback_text=request.feedback_text,
        problems=request.problems,
        improvements_needed=request.improvements_needed
    )
    
    return {
        "success": True,
        "message": "Feedback registrado, el sistema aprenderá de esto"
    }


# Exportar router
art_studio_router = router
