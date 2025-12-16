"""
Art Studio ComfyUI Client - Cliente inteligente para generación de capas

Usa SmartWorkflowBuilder para construir workflows dinámicamente
y los envía a ComfyUI para generación.
"""

import base64
import asyncio
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

# Importar el cliente base existente
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent / "template_engine"))

from modules.template_engine.comfy_client import ComfyUIClient, get_comfy_client
from .smart_workflow_builder import get_workflow_builder, SmartWorkflowBuilder
from .stage_generators import get_stage_generators, MaskGenerator
from .node_switcher import get_node_switcher


@dataclass
class GenerationResult:
    """Resultado de generación de una capa"""
    success: bool
    image_data: Optional[str] = None  # base64
    error: Optional[str] = None
    workflow_used: Optional[str] = None  # Resumen del workflow
    seed: Optional[int] = None
    params: Optional[Dict[str, Any]] = None


class ArtStudioComfyClient:
    """
    Cliente inteligente de ComfyUI para Art Studio.
    
    Construye workflows dinámicamente según el contexto:
    - Fondo: txt2img básico o con IPAdapter
    - Márgenes: Inpainting con máscara
    - Upscale: ESRGAN al final
    """
    
    def __init__(self):
        self.client = get_comfy_client()
        self.builder = get_workflow_builder()
        self.stage_gen = get_stage_generators()
        self.mask_gen = MaskGenerator()
    
    async def is_ready(self) -> bool:
        """Verifica si ComfyUI está disponible"""
        return await self.client.is_available()
    
    async def generate_background(
        self,
        prompt: str,
        style: str,
        color_palette: List[str],
        width: int = 816,
        height: int = 1056,
        reference_image: Optional[str] = None,
        grid_area: Optional[tuple] = None,
        # [TECH OVERRIDES]
        checkpoint: Optional[str] = None,
        sampler: Optional[str] = None,
        scheduler: Optional[str] = None,
        seed: Optional[int] = None # [NUEVO]
    ) -> GenerationResult:
        """
        Genera fondo decorativo usando ComfyUI con modo 'Rich Background'.
        Permite ilustraciones completas con efecto viñeta suave para el texto.
        """
        print(f"🎨 [ART-COMFY] Generating Rich Background: {style}")
        
        if not await self.is_ready():
            return GenerationResult(success=False, error="ComfyUI no está disponible")
        
        import random
        final_seed = seed if seed is not None else random.randint(0, 2**32 - 1)
        print(f"    🎲 Seed: {final_seed} {'(Fijo)' if seed else '(Aleatorio)'}")
        
        # Construir prompt enfatizando la ilustración
        # No usamos 'empty center' agresivo, sino 'vignette' y 'subtle center'
        base_prompt = self._build_background_prompt(prompt, style, color_palette)
        
        # Ajustar prompt para permitir ilustración central pero suave
        rich_prompt = f"{base_prompt}, full illustration, atmospheric, immersive, (faded center:1.2), (text friendly composition:1.1)"
        negative = "text, letters, words, watermark, blurry, ugly, deformed, (solid white background:1.4), (completely empty center:1.4)"
        
        print(f"    📝 Prompt: {rich_prompt[:100]}...")
        
        # Seleccionar checkpoint según estilo
        checkpoint_name = checkpoint or "dreamshaper_8.safetensors" # Default para arte/fantasía
        
        style_lower = style.lower()
        prompt_lower = prompt.lower()
        
        if not checkpoint: # Solo aplicar lógica automática si no hay override
            # Keywords que activan modo realista
            realistic_triggers = [
                "editorial", "realist", "photo", "camera", "clean", 
                "minimalist", "modern", "scan", "magazine"
            ]
            
            if any(trigger in style_lower for trigger in realistic_triggers) or \
               any(trigger in prompt_lower for trigger in realistic_triggers):
                checkpoint_name = "Realistic_Vision_V6.0_NV_B1.safetensors"
                print(f"    📸 Estilo Realista/Editorial detectado -> Usando: {checkpoint_name}")
            elif "sketch" in style_lower or "boceto" in style_lower or "drawing" in style_lower:
                # ESTILO BOCETO / DIBUJO
                checkpoint_name = "dreamshaper_8.safetensors"
                print(f"    ✏️ Estilo Boceto detectado -> Usando: {checkpoint_name}")
                # Enfatizar trazos y papel, evitar "digital art" y "3d"
                rich_prompt = f"(masterpiece, best quality, traditional art:1.2), {rich_prompt}, (rough sketch, pencil strokes, graphite, paper texture:1.3)"
                # Ensure negative prompt kills 3D/Color if needed
                negative += ", (3d render, cgi, digital painting, colorful, photo:1.4)"
            else:
                # FANTASÍA / ARTE DIGITAL
                checkpoint_name = "dreamshaper_8.safetensors"
                print(f"    🎨 Estilo Fantasía/Arte detectado -> Usando: {checkpoint_name}")
                
                # Enriquecer prompt para asegurar look de pintura digital de alta calidad
                # y evitar el look "mala foto"
                rich_prompt = f"(masterpiece, best quality, digital art, fantasy concept art:1.2), {rich_prompt}, (magical atmosphere, artistic lighting)"
            
        import random
        seed = random.randint(0, 2**32 - 1)
        
        # Sampler defaults
        final_sampler = sampler or "dpmpp_2m"
        final_scheduler = scheduler or "karras"
        
        workflow = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": checkpoint_name}
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": rich_prompt, "clip": ["1", 1]}
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": negative, "clip": ["1", 1]}
            },
            "4": {
                "class_type": "EmptyLatentImage",
                "inputs": {"width": width, "height": height, "batch_size": 1}
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": final_seed,
                    "steps": 25,
                    "cfg": 7.0,
                    "sampler_name": final_sampler,
                    "scheduler": final_scheduler,
                    "denoise": 1.0,
                    "model": ["1", 0],
                    "positive": ["2", 0],
                    "negative": ["3", 0],
                    "latent_image": ["4", 0]
                }
            },
            "6": {
                "class_type": "VAEDecode",
                "inputs": {"samples": ["5", 0], "vae": ["1", 2]}
            },
            "7": {
                "class_type": "SaveImage",
                "inputs": {"filename_prefix": "art_studio_rich_bg", "images": ["6", 0]}
            }
        }
        
        # Inyectar ControlNet Tile/Blur si quisiéramos forzar estructura (opcional futuro)
        
        summary = "Rich Background (Custom Workflow)"
        print(f"    📋 {summary}")
        
        try:
            image_bytes = await self.client.generate_image(workflow, timeout=180)
            
            if image_bytes:
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                print(f"    ✅ Imagen generada: {len(image_bytes)} bytes")
                return GenerationResult(
                    success=True,
                    image_data=image_b64,
                    workflow_used=summary,
                    seed=seed
                )
            else:
                return GenerationResult(success=False, error="ComfyUI no retornó imagen")
                
        except Exception as e:
            print(f"    ⚠️ Error generating background: {e}")
            return GenerationResult(success=False, error=str(e))
            
    async def generate_asset(
        self,
        prompt: str,
        style: str,
        width: int = 640,
        height: int = 640,
        mode: str = "isolated"
    ) -> GenerationResult:
        """
        Genera un asset/elemento aislado (ej. placa, icono, personaje).
        """
        print(f"🎨 [ART-COMFY] Generating Asset ({mode}): {prompt}")
        
        if not await self.is_ready():
            return GenerationResult(success=False, error="ComfyUI no está disponible")
            
        # Prompt construction
        full_prompt = self._build_asset_prompt(prompt, style, mode)
        negative = "text, watermark, blurry, cropped, complex background"
        
        # Configurar workflow (usando el mismo checkpoint que background por consistencia)
        # Detectamos si es realismo para cambiar modelo
        checkpoint_name = "dreamshaper_8.safetensors"
        if "realistic" in style.lower() or "realism" in style.lower():
            checkpoint_name = "Realistic_Vision_V6.0_NV_B1.safetensors"
            
        import random
        seed = random.randint(0, 2**32 - 1)

        workflow = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": checkpoint_name}
            },
            "2": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": full_prompt, "clip": ["1", 1]}
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": negative, "clip": ["1", 1]}
            },
            "4": {
                "class_type": "EmptyLatentImage",
                "inputs": {"width": width, "height": height, "batch_size": 1}
            },
            "5": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": 25,
                    "cfg": 7.0,
                    "sampler_name": "dpmpp_2m",
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
                "inputs": {"samples": ["5", 0], "vae": ["1", 2]}
            },
            "7": {
                "class_type": "SaveImage",
                "inputs": {"filename_prefix": "art_studio_asset", "images": ["6", 0]}
            }
        }
        
        summary = f"Asset Generation ({mode})"
        print(f"    📋 {summary}")

        try:
            image_bytes = await self.client.generate_image(workflow, timeout=180)
            
            if image_bytes:
                image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                print(f"    ✅ Imagen generada: {len(image_bytes)} bytes")
                return GenerationResult(
                    success=True,
                    image_data=image_b64,
                    workflow_used=summary,
                    seed=seed
                )
            else:
                return GenerationResult(success=False, error="ComfyUI no retornó imagen")
                
        except Exception as e:
            print(f"    ❌ Error: {e}")
            return GenerationResult(success=False, error=str(e))

    def _build_asset_prompt(self, prompt: str, style: str, mode: str) -> str:
        """Helper to build detailed asset prompt"""
        is_sketch = "sketch" in style.lower() or "boceto" in style.lower() or "drawing" in style.lower()
        
        if is_sketch:
            base = f"{prompt}, {style} style, rough sketch, graphite, paper texture, high resolution"
        else:
            base = f"{prompt}, {style} style, 3d render, high resolution, sharp focus"
            
        if mode == "isolated":
             return f"{base}, isolated on white background, centered, full visible, no cutoff, simple background"
        return base
    
    async def generate_margins_inpainting(
        self,
        base_image: str,  # base64
        mask_image: str,  # base64 - blanco = generar, negro = proteger
        prompt: str,
        style: str,
        denoise: float = 0.7
    ) -> GenerationResult:
        """
        Genera decoración en márgenes usando inpainting.
        
        La máscara protege la grilla y el título.
        """
        print(f"🖼️ [ART-COMFY] Inpainting margins: {style}")
        
        if not await self.is_ready():
            return GenerationResult(
                success=False,
                error="ComfyUI no está disponible"
            )
        
        # Prompt para decoración de márgenes
        margin_prompt = self._build_margin_prompt(prompt, style)
        
        # Construir workflow con inpainting
        workflow = self.builder.build_workflow(
            stage="margenes",
            prompt=margin_prompt,
            negative_prompt="text, letters, invasive elements, covering center",
            has_mask=True,
            mask_image_b64=mask_image,
            base_image_b64=base_image,
            denoise=denoise,
            protect_grid=True
        )
        
        summary = self.builder.get_workflow_summary(workflow)
        print(f"    📋 {summary}")
        
        try:
            image_bytes = await self.client.generate_image(workflow, timeout=180)
            
            if image_bytes:
                return GenerationResult(
                    success=True,
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    workflow_used=summary
                )
            else:
                return GenerationResult(
                    success=False,
                    error="Inpainting no retornó imagen"
                )
                
        except Exception as e:
            return GenerationResult(
                success=False,
                error=str(e)
            )
    
    async def generate_frame(
        self,
        prompt: str,
        style: str,
        width: int = 816,
        height: int = 1056
    ) -> GenerationResult:
        """
        Genera un marco/frame decorativo.
        
        Similar a fondo pero con énfasis en bordes y esquinas.
        """
        print(f"🖼️ [ART-COMFY] Generating frame: {style}")
        
        if not await self.is_ready():
            return GenerationResult(
                success=False,
                error="ComfyUI no está disponible"
            )
        
        frame_prompt = self._build_frame_prompt(prompt, style)
        
        workflow = self.builder.build_workflow(
            stage="fondo",  # Usa mismo pipeline que fondo
            prompt=frame_prompt,
            negative_prompt="solid background, plain, text, letters",
            width=width,
            height=height,
            steps=25
        )
        
        try:
            image_bytes = await self.client.generate_image(workflow, timeout=180)
            
            if image_bytes:
                return GenerationResult(
                    success=True,
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    workflow_used=self.builder.get_workflow_summary(workflow)
                )
            else:
                return GenerationResult(success=False, error="No image returned")
                
        except Exception as e:
            return GenerationResult(success=False, error=str(e))
    
    async def upscale_image(
        self,
        image_b64: str,
        scale: int = 4
    ) -> GenerationResult:
        """
        Escala una imagen usando ESRGAN.
        """
        print(f"📐 [ART-COMFY] Upscaling image x{scale}")
        
        if not await self.is_ready():
            return GenerationResult(
                success=False,
                error="ComfyUI no está disponible"
            )
        
        workflow = self.builder.build_workflow(
            stage="upscale",
            prompt="",  # No necesita prompt
            base_image_b64=image_b64
        )
        
        try:
            image_bytes = await self.client.generate_image(workflow, timeout=300)
            
            if image_bytes:
                return GenerationResult(
                    success=True,
                    image_data=base64.b64encode(image_bytes).decode('utf-8'),
                    workflow_used="Upscaler ESRGAN x4"
                )
            else:
                return GenerationResult(success=False, error="Upscale failed")
                
        except Exception as e:
            return GenerationResult(success=False, error=str(e))
    
    def _build_background_prompt(
        self,
        base_prompt: str,
        style: str,
        color_palette: List[str]
    ) -> str:
        """Construye prompt optimizado para fondos"""
        
        style_keywords = {
            "futuristic": "cyberpunk, neon lights, glowing, sci-fi, holographic",
            "playful": "colorful, cute, cartoon style, whimsical, fun",
            "watercolor": "watercolor painting, soft edges, artistic, dreamy",
            "vintage": "retro, aged paper, antique, sepia tones, classic",
            "modern": "clean, minimalist, geometric, contemporary",
            "sketch": "pencil sketch, hand drawn, artistic lines",
            "elegant": "sophisticated, ornate, decorative, refined",
            "minimalist": "simple, clean, sparse, white space"
        }
        
        style_addition = style_keywords.get(style, "")
        
        # Construir prompt
        prompt_parts = [
            base_prompt,
            style_addition,
            "background illustration",
            "empty center for text",
            "decorative border elements",
            "page layout"
        ]
        
        return ", ".join(filter(None, prompt_parts))
    
    def _build_margin_prompt(self, base_prompt: str, style: str) -> str:
        """Construye prompt para decoración de márgenes"""
        return f"{base_prompt}, decorative border, ornamental corners, frame elements, {style} style, intricate details on edges"
    
    def _build_frame_prompt(self, base_prompt: str, style: str) -> str:
        """Construye prompt para frames"""
        return f"decorative frame border, {base_prompt}, {style} style, ornamental corners, empty center, page border design"


# Singleton
_art_comfy_client: Optional[ArtStudioComfyClient] = None

def get_art_studio_comfy_client() -> ArtStudioComfyClient:
    global _art_comfy_client
    if _art_comfy_client is None:
        _art_comfy_client = ArtStudioComfyClient()
    return _art_comfy_client
