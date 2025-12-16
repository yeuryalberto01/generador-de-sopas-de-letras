"""
Template Engine Router - API endpoints para el módulo de plantillas avanzado.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
import os

from .gpu_manager import get_gpu_status_dict, get_gpu_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/template-engine", tags=["Template Engine"])


@router.get("/status")
async def get_module_status() -> Dict[str, Any]:
    """
    Obtiene el estado general del módulo Template Engine.
    """
    return {
        "module": "Template Engine",
        "version": "1.0.0",
        "status": "active",
        "capabilities": [
            "gpu_detection",
            "style_analysis",
            "template_generation"
        ]
    }


@router.get("/gpu-status")
async def get_gpu_status() -> Dict[str, Any]:
    """
    Obtiene información detallada sobre las GPUs disponibles.
    Incluye: nombre, VRAM total/libre, soporte CUDA, etc.
    """
    try:
        manager = get_gpu_manager()
        # Use new async method directly
        status_obj = await manager.get_status_async()
        
        # Convert dataclass to dict safely
        from dataclasses import asdict
        status = asdict(status_obj)

        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        logger.error(f"Error obteniendo status GPU: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": {
                "has_nvidia": False,
                "has_cuda": False,
                "gpus": [],
                "recommended_device": "cpu",
                "can_run_ml": False
            }
        }


@router.post("/gpu/clear-cache")
async def clear_gpu_cache():
    """
    Libera la memoria GPU no utilizada.
    Útil después de operaciones pesadas.
    """
    try:
        manager = get_gpu_manager()
        manager.clear_cache()
        return {
            "success": True,
            "message": "Cache GPU liberado exitosamente"
        }
    except Exception as e:
        logger.error(f"Error liberando cache GPU: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gpu/memory-check/{required_gb}")
async def check_gpu_memory(required_gb: float):
    """
    Verifica si hay suficiente memoria GPU disponible.
    
    Args:
        required_gb: Cantidad de VRAM requerida en GB
    """
    manager = get_gpu_manager()
    has_enough = manager.allocate_memory(required_gb)
    status = get_gpu_status_dict()
    
    return {
        "required_gb": required_gb,
        "has_enough_memory": has_enough,
        "recommended_device": status["recommended_device"],
        "gpus": status["gpus"]
    }


# === ComfyUI Integration ===

# Imports consolidados abajo
from pydantic import BaseModel

from typing import Optional
import base64


class ComfyGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    width: int = 512
    height: int = 512
    steps: int = 20
    cfg_scale: float = 7.0
    seed: int = -1
    checkpoint: str = "v1-5-pruned-emaonly-fp16.safetensors"
    # Hybrid Mode Config
    smart_provider: str = "gemini" 
    smart_model: Optional[str] = None


class ComfyImg2ImgRequest(BaseModel):
    image_base64: str
    prompt: str
    negative_prompt: str = ""
    denoise: float = 0.75
    steps: int = 20
    cfg_scale: float = 7.0
    seed: int = -1
    checkpoint: str = "v1-5-pruned-emaonly-fp16.safetensors"


from .comfy_client import (
    ComfyUIClient, 
    create_txt2img_workflow, 
    create_img2img_workflow, 
    create_background_workflow
)

def get_comfy_client() -> ComfyUIClient:
    """Factory para obtener cliente configurado desde entorno"""
    host = os.environ.get("COMFYUI_HOST", "127.0.0.1")
    port = int(os.environ.get("COMFYUI_PORT", 8188))
    return ComfyUIClient(host=host, port=port)

@router.get("/comfy/status")
async def get_comfy_status():
    """
    Verifica si ComfyUI está corriendo y disponible.
    """
    logger.info("Checking ComfyUI status...")
    client = get_comfy_client()
    is_available = await client.is_available()
    
    result = {
        "available": is_available,
        "url": client.base_url
    }
    
    if is_available:
        stats = await client.get_system_stats()
        result["system_stats"] = stats
    
    return result


@router.post("/comfy/generate")
async def comfy_generate_image(request: ComfyGenerateRequest):
    """
    Genera una imagen usando ComfyUI (txt2img).
    Requiere que ComfyUI esté corriendo.
    """
    client = get_comfy_client()
    
    if not await client.is_available():
        raise HTTPException(
            status_code=503,
            detail="ComfyUI no está disponible. Asegúrate de que esté corriendo en http://127.0.0.1:8188"
        )
    
    try:
        workflow = create_txt2img_workflow(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            steps=request.steps,
            cfg_scale=request.cfg_scale,
            seed=request.seed,
            checkpoint=request.checkpoint
        )
        
        image_bytes = await client.generate_image(workflow, timeout=600.0)
        
        if image_bytes:
            image_base64 = "data:image/png;base64," + base64.b64encode(image_bytes).decode('utf-8')
            return {
                "success": True,
                "image": image_base64
            }
        else:
            raise HTTPException(status_code=500, detail="No se pudo generar la imagen")
            
    except Exception as e:
        logger.error(f"Error generando imagen con ComfyUI: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/comfy/decorate")
async def comfy_decorate_puzzle(request: ComfyImg2ImgRequest):
    """
    Decora un puzzle existente usando ComfyUI (img2img).
    Envía la imagen del puzzle y aplica un estilo.
    """
    client = get_comfy_client()
    
    if not await client.is_available():
        raise HTTPException(
            status_code=503,
            detail="ComfyUI no está disponible. Inicia ComfyUI para usar GPU Boost."
        )
    
    try:
        workflow = create_img2img_workflow(
            image_base64=request.image_base64,
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            denoise=request.denoise,
            steps=request.steps,
            cfg_scale=request.cfg_scale,
            seed=request.seed,
            checkpoint=request.checkpoint
        )
        
        image_bytes = await client.generate_image(workflow, timeout=600.0)
        
        if image_bytes:
            image_base64 = "data:image/png;base64," + base64.b64encode(image_bytes).decode('utf-8')
            return {
                "success": True,
                "image": image_base64
            }
        else:
            raise HTTPException(status_code=500, detail="No se pudo decorar el puzzle")
            
    except Exception as e:
        logger.error(f"Error decorando puzzle con ComfyUI: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/comfy/background")
async def comfy_generate_background(request: ComfyGenerateRequest):
    """
    Genera un FONDO optimizado (con espacio central) usando ComfyUI.
    """
    client = get_comfy_client()
    
    if not await client.is_available():
        raise HTTPException(
            status_code=503,
            detail="ComfyUI no está disponible."
        )
    
    try:
        workflow = create_background_workflow(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            width=request.width,
            height=request.height,
            steps=request.steps,
            cfg_scale=request.cfg_scale,
            seed=request.seed,
            checkpoint=request.checkpoint
        )
        
        image_bytes = await client.generate_image(workflow, timeout=600.0)
        
        if image_bytes:
            image_base64 = "data:image/png;base64," + base64.b64encode(image_bytes).decode('utf-8')
            return {
                "success": True,
                "image": image_base64
            }
        else:
            raise HTTPException(status_code=500, detail="No se pudo generar el fondo")
            
    except Exception as e:
        logger.error(f"Error generando fondo con ComfyUI: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# === AI Integration (Internal) ===
from routers.ai import call_gemini, AIRequest

@router.post("/comfy/generate-smart")
async def comfy_smart_generate(request: ComfyGenerateRequest):
    """
    Generación Híbrida Inteligente:
    1. Gemini: Optimiza el prompt (Prompt Engineering).
    2. ComfyUI: Genera la imagen con settings avanzados (CLIP Skip, Samplers).
    """
    client = get_comfy_client()
    
    if not await client.is_available():
        raise HTTPException(status_code=503, detail="ComfyUI no está disponible.")
        
    try:
        # A. FASE DE PENSAMIENTO (Gemini)
        logger.info(f"Smart Generation: Optimizing prompt '{request.prompt}'...")
        
        system_instruction = (
            "You are an elite Stable Diffusion Prompt Engineer. "
            "Transform the user's simple concept into a professional photography prompt for Realistic Vision V6. "
            "Analyze the concept and also generate a specific NEGATIVE prompt to avoid frequent artifacts for this specific subject."
            "Output STRICTLY valid JSON with this format:"
            '{"positive": "YOUR_DETAILED_PROMPT", "negative": "YOUR_NEGATIVE_PROMPT"}'
        )
        
        gemini_req = AIRequest(
            provider=request.smart_provider, 
            model=request.smart_model, 
            prompt=f"{system_instruction}\n\nConcept: {request.prompt}",
            json_mode=True
        )
        
        optimized_prompt = request.prompt
        optimized_negative = request.negative_prompt
        
        try:
            # Llamada dinámica al proveedor seleccionado
            from routers.ai import call_openai_compatible
            
            if request.smart_provider == 'gemini':
                ai_response = await call_gemini(gemini_req, None)
            else:
                ai_response = await call_openai_compatible(gemini_req, None)

            text_response = ai_response["text"].strip()
            
            # Limpieza básica de markdown json
            if text_response.startswith("```json"):
                text_response = text_response[7:]
            if text_response.endswith("```"):
                text_response = text_response[:-3]
                
            import json
            smart_data = json.loads(text_response)
            
            optimized_prompt = smart_data.get("positive", request.prompt)
            # Merge smart negative with user negative if provided, or use smart one
            smart_neg = smart_data.get("negative", "")
            base_neg = request.negative_prompt or "cartoon, anime, 3d, sketch, bad quality, watermark, text"
            optimized_negative = f"{base_neg}, {smart_neg}" if smart_neg else base_neg
            
            logger.info(f"[{request.smart_provider}] Optimized Positive: {optimized_prompt}")
            
        except Exception as e:
            logger.error(f"Smart Optimization Failed ({request.smart_provider}): {e}. Using raw prompts.")
            # optimized_prompt y optimized_negative ya tienen valores fallback

        # B. FASE DE EJECUCIÓN (ComfyUI)
        # Determinar si necesitamos CLIP Skip (Standard para Realistic Vision)
        use_clip_skip = 2 if "Realistic" in request.checkpoint else None
        
        workflow = create_txt2img_workflow(
            prompt=optimized_prompt,
            negative_prompt=optimized_negative,
            width=request.width,
            height=request.height,
            steps=25, # Un poco más de calidad por defecto
            cfg_scale=6.0, # CFG más bajo para realismo
            seed=request.seed,
            checkpoint=request.checkpoint,
            clip_skip=use_clip_skip
        )
        
        image_bytes = await client.generate_image(workflow, timeout=600.0)
        
        if image_bytes:
            image_base64 = "data:image/png;base64," + base64.b64encode(image_bytes).decode('utf-8')
            
            # [LOGGING] Guardar en memoria de entrenamiento
            try:
                from modules.art_studio.training_memory import get_training_memory
                training = get_training_memory()
                training.save_generation(
                    puzzle_title="Smart Generation",
                    puzzle_theme=optimized_prompt, 
                    words=[],
                    target_audience="General",
                    design_plan={"engine": "smart_gen", "original_prompt": request.prompt},
                    prompts={"final": optimized_prompt},
                    images_b64={"final": base64.b64encode(image_bytes).decode('utf-8')}
                )
            except Exception as e:
                logger.error(f"Failed to save training example: {e}")

            return {
                "success": True,
                "image": image_base64,
                "optimized_prompt": optimized_prompt,
                "engine": "Gemini + ComfyUI"
            }
        else:
            raise HTTPException(status_code=500, detail="Fallo en generación ComfyUI")
            
    except Exception as e:
        logger.error(f"Smart Gen Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
