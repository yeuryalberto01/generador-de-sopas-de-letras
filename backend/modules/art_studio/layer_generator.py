"""
Layer Generator - Orquestador de generación por capas para Art Studio

Este módulo coordina la generación de cada capa del puzzle usando ComfyUI:
- Background: Fondo con gradientes/texturas
- Frame: Marco decorativo
- Illustrations: Elementos temáticos
- Grid Stylization: Estilización del grid de letras
"""

import json
import uuid
import asyncio
import aiohttp
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

COMFYUI_API = "http://127.0.0.1:8188"


class LayerType(Enum):
    BACKGROUND = "background"
    FRAME = "frame"
    ILLUSTRATIONS = "illustrations"
    GRID = "grid"
    TITLE = "title"
    WORDLIST = "wordlist"
    OVERLAY = "overlay"


@dataclass
class LayerResult:
    """Resultado de generación de una capa"""
    layer_type: LayerType
    image_data: Optional[str] = None  # Base64
    image_path: Optional[str] = None
    success: bool = False
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StylePlan:
    """Plan de estilo generado por la API de razonamiento"""
    theme: str
    color_palette: List[str]
    elements: List[str]
    frame_style: str
    title_style: str
    mood: str
    
    @classmethod
    def from_dict(cls, data: dict) -> "StylePlan":
        return cls(
            theme=data.get("theme", "default"),
            color_palette=data.get("color_palette", ["#ffffff", "#000000"]),
            elements=data.get("elements", []),
            frame_style=data.get("frame_style", "simple"),
            title_style=data.get("title_style", "bold"),
            mood=data.get("mood", "neutral")
        )


@dataclass
class PuzzleLayout:
    """Métricas espaciales del puzzle"""
    page_width: int
    page_height: int
    grid_x: float  # Porcentaje 0-100
    grid_y: float
    grid_width: float
    grid_height: float
    title_x: float
    title_y: float
    title_width: float
    title_height: float
    wordlist_x: float
    wordlist_y: float
    wordlist_width: float
    wordlist_height: float


