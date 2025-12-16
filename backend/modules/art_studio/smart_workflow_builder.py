"""
Smart Workflow Builder - Constructor Inteligente de Workflows

Construye workflows de ComfyUI dinámicamente según el contexto:
- Activa/desactiva nodos según la etapa
- Inyecta máscaras para proteger áreas
- Configura pesos de ControlNet/IPAdapter según modo

Nodos que puede activar:
- KSampler (siempre)
- ControlNet (para proteger grilla)
- IPAdapter (para referencia de estilo)
- Inpainting (para márgenes con máscara)
- Upscaler (al final)
"""

import json
import base64
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
from pathlib import Path

from .node_switcher import get_node_switcher, NodeType, NodeConfig


@dataclass
class WorkflowNode:
    """Representa un nodo en el workflow"""
    id: str
    class_type: str
    inputs: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_type": self.class_type,
            "inputs": self.inputs
        }


class SmartWorkflowBuilder:
    """
    Constructor Inteligente de Workflows
    
    Construye workflows de ComfyUI que se adaptan al contexto de generación.
    """
    
    # IDs de nodos base
    NODE_IDS = {
        "checkpoint": "1",
        "clip_text_positive": "2",
        "clip_text_negative": "3",
        "empty_latent": "4",
        "ksampler": "5",
        "vae_decode": "6",
        "save_image": "7",
        # Nodos opcionales
        "controlnet_loader": "10",
        "controlnet_apply": "11",
        "canny_detector": "12",
        "ipadapter_loader": "13",
        "ipadapter_apply": "14",
        "load_image_mask": "15",
        "set_latent_mask": "16",
        "upscale_model": "17",
        "upscale_image": "18",
    }
    
    # Modelos disponibles
    MODELS = {
        "checkpoint": "dreamshaper_8.safetensors",
        "controlnet_canny": "control_v11p_sd15_canny.pth",
        "controlnet_lineart": "control_v11p_sd15_lineart.pth",
        "ipadapter": "ip-adapter_sd15.safetensors",
        "clip_vision": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors",
        "upscaler": "RealESRGAN_x4plus.pth",
    }
    
    def __init__(self):
        self.switcher = get_node_switcher()
        self._base_workflow: Dict[str, Any] = {}
    
    def build_workflow(
        self,
        stage: str,
        prompt: str,
        negative_prompt: str = "",
        width: int = 816,
        height: int = 1056,
        steps: int = 25,
        cfg: float = 7.0,
        denoise: float = 0.7,
        seed: int = -1,
        # Opcionales según contexto
        has_reference: bool = False,
        reference_image_b64: Optional[str] = None,
        has_mask: bool = False,
        mask_image_b64: Optional[str] = None,
        base_image_b64: Optional[str] = None,
        protect_grid: bool = True
    ) -> Dict[str, Any]:
        """
        Construye un workflow adaptado al contexto.
        
        Args:
            stage: "fondo", "margenes", "upscale"
            prompt: Prompt positivo
            negative_prompt: Prompt negativo
            width, height: Dimensiones
            steps, cfg, denoise: Parámetros de sampling
            seed: Semilla (-1 = random)
            has_reference: Si hay imagen de referencia para IPAdapter
            reference_image_b64: Imagen de referencia en base64
            has_mask: Si hay máscara para inpainting
            mask_image_b64: Máscara en base64
            base_image_b64: Imagen base para img2img/inpainting
            protect_grid: Si activar ControlNet para proteger grilla
        
        Returns:
            Workflow JSON listo para enviar a ComfyUI
        """
        # Configurar nodos según etapa
        node_config = self.switcher.configure_for_stage(
            stage=stage,
            has_reference=has_reference,
            has_mask=has_mask,
            protect_grid=protect_grid
        )
        
        print(f"🔌 [WORKFLOW] Building for stage: {stage}")
        print(self.switcher.get_active_nodes_summary())
        
        # Construir workflow base
        workflow = self._create_base_workflow(
            prompt=prompt,
            negative_prompt=negative_prompt or "text, letters, words, watermark, blurry, low quality",
            width=width,
            height=height,
            steps=steps,
            cfg=cfg,
            seed=seed
        )
        
        # Modificar según nodos activos
        if NodeType.CONTROLNET_CANNY in node_config:
            config = node_config[NodeType.CONTROLNET_CANNY]
            if config.enabled:
                workflow = self._add_controlnet_canny(
                    workflow,
                    weight=config.weight,
                    source_image_b64=base_image_b64
                )
        
        if NodeType.IPADAPTER in node_config:
            config = node_config[NodeType.IPADAPTER]
            if config.enabled and reference_image_b64:
                workflow = self._add_ipadapter(
                    workflow,
                    weight=config.weight,
                    reference_image_b64=reference_image_b64
                )
        
        if NodeType.INPAINTING in node_config:
            config = node_config[NodeType.INPAINTING]
            if config.enabled and mask_image_b64 and base_image_b64:
                workflow = self._add_inpainting(
                    workflow,
                    mask_b64=mask_image_b64,
                    base_image_b64=base_image_b64,
                    denoise=config.params.get("denoise", denoise)
                )
        
        if NodeType.UPSCALE_ESRGAN in node_config:
            config = node_config[NodeType.UPSCALE_ESRGAN]
            if config.enabled:
                workflow = self._add_upscaler(workflow)
        
        return workflow
    
    def _create_base_workflow(
        self,
        prompt: str,
        negative_prompt: str,
        width: int,
        height: int,
        steps: int,
        cfg: float,
        seed: int
    ) -> Dict[str, Any]:
        """Crea el workflow base txt2img"""
        
        return {
            # Checkpoint Loader
            self.NODE_IDS["checkpoint"]: {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {
                    "ckpt_name": self.MODELS["checkpoint"]
                }
            },
            # CLIP Text Encode (Positive)
            self.NODE_IDS["clip_text_positive"]: {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": [self.NODE_IDS["checkpoint"], 1]
                }
            },
            # CLIP Text Encode (Negative)
            self.NODE_IDS["clip_text_negative"]: {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative_prompt,
                    "clip": [self.NODE_IDS["checkpoint"], 1]
                }
            },
            # Empty Latent Image
            self.NODE_IDS["empty_latent"]: {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": width,
                    "height": height,
                    "batch_size": 1
                }
            },
            # KSampler
            self.NODE_IDS["ksampler"]: {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed if seed >= 0 else -1,
                    "steps": steps,
                    "cfg": cfg,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1.0,
                    "model": [self.NODE_IDS["checkpoint"], 0],
                    "positive": [self.NODE_IDS["clip_text_positive"], 0],
                    "negative": [self.NODE_IDS["clip_text_negative"], 0],
                    "latent_image": [self.NODE_IDS["empty_latent"], 0]
                }
            },
            # VAE Decode
            self.NODE_IDS["vae_decode"]: {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": [self.NODE_IDS["ksampler"], 0],
                    "vae": [self.NODE_IDS["checkpoint"], 2]
                }
            },
            # Save Image
            self.NODE_IDS["save_image"]: {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "director_output",
                    "images": [self.NODE_IDS["vae_decode"], 0]
                }
            }
        }
    
    def _add_controlnet_canny(
        self,
        workflow: Dict[str, Any],
        weight: float = 0.8,
        source_image_b64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Agrega ControlNet Canny para proteger estructura"""
        
        print(f"    🔧 Adding ControlNet Canny (weight={weight})")
        
        # ControlNet Loader
        workflow[self.NODE_IDS["controlnet_loader"]] = {
            "class_type": "ControlNetLoader",
            "inputs": {
                "control_net_name": self.MODELS["controlnet_canny"]
            }
        }
        
        # Canny Edge Detection
        workflow[self.NODE_IDS["canny_detector"]] = {
            "class_type": "Canny",
            "inputs": {
                "low_threshold": 100,
                "high_threshold": 200,
                "image": [self.NODE_IDS["load_image_mask"], 0] if source_image_b64 else None
            }
        }
        
        # ControlNet Apply
        workflow[self.NODE_IDS["controlnet_apply"]] = {
            "class_type": "ControlNetApply",
            "inputs": {
                "strength": weight,
                "conditioning": [self.NODE_IDS["clip_text_positive"], 0],
                "control_net": [self.NODE_IDS["controlnet_loader"], 0],
                "image": [self.NODE_IDS["canny_detector"], 0]
            }
        }
        
        # Reconectar KSampler al ControlNet
        workflow[self.NODE_IDS["ksampler"]]["inputs"]["positive"] = [
            self.NODE_IDS["controlnet_apply"], 0
        ]
        
        return workflow
    
    def _add_ipadapter(
        self,
        workflow: Dict[str, Any],
        weight: float = 0.4,
        reference_image_b64: Optional[str] = None
    ) -> Dict[str, Any]:
        """Agrega IPAdapter para transferencia de estilo"""
        
        print(f"    🔧 Adding IPAdapter (weight={weight})")
        
        # IPAdapter Loader
        workflow[self.NODE_IDS["ipadapter_loader"]] = {
            "class_type": "IPAdapterModelLoader",
            "inputs": {
                "ipadapter_file": self.MODELS["ipadapter"]
            }
        }
        
        # IPAdapter Apply
        workflow[self.NODE_IDS["ipadapter_apply"]] = {
            "class_type": "IPAdapterApply",
            "inputs": {
                "weight": weight,
                "model": [self.NODE_IDS["checkpoint"], 0],
                "ipadapter": [self.NODE_IDS["ipadapter_loader"], 0],
                "image": None,  # Se conectaría a imagen de referencia
                "clip_vision": None
            }
        }
        
        # Reconectar modelo al IPAdapter
        workflow[self.NODE_IDS["ksampler"]]["inputs"]["model"] = [
            self.NODE_IDS["ipadapter_apply"], 0
        ]
        
        return workflow
    
    def _add_inpainting(
        self,
        workflow: Dict[str, Any],
        mask_b64: str,
        base_image_b64: str,
        denoise: float = 0.7
    ) -> Dict[str, Any]:
        """Configura inpainting con máscara"""
        
        print(f"    🔧 Configuring Inpainting (denoise={denoise})")
        
        # Cargar imagen base
        workflow["20"] = {
            "class_type": "LoadImageBase64",
            "inputs": {
                "image": base_image_b64
            }
        }
        
        # Cargar máscara
        workflow[self.NODE_IDS["load_image_mask"]] = {
            "class_type": "LoadImageBase64",
            "inputs": {
                "image": mask_b64
            }
        }
        
        # Encode imagen base a latent
        workflow["21"] = {
            "class_type": "VAEEncode",
            "inputs": {
                "pixels": ["20", 0],
                "vae": [self.NODE_IDS["checkpoint"], 2]
            }
        }
        
        # Set Latent Noise Mask
        workflow[self.NODE_IDS["set_latent_mask"]] = {
            "class_type": "SetLatentNoiseMask",
            "inputs": {
                "samples": ["21", 0],
                "mask": [self.NODE_IDS["load_image_mask"], 1]
            }
        }
        
        # Actualizar KSampler para usar latent con máscara
        workflow[self.NODE_IDS["ksampler"]]["inputs"]["latent_image"] = [
            self.NODE_IDS["set_latent_mask"], 0
        ]
        workflow[self.NODE_IDS["ksampler"]]["inputs"]["denoise"] = denoise
        
        return workflow
    
    def _add_upscaler(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        """Agrega upscaler ESRGAN al final"""
        
        print(f"    🔧 Adding Upscaler ESRGAN")
        
        # Cargar modelo de upscale
        workflow[self.NODE_IDS["upscale_model"]] = {
            "class_type": "UpscaleModelLoader",
            "inputs": {
                "model_name": self.MODELS["upscaler"]
            }
        }
        
        # Upscale imagen
        workflow[self.NODE_IDS["upscale_image"]] = {
            "class_type": "ImageUpscaleWithModel",
            "inputs": {
                "upscale_model": [self.NODE_IDS["upscale_model"], 0],
                "image": [self.NODE_IDS["vae_decode"], 0]
            }
        }
        
        # Reconectar SaveImage al upscaler
        workflow[self.NODE_IDS["save_image"]]["inputs"]["images"] = [
            self.NODE_IDS["upscale_image"], 0
        ]
        
        return workflow
    
    def get_workflow_summary(self, workflow: Dict[str, Any]) -> str:
        """Genera un resumen del workflow construido"""
        nodes = list(workflow.keys())
        
        active = []
        if self.NODE_IDS["controlnet_apply"] in nodes:
            active.append("ControlNet Canny")
        if self.NODE_IDS["ipadapter_apply"] in nodes:
            active.append("IPAdapter")
        if self.NODE_IDS["set_latent_mask"] in nodes:
            active.append("Inpainting")
        if self.NODE_IDS["upscale_image"] in nodes:
            active.append("Upscaler")
        
        if not active:
            active.append("txt2img básico")
        
        return f"Workflow: {' + '.join(active)} ({len(nodes)} nodos)"


# Singleton
_workflow_builder: Optional[SmartWorkflowBuilder] = None

def get_workflow_builder() -> SmartWorkflowBuilder:
    global _workflow_builder
    if _workflow_builder is None:
        _workflow_builder = SmartWorkflowBuilder()
    return _workflow_builder
