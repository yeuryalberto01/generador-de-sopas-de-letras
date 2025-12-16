"""
Visual Analyzer - Análisis Visual con Gemini

Usa Gemini Vision para analizar imágenes generadas y dar feedback inteligente.
Gemini NO genera imágenes, solo las ANALIZA para:
- Detectar problemas de legibilidad
- Evaluar armonía visual
- Sugerir mejoras específicas
- Verificar que la grilla esté intacta
"""

import base64
import json
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import os

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


@dataclass
class VisualAnalysis:
    """Resultado del análisis visual de Gemini"""
    success: bool
    
    # Evaluaciones
    legibility_score: float  # 0-10
    harmony_score: float  # 0-10
    grid_intact: bool
    title_readable: bool
    
    # Issues y sugerencias
    issues: List[str]
    suggestions: List[str]
    
    # Descripción general
    description: str
    
    # Para debugging
    raw_response: Optional[str] = None


class VisualAnalyzer:
    """
    Analizador Visual con Gemini
    
    Gemini ve las imágenes generadas y da feedback inteligente.
    Este feedback se usa para:
    1. Validar que el QC pasó correctamente
    2. Dar sugerencias específicas de mejora
    3. Alimentar el Learning Engine con insights
    """
    
    def __init__(self):
        self._model = None
        self._initialized = False
        self._init_gemini()
    
    def _init_gemini(self):
        """Inicializa el modelo de Gemini Vision"""
        if not GEMINI_AVAILABLE:
            print("⚠️ Gemini no disponible, análisis visual deshabilitado")
            return
        
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("⚠️ No se encontró GOOGLE_API_KEY, análisis visual deshabilitado")
            return
        
        try:
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel("gemini-2.0-flash")
            self._initialized = True
            print("✅ Gemini Vision inicializado para análisis visual")
        except Exception as e:
            print(f"⚠️ Error inicializando Gemini: {e}")
    
    async def analyze_generation(
        self,
        image_b64: str,
        context: Dict[str, Any]
    ) -> VisualAnalysis:
        """
        Analiza una imagen generada y da feedback.
        
        Args:
            image_b64: Imagen en base64
            context: Contexto de la generación (tema, estilo, palabras, etc.)
        
        Returns:
            VisualAnalysis con evaluaciones y sugerencias
        """
        if not self._initialized:
            return self._fallback_analysis()
        
        try:
            # Construir prompt de análisis
            prompt = self._build_analysis_prompt(context)
            
            # Preparar imagen
            image_data = {
                "mime_type": "image/png",
                "data": image_b64
            }
            
            # Llamar a Gemini Vision
            response = self._model.generate_content([
                prompt,
                image_data
            ])
            
            # Parsear respuesta
            return self._parse_response(response.text)
            
        except Exception as e:
            print(f"⚠️ Error en análisis visual: {e}")
            return self._fallback_analysis()
    
    def _build_analysis_prompt(self, context: Dict[str, Any]) -> str:
        """Construye el prompt para análisis visual"""
        
        tema = context.get("tema", "desconocido")
        estilo = context.get("estilo", "desconocido")
        palabras = context.get("palabras", [])
        
        return f"""Analiza esta imagen de una sopa de letras educativa.

CONTEXTO:
- Tema: {tema}
- Estilo artístico: {estilo}
- Palabras que deben estar en la grilla: {", ".join(palabras) if palabras else "N/A"}

EVALÚA LOS SIGUIENTES ASPECTOS (escala 0-10):

1. **LEGIBILIDAD** (0-10):
   - ¿Las letras de la grilla son claramente visibles?
   - ¿Hay suficiente contraste entre texto y fondo?
   - ¿El título es fácilmente legible?

2. **ARMONÍA VISUAL** (0-10):
   - ¿Los colores combinan bien?
   - ¿El diseño es atractivo para el público objetivo?
   - ¿El estilo es coherente?

3. **INTEGRIDAD**:
   - ¿La grilla de letras está intacta (no distorsionada)?
   - ¿El título está completo y nítido?

4. **PROBLEMAS** detectados (lista)

5. **SUGERENCIAS** de mejora (lista)

Responde en formato JSON:
{{
    "legibility_score": 8,
    "harmony_score": 7,
    "grid_intact": true,
    "title_readable": true,
    "description": "Descripción breve del análisis",
    "issues": ["problema 1", "problema 2"],
    "suggestions": ["sugerencia 1", "sugerencia 2"]
}}"""
    
    def _parse_response(self, response_text: str) -> VisualAnalysis:
        """Parsea la respuesta de Gemini"""
        try:
            # Buscar JSON en la respuesta
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            
            if json_match:
                data = json.loads(json_match.group())
                
                return VisualAnalysis(
                    success=True,
                    legibility_score=data.get("legibility_score", 5),
                    harmony_score=data.get("harmony_score", 5),
                    grid_intact=data.get("grid_intact", True),
                    title_readable=data.get("title_readable", True),
                    issues=data.get("issues", []),
                    suggestions=data.get("suggestions", []),
                    description=data.get("description", ""),
                    raw_response=response_text
                )
            else:
                return VisualAnalysis(
                    success=True,
                    legibility_score=5,
                    harmony_score=5,
                    grid_intact=True,
                    title_readable=True,
                    issues=[],
                    suggestions=[],
                    description=response_text[:500],
                    raw_response=response_text
                )
                
        except Exception as e:
            print(f"Error parseando respuesta: {e}")
            return self._fallback_analysis()
    
    def _fallback_analysis(self) -> VisualAnalysis:
        """Análisis fallback cuando Gemini no está disponible"""
        return VisualAnalysis(
            success=False,
            legibility_score=5,
            harmony_score=5,
            grid_intact=True,
            title_readable=True,
            issues=["Análisis visual no disponible"],
            suggestions=["Activar Gemini Vision para análisis inteligente"],
            description="Análisis fallback - Gemini no disponible"
        )
    
    async def suggest_improvements(
        self,
        image_b64: str,
        previous_issues: List[str],
        context: Dict[str, Any]
    ) -> List[str]:
        """
        Genera sugerencias específicas para mejorar una imagen.
        
        Útil para el sistema de reintentos del Director.
        """
        if not self._initialized:
            return ["Gemini no disponible para sugerencias"]
        
        try:
            prompt = f"""Analiza esta imagen de sopa de letras y los problemas detectados anteriormente.

PROBLEMAS ANTERIORES:
{chr(10).join(f"- {issue}" for issue in previous_issues)}

CONTEXTO:
- Tema: {context.get('tema', 'N/A')}
- Estilo: {context.get('estilo', 'N/A')}

Dame 3-5 sugerencias MUY ESPECÍFICAS para mejorar la imagen en la próxima generación.
Formato: una sugerencia por línea, sin numeración."""

            image_data = {
                "mime_type": "image/png",
                "data": image_b64
            }
            
            response = self._model.generate_content([prompt, image_data])
            
            # Parsear sugerencias
            suggestions = [
                line.strip() 
                for line in response.text.split('\n') 
                if line.strip() and not line.startswith('#')
            ]
            
            return suggestions[:5]
            
        except Exception as e:
            print(f"Error generando sugerencias: {e}")
            return []
    
    async def select_best_image(
        self,
        images_b64: List[str],
        criteria: str = "vibrant colors, high saturation, sharp details, artistic quality"
    ) -> int:
        """
        Selecciona la mejor imagen de una lista basada en criterios.
        Retorna el índice de la mejor imagen (0-based).
        """
        if not self._initialized or not images_b64:
            return 0
        
        try:
            print(f"    👁️ Gemini comparando {len(images_b64)} imágenes...")
            prompt = f"""Actúa como un Director de Arte experto. 
Tienes {len(images_b64)} imágenes candidatas para un fondo de sopa de letras de fantasía.

CRITERIOS DE SELECCIÓN:
- {criteria}
- EVITAR: Imágenes opacas, deslavadas, borrosas o con bajo contraste.
- BUSCAR: "Full color", colores vibrantes, definición nítida.

Tu tarea es elegir la imagen n.º 1 (índice 0) o la n.º 2 (índice 1), etc.
Responde SOLO con un JSON indicando el índice ganador y la razón.

Ejemplo:
{{
    "best_index": 1,
    "reason": "Tiene colores más vivos y mejor contraste que la primera."
}}"""
            
            # Preparar imágenes
            content = [prompt]
            for img_b64 in images_b64:
                content.append({
                    "mime_type": "image/png",
                    "data": img_b64
                })
            
            response = self._model.generate_content(content)
            
            # Parsear respuesta
            import re
            json_match = re.search(r'\{[\s\S]*\}', response.text)
            if json_match:
                data = json.loads(json_match.group())
                best_idx = data.get("best_index", 0)
                reason = data.get("reason", "No reason provided")
                print(f"    ✅ Gemini eligió imagen #{best_idx}: {reason}")
                return best_idx
            
            return 0
            
        except Exception as e:
            print(f"⚠️ Error en selección de imagen: {e}")
            return 0

    def get_analysis_summary(self, analysis: VisualAnalysis) -> str:
        """Genera un resumen legible del análisis"""
        status = "✅ APROBADO" if analysis.legibility_score >= 7 else "⚠️ NECESITA MEJORAS"
        
        lines = [
            f"👁️ Análisis Visual Gemini: {status}",
            f"   📖 Legibilidad: {analysis.legibility_score}/10",
            f"   🎨 Armonía: {analysis.harmony_score}/10",
            f"   📝 Grilla intacta: {'✅' if analysis.grid_intact else '❌'}",
            f"   🔤 Título legible: {'✅' if analysis.title_readable else '❌'}",
        ]
        
        if analysis.issues:
            lines.append("   ⚠️ Problemas:")
            for issue in analysis.issues[:3]:
                lines.append(f"      - {issue}")
        
        if analysis.suggestions:
            lines.append("   💡 Sugerencias:")
            for sug in analysis.suggestions[:3]:
                lines.append(f"      - {sug}")
        
        return "\n".join(lines)


# Singleton
_visual_analyzer: Optional[VisualAnalyzer] = None

def get_visual_analyzer() -> VisualAnalyzer:
    global _visual_analyzer
    if _visual_analyzer is None:
        _visual_analyzer = VisualAnalyzer()
    return _visual_analyzer