class LayerGenerator:
    """Orquestador principal de generación por capas"""
    
    def __init__(self, comfyui_url: str = COMFYUI_API):
        self.comfyui_url = comfyui_url
        self.client_id = str(uuid.uuid4())
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def check_comfyui_ready(self) -> bool:
        """Verifica que ComfyUI esté listo"""
        try:
            session = await self._get_session()
            async with session.get(f"{self.comfyui_url}/system_stats") as resp:
                return resp.status == 200
        except:
            return False
    
    async def queue_prompt(self, workflow: dict) -> Optional[str]:
        """Envía un workflow a ComfyUI y retorna el prompt_id"""
        try:
            session = await self._get_session()
            payload = {
                "prompt": workflow,
                "client_id": self.client_id
            }
            async with session.post(
                f"{self.comfyui_url}/prompt",
                json=payload
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("prompt_id")
        except Exception as e:
            print(f"Error queueing prompt: {e}")
        return None
    
    async def wait_for_completion(self, prompt_id: str, timeout: int = 120) -> bool:
        """Espera a que un prompt termine de ejecutarse"""
        session = await self._get_session()
        start_time = asyncio.get_event_loop().time()
        
        while True:
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > timeout:
                return False
            
            try:
                async with session.get(f"{self.comfyui_url}/history/{prompt_id}") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if prompt_id in data:
                            return True
            except:
                pass
            
            await asyncio.sleep(0.5)
    
    async def get_images(self, prompt_id: str) -> List[bytes]:
        """Obtiene las imágenes generadas de un prompt"""
        session = await self._get_session()
        images = []
        
        try:
            async with session.get(f"{self.comfyui_url}/history/{prompt_id}") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if prompt_id in data:
                        outputs = data[prompt_id].get("outputs", {})
                        for node_id, node_output in outputs.items():
                            if "images" in node_output:
                                for img_info in node_output["images"]:
                                    filename = img_info["filename"]
                                    subfolder = img_info.get("subfolder", "")
                                    folder_type = img_info.get("type", "output")
                                    
                                    params = {
                                        "filename": filename,
                                        "subfolder": subfolder,
                                        "type": folder_type
                                    }
                                    async with session.get(
                                        f"{self.comfyui_url}/view",
                                        params=params
                                    ) as img_resp:
                                        if img_resp.status == 200:
                                            images.append(await img_resp.read())
        except Exception as e:
            print(f"Error getting images: {e}")
        
        return images
    
    def build_background_workflow(
        self, 
        style_plan: StylePlan,
        width: int = 816,
        height: int = 1056
    ) -> dict:
        """Construye workflow para generar fondo"""
        
        colors_str = ", ".join(style_plan.color_palette)
        prompt = f"""Beautiful {style_plan.theme} background, watercolor style, 
        soft gradient, {style_plan.mood} mood, color palette: {colors_str}, 
        subtle texture, professional illustration background, 
        no text, no letters, no words, abstract decorative"""
        
        negative = "text, letters, words, alphabet, numbers, ugly, blurry, low quality"
        
        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": 42,
                    "steps": 20,
                    "cfg": 7,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                }
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "dreamshaper_8.safetensors"
                }
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative,
                    "clip": ["4", 1]
                }
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                }
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "layer_background",
                    "images": ["8", 0]
                }
            }
        }
        
        return workflow
    
    def build_frame_workflow(
        self,
        style_plan: StylePlan,
        layout: PuzzleLayout
    ) -> dict:
        """Construye workflow para generar marco decorativo"""
        
        prompt = f"""{style_plan.frame_style} decorative frame border, 
        {style_plan.theme} theme, ornamental, elegant, 
        {style_plan.mood} style, transparent center, 
        frame around edges only, professional design"""
        
        negative = "text, letters, filled center, ugly, blurry"
        
        # Similar workflow pero con inpainting mask
        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": 123,
                    "steps": 20,
                    "cfg": 7,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                }
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "dreamshaper_8.safetensors"
                }
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": 816,
                    "height": 1056,
                    "batch_size": 1
                }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative,
                    "clip": ["4", 1]
                }
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                }
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "layer_frame",
                    "images": ["8", 0]
                }
            }
        }
        
        return workflow
    
    def build_illustrations_workflow(
        self,
        style_plan: StylePlan,
    ) -> dict:
        """Construye workflow para generar ilustraciones temáticas"""
        
        elements_str = ", ".join(style_plan.elements[:5])  # Max 5 elements
        prompt = f"""Cute {style_plan.theme} illustrations, 
        {elements_str}, scattered decorative elements, 
        {style_plan.mood} style, white background, 
        isolated objects, professional illustration, sprite sheet style"""
        
        negative = "text, letters, ugly, blurry, low quality, background"
        
        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": 456,
                    "steps": 25,
                    "cfg": 7,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                }
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": "dreamshaper_8.safetensors"
                }
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": 1024,
                    "height": 1024,
                    "batch_size": 1
                }
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                }
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative,
                    "clip": ["4", 1]
                }
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                }
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "layer_illustrations",
                    "images": ["8", 0]
                }
            }
        }
        
        return workflow
    
    async def generate_layer(
        self,
        layer_type: LayerType,
        style_plan: StylePlan,
        layout: Optional[PuzzleLayout] = None
    ) -> LayerResult:
        """Genera una capa específica"""
        
        result = LayerResult(layer_type=layer_type)
        
        try:
            # Construir workflow según tipo de capa
            if layer_type == LayerType.BACKGROUND:
                workflow = self.build_background_workflow(style_plan)
            elif layer_type == LayerType.FRAME:
                workflow = self.build_frame_workflow(style_plan, layout)
            elif layer_type == LayerType.ILLUSTRATIONS:
                workflow = self.build_illustrations_workflow(style_plan)
            else:
                result.error = f"Layer type {layer_type} not implemented yet"
                return result
            
            # Ejecutar workflow
            prompt_id = await self.queue_prompt(workflow)
            if not prompt_id:
                result.error = "Failed to queue prompt"
                return result
            
            # Esperar completación
            completed = await self.wait_for_completion(prompt_id, timeout=120)
            if not completed:
                result.error = "Timeout waiting for generation"
                return result
            
            # Obtener imágenes
            images = await self.get_images(prompt_id)
            if images:
                import base64
                result.image_data = base64.b64encode(images[0]).decode('utf-8')
                result.success = True
                result.metadata = {"prompt_id": prompt_id}
            else:
                result.error = "No images generated"
                
        except Exception as e:
            result.error = str(e)
        
        return result
    
    async def generate_all_layers(
        self,
        style_plan: StylePlan,
        layout: Optional[PuzzleLayout] = None
    ) -> Dict[LayerType, LayerResult]:
        """Genera todas las capas del puzzle"""
        
        results = {}
        
        # Generar capas en orden
        layer_order = [
            LayerType.BACKGROUND,
            LayerType.FRAME,
            LayerType.ILLUSTRATIONS,
        ]
        
        for layer_type in layer_order:
            print(f"Generating layer: {layer_type.value}")
            result = await self.generate_layer(layer_type, style_plan, layout)
            results[layer_type] = result
            
            if not result.success:
                print(f"Warning: Layer {layer_type.value} failed: {result.error}")
        
        return results


# Singleton instance
_generator: Optional[LayerGenerator] = None

def get_layer_generator() -> LayerGenerator:
    global _generator
    if _generator is None:
        _generator = LayerGenerator()
    return _generator
