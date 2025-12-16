"""
Hybrid Generator - Gemini razona, ComfyUI ejecuta

Este módulo implementa el flujo:
1. Gemini analiza el puzzle y genera un plan de diseño detallado
2. El plan incluye prompts específicos para cada capa
3. ComfyUI genera cada capa usando esos prompts
4. Las capas se ensamblan en la imagen final
"""

import json
import asyncio
import aiohttp
import base64
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import os
from pathlib import Path

# Cargar API key
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent / ".env")

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


@dataclass
class DesignPlan:
    """Plan de diseño generado por Gemini"""
    theme: str
    mood: str
    color_palette: List[str]
    
    # Prompts específicos para cada capa
    background_prompt: str
    frame_prompt: str
    illustration_elements: List[str]
    illustration_positions: List[str]  # "top-left", "bottom-right", etc.
    
    # Estilos
    art_style: str  # "watercolor", "vintage", "modern", "sketch"
    title_style: str
    
    # Metadatos
    reasoning: str  # Por qué el modelo eligió este diseño


class HybridGenerator:
    """Generador híbrido: Gemini planifica, ComfyUI ejecuta"""
    
    def __init__(self):
        self.gemini_api_key = GEMINI_API_KEY
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session
    
    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def analyze_puzzle_and_plan_design(
        self,
        puzzle_title: str,
        puzzle_theme: str,
        words: List[str],
        target_audience: str = "general",
        style_preference: str = "auto",
        reference_images: Optional[List[str]] = None  # Base64 images
    ) -> DesignPlan:
        """
        Usa Gemini para analizar el puzzle y generar un plan de diseño detallado.
        
        El modelo razona sobre:
        - Qué tema visual combina mejor con el contenido
        - Qué colores usar
        - Qué ilustraciones agregar y dónde
        - Qué estilo artístico aplicar
        
        AHORA INCLUYE APRENDIZAJE DE EJEMPLOS ANTERIORES
        """
        
        # Obtener contexto de aprendizaje de ejemplos exitosos anteriores
        from .training_memory import get_training_memory
        training = get_training_memory()
        learning_context = training.get_learning_context(puzzle_theme)
        
        system_prompt = f"""Eres un diseñador gráfico experto especializado en crear 
        sopas de letras artísticas de alta calidad. Tu trabajo es analizar el puzzle 
        y generar un plan de diseño detallado que será ejecutado por un sistema de 
        generación de imágenes (Stable Diffusion).

        REGLAS CRÍTICAS:
        1. El texto de la grilla DEBE ser 100% legible - nunca diseñes fondos que interfieran
        2. Las ilustraciones deben estar en los BORDES, no sobre el contenido
        3. Los colores deben tener alto contraste con el texto
        4. El estilo debe ser coherente en todas las capas

        Los estilos artísticos disponibles son:
        - watercolor: Acuarela suave, bordes difuminados, colores fluidos
        - vintage: Estilo antiguo, pergamino, tonos sepia/ocre
        - modern: Limpio, minimalista, colores sólidos
        - sketch: Boceto a lápiz, líneas definidas, blanco y negro
        - playful: Colorido, divertido, para niños
        - futuristic: Estilo neón/cyberpunk, colores cyan/magenta, moderno

        {learning_context}

        Debes responder SOLO con un JSON válido sin markdown."""

        user_prompt = f"""Analiza este puzzle y genera un plan de diseño:

PUZZLE:
- Título: {puzzle_title}
- Tema: {puzzle_theme}
- Palabras: {', '.join(words[:10])}
- Audiencia: {target_audience}
- Preferencia de estilo: {style_preference}

Genera un JSON con esta estructura exacta:
{{
    "theme": "tema visual identificado",
    "mood": "estado de ánimo del diseño",
    "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
    "background_prompt": "prompt detallado para Stable Diffusion para el fondo",
    "frame_prompt": "prompt para el marco decorativo alrededor de la grilla",
    "illustration_elements": ["elemento1", "elemento2", "elemento3"],
    "illustration_positions": ["top-left", "top-right", "bottom-center"],
    "art_style": "uno de: watercolor, vintage, modern, sketch, playful, futuristic",
    "title_style": "estilo para el título",
    "reasoning": "explicación de por qué elegiste este diseño"
}}"""

        try:
            session = await self._get_session()
            
            payload = {
                "contents": [{
                    "parts": [
                        {"text": system_prompt},
                        {"text": user_prompt}
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048,
                    "responseMimeType": "application/json"
                }
            }
            
            async with session.post(
                f"{GEMINI_URL}?key={self.gemini_api_key}",
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    print(f"Gemini API error: {error_text}")
                    # Fallback a plan básico
                    return self._create_fallback_plan(puzzle_title, puzzle_theme)
                
                data = await resp.json()
                
                # Extraer texto de la respuesta
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                
                # Parsear JSON
                plan_data = json.loads(text)
                
                return DesignPlan(
                    theme=plan_data.get("theme", puzzle_theme),
                    mood=plan_data.get("mood", "neutral"),
                    color_palette=plan_data.get("color_palette", ["#ffffff", "#333333"]),
                    background_prompt=plan_data.get("background_prompt", ""),
                    frame_prompt=plan_data.get("frame_prompt", ""),
                    illustration_elements=plan_data.get("illustration_elements", []),
                    illustration_positions=plan_data.get("illustration_positions", []),
                    art_style=plan_data.get("art_style", "modern"),
                    title_style=plan_data.get("title_style", "bold"),
                    reasoning=plan_data.get("reasoning", "")
                )
                
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            return self._create_fallback_plan(puzzle_title, puzzle_theme)
    
    def _create_fallback_plan(self, title: str, theme: str) -> DesignPlan:
        """Plan de respaldo si Gemini falla"""
        return DesignPlan(
            theme=theme,
            mood="educational",
            color_palette=["#f5f5f5", "#333333", "#4a90d9", "#e8e8e8"],
            background_prompt=f"clean subtle gradient background, {theme} theme, soft colors, professional, no text",
            frame_prompt="simple decorative border, elegant corners, professional design",
            illustration_elements=["decorative corner", "simple border"],
            illustration_positions=["corners"],
            art_style="modern",
            title_style="bold_shadow",
            reasoning="Fallback design due to API error"
        )
    
    def build_enhanced_prompt(self, design_plan: DesignPlan, layer_type: str) -> str:
        """Construye un prompt mejorado para ComfyUI basado en el plan de Gemini"""
        
        style_modifiers = {
            "watercolor": "watercolor painting style, soft edges, flowing colors, artistic",
            "vintage": "vintage illustration, aged paper texture, sepia tones, antique",
            "modern": "clean modern design, flat colors, minimalist, professional",
            "sketch": "pencil sketch style, hand-drawn lines, artistic illustration",
            "playful": "colorful cartoon style, fun for children, bright vibrant colors"
        }
        
        style = style_modifiers.get(design_plan.art_style, "professional illustration")
        colors = ", ".join(design_plan.color_palette[:3])
        
        if layer_type == "background":
            return f"{design_plan.background_prompt}, {style}, color palette: {colors}, no text, no letters, no words"
        
        elif layer_type == "frame":
            return f"{design_plan.frame_prompt}, {style}, decorative frame border, {design_plan.mood} mood"
        
        elif layer_type == "illustrations":
            elements = ", ".join(design_plan.illustration_elements[:4])
            return f"{elements}, {style}, scattered decorative elements, {design_plan.theme} theme, isolated on white background"
        
        return f"professional {design_plan.theme} design, {style}"
    
    async def generate_complete_design(
        self,
        puzzle_title: str,
        puzzle_theme: str,
        words: List[str],
        target_audience: str = "general",
        comfyui_generator = None
    ) -> Dict[str, Any]:
        """
        Flujo completo:
        1. Gemini analiza y planifica
        2. ComfyUI genera cada capa
        3. Retorna todas las capas para ensamblaje
        """
        
        result = {
            "success": False,
            "design_plan": None,
            "layers": {},
            "errors": []
        }
        
        # Paso 1: Gemini genera el plan
        print(f"🧠 [HYBRID] Gemini analizando puzzle: {puzzle_title}")
        design_plan = await self.analyze_puzzle_and_plan_design(
            puzzle_title=puzzle_title,
            puzzle_theme=puzzle_theme,
            words=words,
            target_audience=target_audience
        )
        
        result["design_plan"] = {
            "theme": design_plan.theme,
            "mood": design_plan.mood,
            "art_style": design_plan.art_style,
            "color_palette": design_plan.color_palette,
            "reasoning": design_plan.reasoning
        }
        
        print(f"   Theme: {design_plan.theme}")
        print(f"   Style: {design_plan.art_style}")
        print(f"   Reasoning: {design_plan.reasoning[:100]}...")
        
        # Paso 2: Generar capas con ComfyUI
        if comfyui_generator:
            from .layer_generator import StylePlan, LayerType
            
            # Convertir DesignPlan a StylePlan para el generador
            style_plan = StylePlan(
                theme=design_plan.theme,
                color_palette=design_plan.color_palette,
                elements=design_plan.illustration_elements,
                frame_style=design_plan.frame_prompt[:50],
                title_style=design_plan.title_style,
                mood=design_plan.mood
            )
            
            # Generar cada capa
            layers_to_generate = [
                (LayerType.BACKGROUND, self.build_enhanced_prompt(design_plan, "background")),
                (LayerType.FRAME, self.build_enhanced_prompt(design_plan, "frame")),
                (LayerType.ILLUSTRATIONS, self.build_enhanced_prompt(design_plan, "illustrations"))
            ]
            
            for layer_type, enhanced_prompt in layers_to_generate:
                print(f"🎨 [HYBRID] Generando capa: {layer_type.value}")
                print(f"   Prompt: {enhanced_prompt[:80]}...")
                
                layer_result = await comfyui_generator.generate_layer(
                    layer_type=layer_type,
                    style_plan=style_plan
                )
                
                result["layers"][layer_type.value] = {
                    "success": layer_result.success,
                    "image_data": layer_result.image_data,
                    "error": layer_result.error
                }
                
                if not layer_result.success:
                    result["errors"].append(f"{layer_type.value}: {layer_result.error}")
        
        result["success"] = len(result["errors"]) == 0
        
        # Guardar para aprendizaje (si hubo éxito parcial al menos)
        if result["layers"]:
            try:
                from .training_memory import get_training_memory
                training = get_training_memory()
                
                # Preparar datos para memoria
                prompts = {
                    "background": design_plan.background_prompt,
                    "frame": design_plan.frame_prompt or "",
                    "illustrations": ", ".join(design_plan.illustration_elements)
                }
                
                images_b64 = {}
                for l_type, l_data in result["layers"].items():
                    if l_data.get("success") and l_data.get("image_data"):
                        images_b64[l_type] = l_data["image_data"]
                
                if images_b64:
                    training.save_generation(
                        puzzle_title=puzzle_title,
                        puzzle_theme=puzzle_theme,
                        words=words,
                        target_audience=target_audience,
                        design_plan=result["design_plan"],
                        prompts=prompts,
                        images_b64=images_b64
                    )
            except Exception as e:
                print(f"⚠️ [HYBRID LOG] Error saving to memory: {e}")

        return result


# Singleton
_hybrid_generator: Optional[HybridGenerator] = None

def get_hybrid_generator() -> HybridGenerator:
    global _hybrid_generator
    if _hybrid_generator is None:
        _hybrid_generator = HybridGenerator()
    return _hybrid_generator
