"""
Intent Planner - Planificador de Intención

Decide qué etapas ejecutar según los cambios detectados en el brief.
Implementa modos EXPLORAR y PRODUCIR.
"""

from enum import Enum
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
import os
import google.generativeai as genai
from .training_memory import get_training_memory


class GenerationMode(Enum):
    """Modos de operación del generador"""
    EXPLORAR = "explorar"  # Más variación, lotes mayores, pesos suaves
    PRODUCIR = "producir"  # Consistencia, lotes pequeños, editorial


class StageType(Enum):
    """Tipos de etapas de generación"""
    FONDO = "fondo"
    GRID_PLATE = "grid_plate"  # [NUEVO] Placa/Base para la grilla
    GRILLA = "grilla"
    TITULO = "titulo"
    MARGENES = "margenes"
    ENSAMBLAR = "ensamblar"
    UPSCALE = "upscale"
    QC = "qc"


@dataclass
class Stage:
    """Una etapa de generación"""
    type: StageType
    priority: int  # Orden de ejecución
    params: Dict[str, Any]
    depends_on: List[StageType] = None
    
    def __post_init__(self):
        if self.depends_on is None:
            self.depends_on = []


@dataclass
class Brief:
    """Brief de entrada para el Director"""
    tema: str
    publico: str
    estilo: str
    modo: GenerationMode = GenerationMode.EXPLORAR
    
    # Datos del puzzle
    titulo: str = ""
    palabras: List[str] = None
    grilla_data: Dict[str, Any] = None  # {letters: [[...]], rows, cols}
    
    # Opcionales
    referencias: List[str] = None  # Imágenes base64 de referencia
    paleta: List[str] = None  # Colores hex
    seed: Optional[int] = None # Semilla fija para refinamiento
    
    # Cambios detectados (para regeneración parcial)
    cambio_estilo: bool = True
    cambio_grilla: bool = True
    cambio_titulo: bool = True
    cambio_paleta: bool = True
    
    def __post_init__(self):
        if self.palabras is None:
            self.palabras = []
        if self.referencias is None:
            self.referencias = []
        if self.paleta is None:
            self.paleta = []


