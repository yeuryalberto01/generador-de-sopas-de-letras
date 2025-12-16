"""
Training Memory - Sistema de Aprendizaje Continuo

Guarda ejemplos exitosos de generación para que Gemini aprenda 
de lo que funciona y mejore con el tiempo.

Almacena:
- Prompts exitosos (diseño planificado por Gemini)
- Imágenes generadas (previews)
- Feedback del usuario (likes/dislikes)
- Metadata (tema, estilo, colores, etc.)
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, asdict
import shutil

# Directorio para guardar los ejemplos de entrenamiento
TRAINING_DIR = Path(__file__).parent.parent.parent / "data" / "art_training"


@dataclass
class TrainingExample:
    """Un ejemplo de entrenamiento (positivo o negativo)"""
    id: str
    timestamp: str
    
    # Datos del puzzle
    puzzle_title: str
    puzzle_theme: str
    words: List[str]
    target_audience: str
    
    # Plan generado por Gemini
    design_plan: Dict[str, Any]
    
    # Prompts usados para ComfyUI
    background_prompt: str
    frame_prompt: str
    illustrations_prompt: str
    
    # Paths a las imágenes generadas
    background_image: Optional[str] = None
    frame_image: Optional[str] = None
    illustrations_image: Optional[str] = None
    final_image: Optional[str] = None
    
    # Feedback del usuario
    rating: int = 0  # -1 = dislike, 0 = neutral, 1 = like
    feedback_text: Optional[str] = None
    feedback_tags: List[str] = None
    
    # NUEVO: Problemas específicos identificados (para feedback negativo)
    problems: List[str] = None  # ["ilegible", "colores opacos", "distribución mala"]
    improvements_needed: List[str] = None  # ["más contraste", "mejor espaciado"]
    
    # Métricas de calidad
    legibility_score: Optional[float] = None
    contrast_score: Optional[float] = None
    
    def __post_init__(self):
        if self.feedback_tags is None:
            self.feedback_tags = []
        if self.problems is None:
            self.problems = []
        if self.improvements_needed is None:
            self.improvements_needed = []


class TrainingMemory:
    """Sistema de memoria de entrenamiento para aprendizaje continuo"""
    
    def __init__(self):
        self.training_dir = TRAINING_DIR
        self.examples_file = self.training_dir / "examples.json"
        self.images_dir = self.training_dir / "images"
        
        # Crear directorios si no existen
        self.training_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        
        self._examples: List[TrainingExample] = []
        self._load_examples()
    
    def _load_examples(self):
        """Carga ejemplos existentes del disco"""
        if self.examples_file.exists():
            try:
                with open(self.examples_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._examples = [
                        TrainingExample(**ex) for ex in data
                    ]
            except Exception as e:
                print(f"Error loading training examples: {e}")
                self._examples = []
    
    def _save_examples(self):
        """Guarda ejemplos al disco"""
        try:
            with open(self.examples_file, 'w', encoding='utf-8') as f:
                json.dump(
                    [asdict(ex) for ex in self._examples],
                    f, indent=2, ensure_ascii=False
                )
        except Exception as e:
            print(f"Error saving training examples: {e}")
    
    def save_generation(
        self,
        puzzle_title: str,
        puzzle_theme: str,
        words: List[str],
        target_audience: str,
        design_plan: Dict[str, Any],
        prompts: Dict[str, str],
        images: Dict[str, str] = None,  # Paths a imágenes
        images_b64: Dict[str, str] = None  # Base64 strings
    ) -> str:
        """
        Guarda una generación como ejemplo de entrenamiento.
        Retorna el ID del ejemplo.
        """
        import uuid
        import base64
        
        example_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().isoformat()
        
        # Copiar imágenes al directorio de entrenamiento
        saved_images = {}
        
        # 1. Procesar paths existentes
        if images:
            for layer_name, img_path in images.items():
                if img_path and Path(img_path).exists():
                    new_name = f"{example_id}_{layer_name}.png"
                    new_path = self.images_dir / new_name
                    shutil.copy(img_path, new_path)
                    saved_images[layer_name] = str(new_path)
                    
        # 2. Procesar Base64 (Prioridad si existe)
        if images_b64:
            for layer_name, b64_data in images_b64.items():
                if b64_data:
                    try:
                        new_name = f"{example_id}_{layer_name}.png"
                        new_path = self.images_dir / new_name
                        with open(new_path, "wb") as f:
                            f.write(base64.b64decode(b64_data))
                        saved_images[layer_name] = str(new_path)
                    except Exception as e:
                        print(f"⚠️ Error saving b64 image {layer_name}: {e}")
        
        example = TrainingExample(
            id=example_id,
            timestamp=timestamp,
            puzzle_title=puzzle_title,
            puzzle_theme=puzzle_theme,
            words=words,
            target_audience=target_audience,
            design_plan=design_plan,
            background_prompt=prompts.get("background", ""),
            frame_prompt=prompts.get("frame", ""),
            illustrations_prompt=prompts.get("illustrations", ""),
            background_image=saved_images.get("background"),
            frame_image=saved_images.get("frame"),
            illustrations_image=saved_images.get("illustrations"),
            final_image=saved_images.get("final"),
        )
        
        self._examples.append(example)
        self._save_examples()
        
        print(f"💾 [TRAINING] Saved example: {example_id}")
        return example_id
    
    def add_feedback(
        self,
        example_id: str,
        rating: int,
        feedback_text: Optional[str] = None,
        feedback_tags: List[str] = None,
        problems: List[str] = None,  # NUEVO
        improvements_needed: List[str] = None  # NUEVO
    ):
        """Agrega feedback del usuario a un ejemplo (positivo O negativo)"""
        for ex in self._examples:
            if ex.id == example_id:
                ex.rating = rating
                ex.feedback_text = feedback_text
                ex.feedback_tags = feedback_tags or []
                ex.problems = problems or []
                ex.improvements_needed = improvements_needed or []
                self._save_examples()
                emoji = "👍" if rating > 0 else "👎" if rating < 0 else "🤷"
                print(f"{emoji} [TRAINING] Feedback added to {example_id}: {rating}")
                return True
        return False
    
    def get_positive_examples(self, limit: int = 10) -> List[TrainingExample]:
        """Obtiene ejemplos con rating positivo para usar como referencia"""
        positive = [ex for ex in self._examples if ex.rating > 0]
        # Ordenar por fecha más reciente
        positive.sort(key=lambda x: x.timestamp, reverse=True)
        return positive[:limit]
    
    def get_examples_by_theme(self, theme_keywords: List[str]) -> List[TrainingExample]:
        """Busca ejemplos similares por tema"""
        matches = []
        for ex in self._examples:
            theme_lower = ex.puzzle_theme.lower()
            if any(kw.lower() in theme_lower for kw in theme_keywords):
                matches.append(ex)
        return matches
    
    def get_negative_examples(self, limit: int = 5) -> List[TrainingExample]:
        """Obtiene ejemplos con rating negativo para aprender qué NO hacer"""
        negative = [ex for ex in self._examples if ex.rating < 0]
        negative.sort(key=lambda x: x.timestamp, reverse=True)
        return negative[:limit]
    
    def get_learning_context(self, current_theme: str) -> str:
        """
        Genera un contexto de aprendizaje para Gemini basado en ejemplos anteriores.
        INCLUYE TANTO EJEMPLOS POSITIVOS COMO NEGATIVOS.
        """
        positive_examples = self.get_positive_examples(3)
        negative_examples = self.get_negative_examples(3)
        
        if not positive_examples and not negative_examples:
            return ""
        
        context_parts = []
        
        # Ejemplos positivos (qué hacer)
        if positive_examples:
            context_parts.append("## ✅ Ejemplos Exitosos (IMITAR ESTOS)")
            for i, ex in enumerate(positive_examples, 1):
                context_parts.append(f"""
