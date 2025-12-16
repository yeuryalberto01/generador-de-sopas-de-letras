"""
ComfyUI Client - Integración con ComfyUI API para generación de imágenes local.
ComfyUI debe estar corriendo en http://127.0.0.1:8188
"""

import json
import time
import uuid
import asyncio
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
import httpx
from modules.brain.learning_engine import load_rules

def get_visual_rules_tokens() -> str:
    try:
        brain = load_rules()
        rules = [r.content for r in brain.rules if r.active and r.type in ['visual', 'global']]
        if rules:
             # Convert to weighted tokens, assuming standard comma separation
             return ", ".join([f"({r}:1.1)" for r in rules])
    except Exception as e:
        logger.warning(f"Failed to load visual rules: {e}")
    return ""

logger = logging.getLogger(__name__)


class ComfyUIClient:
    """Cliente para interactuar con la API de ComfyUI"""
    
    def __init__(self, host: str = "127.0.0.1", port: int = 8188):
        self.base_url = f"http://{host}:{port}"
        self.client_id = str(uuid.uuid4())
        self._connected = False
    
    async def is_available(self) -> bool:
        """Verificar si ComfyUI está corriendo"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/system_stats")
                if response.status_code == 200:
                    self._connected = True
                    return True
                else:
                    logger.warning(f"ComfyUI check returned {response.status_code}")
                    self._connected = False
                    return False
        except Exception as e:
            logger.error(f"ComfyUI connection failed: {e}")
            self._connected = False
            return False
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas del sistema (GPU, VRAM, etc.)"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/system_stats")
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
        return {}
    
    async def queue_prompt(self, workflow: Dict[str, Any]) -> Optional[str]:
        """
        Enviar un workflow a la cola de ComfyUI.
        Retorna el prompt_id para tracking.
        """
        try:
            payload = {
                "prompt": workflow,
                "client_id": self.client_id
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/prompt",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("prompt_id")
                else:
                    logger.error(f"Queue prompt failed: {response.text}")
                    
        except Exception as e:
            logger.error(f"Error queuing prompt: {e}")
        
        return None
    
    async def get_history(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Obtener el resultado de un prompt completado"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/history/{prompt_id}")
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            logger.error(f"Error getting history: {e}")
        return None
    
    async def get_image(self, filename: str, subfolder: str = "", folder_type: str = "output") -> Optional[bytes]:
        """Descargar una imagen generada"""
        try:
            params = {
                "filename": filename,
                "subfolder": subfolder,
                "type": folder_type
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/view",
                    params=params
                )
                
                if response.status_code == 200:
                    return response.content
                    
        except Exception as e:
            logger.error(f"Error getting image: {e}")
        
        return None
    
    async def wait_for_completion(
        self, 
        prompt_id: str, 
        timeout: float = 300.0,
        poll_interval: float = 0.5
    ) -> Optional[Dict[str, Any]]:
        """
        Esperar a que un prompt se complete.
        Retorna el historial cuando está listo.
        """
        start_time = time.time()
        
        while (time.time() - start_time) < timeout:
            history = await self.get_history(prompt_id)
            
            if history and prompt_id in history:
                return history[prompt_id]
            
            await asyncio.sleep(poll_interval)
        
        logger.warning(f"Timeout waiting for prompt {prompt_id}")
        return None
    
    async def generate_image(
        self,
        workflow: Dict[str, Any],
        timeout: float = 300.0
    ) -> Optional[bytes]:
        """
        Ejecutar un workflow completo y obtener la imagen resultante.
        """
        # Enviar a la cola
        prompt_id = await self.queue_prompt(workflow)
        if not prompt_id:
            return None
        
        # Esperar completación
        result = await self.wait_for_completion(prompt_id, timeout)
        if not result:
            return None
        
        # Extraer información de la imagen
        try:
            outputs = result.get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output:
                    for image_info in node_output["images"]:
                        filename = image_info.get("filename")
                        subfolder = image_info.get("subfolder", "")
                        if filename:
                            return await self.get_image(filename, subfolder)
        except Exception as e:
            logger.error(f"Error extracting image: {e}")
        
        return None


# === Workflows predefinidos ===


def create_txt2img_workflow(
    prompt: str,
    negative_prompt: str = "",
    width: int = 512,
    height: int = 512,
    steps: int = 20,
    cfg_scale: float = 7.0,
    seed: int = -1,
    checkpoint: str = "v1-5-pruned-emaonly-fp16.safetensors",
    clip_skip: Optional[int] = None
) -> Dict[str, Any]:
    """
    Crear un workflow básico de texto a imagen.
    Compatible con SD 1.5 y checkpoints similares (soporta CLIP Skip).
    """
    
    if seed == -1:
        import random
        seed = random.randint(0, 2**32 - 1)
    
    # Determinar fuente de CLIP (Directo del Checkpoint o via CLIP Skip)
    clip_source = ["1", 1]

    # Rule Injection
    rule_tokens = get_visual_rules_tokens()
    if rule_tokens:
        prompt = f"{prompt}, {rule_tokens}"
    
    # [FIX SKETCH STYLE] - Enforce sketch style logic if detected in prompt
    prompt_lower = prompt.lower()
    if "sketch" in prompt_lower or "boceto" in prompt_lower or "drawing" in prompt_lower:
        # Strong enforcement for sketch style
        prompt = f"{prompt}, (rough pencil sketch, hand drawn, graphite on paper, unfinished, monochromatic, paper texture:1.3)"
        
        # Override negative prompt to block standard "photo" bias
        negative_prompt = f"{negative_prompt}, (3d render, cgi, digital painting, colorful, photo, realistic:1.4), (smooth, shiny:1.2)"
        
        # Suggest compatible checkpoint if not specified (optional logic, relying on Prompt override mainly)
        
    workflow = {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": checkpoint
            }
        }
    }
    
    # Insertar nodo CLIP Skip si es necesario
    if clip_skip is not None:
        workflow["100"] = { # ID arbitrario pero seguro
            "class_type": "CLIPSetLastLayer",
            "inputs": {
                "stop_at_clip_layer": -clip_skip,
                "clip": ["1", 1]
            }
        }
        clip_source = ["100", 0]

    workflow.update({
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt,
                "clip": clip_source
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": negative_prompt,
                "clip": clip_source
            }
        },
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            }
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg_scale,
                "sampler_name": "dpmpp_2m" if "Realistic" in checkpoint else "euler", # Auto-switch sampler suggestion
                "scheduler": "karras" if "Realistic" in checkpoint else "normal",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            }
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2]
            }
        },
        "7": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "sopa_letras",
                "images": ["6", 0]
            }
        }
    })
    
    return workflow


def create_img2img_workflow(
    image_base64: str,
    prompt: str,
    negative_prompt: str = "",
    denoise: float = 0.75,
    steps: int = 20,
    cfg_scale: float = 7.0,
    seed: int = -1,
    checkpoint: str = "v1-5-pruned-emaonly-fp16.safetensors",
    clip_skip: Optional[int] = None
) -> Dict[str, Any]:
    """
    Crear un workflow de imagen a imagen (img2img).
    Útil para decorar puzzles existentes.
    """
    
    if seed == -1:
        import random
        seed = random.randint(0, 2**32 - 1)
        
    clip_source = ["1", 1]
    
    workflow = {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": checkpoint
            }
        }
    }
    
    if clip_skip is not None:
        workflow["100"] = {
            "class_type": "CLIPSetLastLayer",
            "inputs": {
                "stop_at_clip_layer": -clip_skip,
                "clip": ["1", 1]
            }
        }
        clip_source = ["100", 0]

    workflow.update({
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt,
                "clip": clip_source
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": negative_prompt,
                "clip": clip_source
            }
        },
        "4": {
            "class_type": "LoadImageBase64",
            "inputs": {
                "image": image_base64
            }
        },
        "5": {
            "class_type": "VAEEncode",
            "inputs": {
                "pixels": ["4", 0],
                "vae": ["1", 2]
            }
        },
        "6": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg_scale,
                "sampler_name": "euler", # Mantener simple para img2img por ahora
                "scheduler": "normal",
                "denoise": denoise,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["5", 0]
            }
        },
        "7": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["6", 0],
                "vae": ["1", 2]
            }
        },
        "8": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "sopa_decorated",
                "images": ["7", 0]
            }
        }
    })
    
    return workflow

def create_background_workflow(
    prompt: str,
    negative_prompt: str = "",
    width: int = 512,
    height: int = 768, # Vertical by default for pages
    steps: int = 25,
    cfg_scale: float = 8.0,
    seed: int = -1,
    checkpoint: str = "v1-5-pruned-emaonly-fp16.safetensors",
    clip_skip: Optional[int] = None
) -> Dict[str, Any]:
    """
    Crear un workflow optimizado para FONDOS de página.
    Fuerza la creación de marcos/bordes y espacio central limpio.
    """
    
    if seed == -1:
        import random
        seed = random.randint(0, 2**32 - 1)
        
    # Inyectar ingeniería de prompts para asegurar el layout (FRAME STRATEGY)
    rule_tokens = get_visual_rules_tokens()
    
    layout_prompt = f"{prompt}, {rule_tokens}, (empty center:1.5), (white space in the middle:1.4), (frame border composition:1.4), (vignette style:1.3), page layout, background illustration, solid center background"
    layout_negative = f"{negative_prompt}, (text:1.5), (letters:1.5), (watermark:1.5), (busy center:1.6), (object in center:1.6), (character in middle:1.6), complex pattern in center"
    
    clip_source = ["1", 1]
    
    workflow = {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": checkpoint
            }
        }
    }
    
    if clip_skip is not None:
        workflow["100"] = {
            "class_type": "CLIPSetLastLayer",
            "inputs": {
                "stop_at_clip_layer": -clip_skip,
                "clip": ["1", 1]
            }
        }
        clip_source = ["100", 0]

    workflow.update({
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": layout_prompt,
                "clip": clip_source
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": layout_negative,
                "clip": clip_source
            }
        },
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": width,
                "height": height,
                "batch_size": 1
            }
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg_scale,
                # Smart Sampler selection
                "sampler_name": "dpmpp_2m" if "Realistic" in checkpoint else "euler_ancestral",
                "scheduler": "karras",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0]
            }
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2]
            }
        },
        "7": {
            "class_type": "SaveImage",
            "inputs": {
                "filename_prefix": "sopa_background",
                "images": ["6", 0]
            }
        }
    })
    
    return workflow

# Singleton instance

# Singleton instance
_comfy_client: Optional[ComfyUIClient] = None


def get_comfy_client() -> ComfyUIClient:
    """Obtener instancia singleton del cliente ComfyUI"""
    global _comfy_client
    if _comfy_client is None:
        _comfy_client = ComfyUIClient()
    return _comfy_client