class IntentPlanner:
    """
    Planificador de Intención
    
    Decide qué etapas ejecutar según el brief y los cambios detectados.
    """
    
    # Configuración por modo
    MODE_CONFIG = {
        GenerationMode.EXPLORAR: {
            "num_variantes": 3,
            "seed_variation": True,
            "controlnet_weight": 0.7,
            "ipadapter_weight": 0.4,
            "denoise_range": (0.6, 0.8),
            "steps": 25,
        },
        GenerationMode.PRODUCIR: {
            "num_variantes": 1,
            "seed_variation": False,
            "controlnet_weight": 0.9,
            "ipadapter_weight": 0.3,
            "denoise_range": (0.5, 0.6),
            "steps": 40,
        }
    }
    
    def __init__(self):
        self.last_brief: Optional[Brief] = None
    
    def planificar(self, brief: Brief) -> List[Stage]:
        """Genera la lista de etapas para cumplir el brief"""
        
        stages = []
        mode_config = self.MODE_CONFIG[brief.modo]
        
        # [CEREBRO CREATIVO] Expandir prompt con Gemini + Memoria
        print(f"🧠 [INTENT PLANNER] Analizando intención: {brief.tema}")
        prompt_rico = self._expandir_prompt_creativo(brief)
        # prompt_rico = f"{brief.estilo} style, {brief.tema} theme" # Fallback for debugging
        
        # [CEREBRO TÉCNICO] Selección inteligente de motor (Checkpoint & Sampler)
        tech_settings = {
            "checkpoint": "v1-5-pruned-emaonly-fp16.safetensors", # Default universal
            "sampler": "euler_ancestral",
            "scheduler": "normal",
            "steps": mode_config["steps"]
        }
        
        estilo_lower = brief.estilo.lower() if brief.estilo else ""
        
        if any(x in estilo_lower for x in ["sketch", "boceto", "drawing", "pencil"]):
            tech_settings["checkpoint"] = "v1-5-pruned-emaonly-fp16.safetensors"
            tech_settings["sampler"] = "dpmpp_2m"
            tech_settings["scheduler"] = "karras"
            
        elif any(x in estilo_lower for x in ["realistic", "photo", "fotorealista", "3d"]):
            tech_settings["checkpoint"] = "Realistic_Vision_V6.0_NV_B1.safetensors"
            tech_settings["sampler"] = "dpmpp_2m_sde"
            tech_settings["scheduler"] = "karras"
            
        elif any(x in estilo_lower for x in ["pixel", "8bit", "retro"]):
            tech_settings["sampler"] = "euler"
            
        # Determinar etapas a generar
        generar_fondo = True # brief.cambio_estilo or brief.cambio_paleta or not self.last_brief
        generar_grilla = True # brief.cambio_grilla
        generar_titulo = True # brief.cambio_titulo
        generar_margenes = True 
        
        if generar_fondo:
            stages.append(Stage(
                type=StageType.FONDO,
                priority=10,
                params={
                    "prompt_should": prompt_rico, # Usamos el prompt enriquecido
                    "prompt_must_not": "text, letters, watermark, blurry, low quality, distorted, bad anatomy",
                    "width": 1024, # 2024 standard
                    "height": 1024,
                    "batch_size": mode_config["num_variantes"],
                    "checkpoint_override": tech_settings["checkpoint"],
                    "sampler_override": tech_settings["sampler"],
                    "scheduler_override": tech_settings["scheduler"],
                    "seed_override": brief.seed # [NUEVO]
                }
            ))
            
            # [FIX] Reforzar estilo Boceto/Sketch
            if "sketch" in brief.estilo.lower() or "boceto" in brief.estilo.lower():
                stages[-1].params.update({
                    "prompt_must": "rough pencil sketch, hand drawn, graphite on paper, unfinished, monochromatic, (no color:1.2)",
                    "prompt_should": f"{brief.tema} concept",
                    "prompt_can": "paper texture, scribbles, draft lines",
                    "denoise": 1.0  # Ensure full generation from noise
                })
        
        # [NUEVO] Etapa GRID PLATE (Placa contenedora)
        if generar_fondo or generar_grilla:
            stages.append(Stage(
                type=StageType.GRID_PLATE,
                priority=15,
                params={
                    "prompt_must": "clean distinct area, empty panel, signboard, tablet, paper sheet",
                    "prompt_should": f"{brief.estilo} style, matching {brief.tema}",
                    "use_inpainting": False, # Es generación independiente
                },
                depends_on=[StageType.FONDO] if generar_fondo else []
            ))

        # Etapa GRILLA (siempre determinística)
        if generar_grilla:
            stages.append(Stage(
                type=StageType.GRILLA,
                priority=20,
                params={
                    "render_mode": "deterministic",  # NO usar IA para letras
                    "grilla_data": brief.grilla_data,
                    "apply_texture_below": False, # Ya no es necesario con la placa
                    "use_controlnet": True,
                    "controlnet_weight": mode_config["controlnet_weight"],
                },
                depends_on=[StageType.GRID_PLATE] if (generar_fondo or generar_grilla) else []
            ))
        
        # Etapa TÍTULO (renderizado nítido, no IA)
        if generar_titulo:
            stages.append(Stage(
                type=StageType.TITULO,
                priority=30,
                params={
                    "render_mode": "deterministic",  # Texto nítido
                    "titulo": brief.titulo,
                    "estilo": brief.estilo,
                    "high_contrast": True,
                }
            ))
        
        # Etapa MÁRGENES (decoración con máscara)
        if generar_margenes:
            stages.append(Stage(
                type=StageType.MARGENES,
                priority=40,
                params={
                    "use_inpainting": True,
                    "mask_protect_grid": True,
                    "prompt_must": "decorative border, ornamental frame",
                    "prompt_should": f"{brief.estilo} style, {brief.tema} theme",
                    "denoise": mode_config["denoise_range"][0],
                },
                depends_on=[StageType.GRILLA]
            ))
        
        # Siempre ENSAMBLAR
        stages.append(Stage(
            type=StageType.ENSAMBLAR,
            priority=50,
            params={
                "layer_order": ["fondo", "grid_plate", "grilla", "titulo", "margenes"],
            },
            depends_on=[StageType.FONDO, StageType.GRID_PLATE, StageType.GRILLA, StageType.TITULO, StageType.MARGENES]
        ))
        
        # Siempre QC
        stages.append(Stage(
            type=StageType.QC,
            priority=60,
            params={
                "check_grid_integrity": True,
                "check_title_contrast": True,
                "check_visual_load": True,
                "issues": [], # Initialize empty
                "suggestions": [] # Initialize empty
            },
            depends_on=[StageType.ENSAMBLAR]
        ))
        
        # UPSCALE opcional (solo en modo PRODUCIR)
        if brief.modo == GenerationMode.PRODUCIR:
            stages.append(Stage(
                type=StageType.UPSCALE,
                priority=70,
                params={
                    "target_dpi": 300,
                    "model": "RealESRGAN_x4plus",
                },
                depends_on=[StageType.QC]
            ))
        
        # Ordenar por prioridad
        stages.sort(key=lambda s: s.priority)
        
        # Guardar brief actual
        self.last_brief = brief
        
        return stages
    
    def detectar_cambios(self, new_brief: Brief) -> Dict[str, bool]:
        """Detecta qué cambió entre el brief anterior y el nuevo"""
        if self.last_brief is None:
            return {
                "cambio_estilo": True,
                "cambio_grilla": True,
                "cambio_titulo": True,
                "cambio_paleta": True,
            }
        
        return {
            "cambio_estilo": new_brief.estilo != self.last_brief.estilo,
            "cambio_grilla": new_brief.grilla_data != self.last_brief.grilla_data,
            "cambio_titulo": new_brief.titulo != self.last_brief.titulo,
            "cambio_paleta": new_brief.paleta != self.last_brief.paleta,
        }
    
    def get_stage_summary(self, stages: List[Stage]) -> str:
        """Genera un resumen legible de las etapas planificadas"""
        lines = ["📋 Etapas planificadas:"]
        for stage in stages:
            emoji = {
                StageType.FONDO: "🎨",
                StageType.GRILLA: "📝",
                StageType.TITULO: "🔤",
                StageType.MARGENES: "🖼️",
                StageType.ENSAMBLAR: "🔧",
                StageType.QC: "✅",
                StageType.UPSCALE: "📐",
            }.get(stage.type, "•")
            lines.append(f"  {emoji} {stage.type.value.upper()}")
        return "\n".join(lines)

    def _expandir_prompt_creativo(self, brief: Brief) -> str:
        """Usa Gemini para expandir el prompt con creatividad y memoria"""
        try:
            # 1. Recuperar memoria (ejemplos exitosos)
            memory = get_training_memory()
            context = memory.get_learning_context(brief.tema)
            
            # 2. Construir prompt para Gemini
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return f"{brief.estilo} style, {brief.tema} theme"
                
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Contexto de gustos del usuario
            likes = "\n".join([f"- {p}" for p in context.get("positive_prompts", [])[:3]])
            
            prompt_instruction = f"""
            Act as an Expert Art Director for a Word Search Puzzle game.
            Generate a rich, descriptive prompt for an image generator (like Stable Diffusion).
            
            THEME: {brief.tema}
            STYLE: {brief.estilo}
            AUDIENCE: {brief.publico}
            MOOD: {brief.modo.name}
            KEYWORDS: {', '.join(brief.palabras[:5])}
            
            USER PREFERENCES (incorporate elements from these successful prompts):
            {likes}
            
            REQUIREMENTS:
            - Focus on the BACKGROUND suitable for a puzzle grid overlay.
            - Clean composition, not too busy.
            - Return ONLY the prompt string, no explanations.
            """
            
            response = model.generate_content(prompt_instruction)
            expanded_prompt = response.text.strip()
            print(f"✨ [GEMINI] Prompt expandido: {expanded_prompt[:50]}...")
            return expanded_prompt
            
        except Exception as e:
            print(f"⚠️ [INTENT PLANNER] Error expandiendo prompt: {e}")
            return f"{brief.estilo} style, {brief.tema} theme"

# Singleton
_planner: Optional[IntentPlanner] = None

def get_intent_planner() -> IntentPlanner:
    global _planner
    if _planner is None:
        _planner = IntentPlanner()
    return _planner
