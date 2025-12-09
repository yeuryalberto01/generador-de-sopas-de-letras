"""
Template Engine Router - API endpoints para el módulo de plantillas avanzado.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

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
        status = get_gpu_status_dict()
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

from .comfy_client import get_comfy_client, create_txt2img_workflow, create_img2img_workflow
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
    checkpoint: str = "v1-5-pruned-emaonly.safetensors"


class ComfyImg2ImgRequest(BaseModel):
    image_base64: str
    prompt: str
    negative_prompt: str = ""
    denoise: float = 0.75
    steps: int = 20
    cfg_scale: float = 7.0
    seed: int = -1
    checkpoint: str = "v1-5-pruned-emaonly.safetensors"


@router.get("/comfy/status")
async def get_comfy_status():
    """
    Verifica si ComfyUI está corriendo y disponible.
    """
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
        
        image_bytes = await client.generate_image(workflow, timeout=120.0)
        
        if image_bytes:
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
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
        
        image_bytes = await client.generate_image(workflow, timeout=120.0)
        
        if image_bytes:
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            return {
                "success": True,
                "image": image_base64
            }
        else:
            raise HTTPException(status_code=500, detail="No se pudo decorar el puzzle")
            
    except Exception as e:
        logger.error(f"Error decorando puzzle con ComfyUI: {e}")
        raise HTTPException(status_code=500, detail=str(e))