### Bueno {i}: {ex.puzzle_title}
- **Estilo**: {ex.design_plan.get('art_style', 'N/A')}
- **Colores**: {ex.design_plan.get('color_palette', [])}
- **Por qué funcionó**: {ex.feedback_text or 'Le gustó al usuario'}
- **Tags**: {', '.join(ex.feedback_tags) if ex.feedback_tags else 'N/A'}""")
        
        # Ejemplos negativos (qué NO hacer)
        if negative_examples:
            context_parts.append("\n## ❌ Ejemplos Fallidos (EVITAR ESTOS ERRORES)")
            for i, ex in enumerate(negative_examples, 1):
                problems_str = ', '.join(ex.problems) if ex.problems else 'No especificado'
                improvements_str = ', '.join(ex.improvements_needed) if ex.improvements_needed else 'No especificado'
                context_parts.append(f"""
### Malo {i}: {ex.puzzle_title}
- **Problemas**: {problems_str}
- **Mejoras necesarias**: {improvements_str}
- **Feedback**: {ex.feedback_text or 'No le gustó'}""")
        
        return "\n".join(context_parts)
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas del entrenamiento"""
        total = len(self._examples)
        positive = sum(1 for ex in self._examples if ex.rating > 0)
        negative = sum(1 for ex in self._examples if ex.rating < 0)
        neutral = sum(1 for ex in self._examples if ex.rating == 0)
        
        # Estilos más populares
        styles = {}
        for ex in self._examples:
            style = ex.design_plan.get('art_style', 'unknown')
            styles[style] = styles.get(style, 0) + 1
        
        return {
            "total_examples": total,
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
            "approval_rate": positive / total if total > 0 else 0,
            "popular_styles": styles
        }


# Singleton
_training_memory: Optional[TrainingMemory] = None

def get_training_memory() -> TrainingMemory:
    global _training_memory
    if _training_memory is None:
        _training_memory = TrainingMemory()
    return _training_memory
