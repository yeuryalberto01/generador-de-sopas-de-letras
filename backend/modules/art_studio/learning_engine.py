"""
Learning Engine - Motor de Aprendizaje con Bandit Simple

Implementa un algoritmo bandit para reponderar estilos y parámetros
basado en el feedback del usuario.

El sistema aprende:
- Qué estilos tienen mayor tasa de aprobación
- Qué paletas de colores funcionan mejor
- Qué rangos de parámetros (denoise, weights) producen mejores resultados
"""

import json
import math
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime

from .training_memory import get_training_memory, TrainingExample


@dataclass
class StyleScore:
    """Score de un estilo artístico"""
    name: str
    total_uses: int
    approvals: int
    rejections: int
    score: float  # UCB score para exploración/explotación
    
    @property
    def approval_rate(self) -> float:
        if self.total_uses == 0:
            return 0.5  # Prior neutral
        return self.approvals / self.total_uses


@dataclass
class ParameterRange:
    """Rango aprendido de un parámetro"""
    name: str
    min_value: float
    max_value: float
    best_value: float
    samples: int


class LearningEngine:
    """
    Motor de Aprendizaje con Bandit UCB
    
    Usa Upper Confidence Bound (UCB) para balancear:
    - Exploración: probar estilos menos usados
    - Explotación: usar estilos con mejor tasa de aprobación
    """
    
    # Constante de exploración UCB
    UCB_C = 1.5
    
    # Estilos disponibles
    STYLES = [
        "watercolor", "vintage", "modern", "sketch", 
        "playful", "futuristic", "elegant", "minimalist"
    ]
    
    def __init__(self):
        self.training = get_training_memory()
        self._style_scores: Dict[str, StyleScore] = {}
        self._param_ranges: Dict[str, ParameterRange] = {}
        self._total_rounds: int = 0
        
        # Inicializar scores
        self._initialize_scores()
        self._load_from_examples()
    
    def _initialize_scores(self):
        """Inicializa scores con prior uniforme"""
        for style in self.STYLES:
            self._style_scores[style] = StyleScore(
                name=style,
                total_uses=0,
                approvals=0,
                rejections=0,
                score=float('inf')  # Infinito = explorar primero
            )
    
    def _load_from_examples(self):
        """Carga estadísticas desde ejemplos de entrenamiento"""
        examples = self.training._examples
        
        for ex in examples:
            style = ex.design_plan.get('art_style', 'modern')
            
            if style not in self._style_scores:
                self._style_scores[style] = StyleScore(
                    name=style, total_uses=0, approvals=0, 
                    rejections=0, score=0
                )
            
            self._style_scores[style].total_uses += 1
            self._total_rounds += 1
            
            if ex.rating > 0:
                self._style_scores[style].approvals += 1
            elif ex.rating < 0:
                self._style_scores[style].rejections += 1
        
        # Recalcular UCB scores
        self._update_ucb_scores()
    
    def _update_ucb_scores(self):
        """Recalcula UCB scores para todos los estilos"""
        if self._total_rounds == 0:
            return
        
        log_n = math.log(self._total_rounds)
        
        for style, score in self._style_scores.items():
            if score.total_uses == 0:
                # Nunca usado = alta prioridad de exploración
                score.score = float('inf')
            else:
                # UCB = approval_rate + C * sqrt(ln(n) / n_i)
                exploration_bonus = self.UCB_C * math.sqrt(log_n / score.total_uses)
                score.score = score.approval_rate + exploration_bonus
    
    def record_feedback(
        self,
        style: str,
        approved: bool,
        params_used: Optional[Dict[str, float]] = None
    ):
        """
        Registra feedback para actualizar el modelo.
        
        Args:
            style: Estilo artístico usado
            approved: True si el usuario aprobó
            params_used: Parámetros usados (denoise, weights, etc.)
        """
        if style not in self._style_scores:
            self._style_scores[style] = StyleScore(
                name=style, total_uses=0, approvals=0,
                rejections=0, score=0
            )
        
        self._style_scores[style].total_uses += 1
        self._total_rounds += 1
        
        if approved:
            self._style_scores[style].approvals += 1
        else:
            self._style_scores[style].rejections += 1
        
        # Actualizar rangos de parámetros si fueron aprobados
        if approved and params_used:
            self._update_param_ranges(params_used)
        
        # Recalcular UCB
        self._update_ucb_scores()
        
        print(f"🧠 [LEARNING] Feedback registrado: {style} ({'✅' if approved else '❌'})")
        print(f"   Approval rate: {self._style_scores[style].approval_rate:.1%}")
    
    def _update_param_ranges(self, params: Dict[str, float]):
        """Actualiza rangos de parámetros exitosos"""
        for name, value in params.items():
            if name not in self._param_ranges:
                self._param_ranges[name] = ParameterRange(
                    name=name,
                    min_value=value,
                    max_value=value,
                    best_value=value,
                    samples=1
                )
            else:
                pr = self._param_ranges[name]
                pr.min_value = min(pr.min_value, value)
                pr.max_value = max(pr.max_value, value)
                # Moving average para best_value
                pr.best_value = (pr.best_value * pr.samples + value) / (pr.samples + 1)
                pr.samples += 1
    
    def suggest_style(self, mode: str = "explorar") -> str:
        """
        Sugiere el mejor estilo según UCB.
        
        Args:
            mode: "explorar" (más variación) o "producir" (más explotación)
        
        Returns:
            Nombre del estilo sugerido
        """
        if mode == "producir":
            # En modo producir, usar el de mayor approval_rate
            best_style = max(
                self._style_scores.values(),
                key=lambda s: s.approval_rate if s.total_uses > 0 else 0
            )
        else:
            # En modo explorar, usar UCB
            best_style = max(
                self._style_scores.values(),
                key=lambda s: s.score
            )
        
        return best_style.name
    
    def suggest_params(self, param_name: str) -> Tuple[float, float, float]:
        """
        Sugiere un rango de parámetros basado en lo aprendido.
        
        Returns:
            (min, best, max) para el parámetro
        """
        if param_name not in self._param_ranges:
            # Defaults
            defaults = {
                "denoise": (0.5, 0.65, 0.8),
                "controlnet_weight": (0.6, 0.8, 1.0),
                "ipadapter_weight": (0.2, 0.35, 0.5),
            }
            return defaults.get(param_name, (0.0, 0.5, 1.0))
        
        pr = self._param_ranges[param_name]
        return (pr.min_value, pr.best_value, pr.max_value)
    
    def get_style_ranking(self) -> List[Dict[str, Any]]:
        """Obtiene ranking de estilos por tasa de aprobación"""
        ranking = []
        for style in self._style_scores.values():
            ranking.append({
                "style": style.name,
                "uses": style.total_uses,
                "approval_rate": style.approval_rate,
                "approvals": style.approvals,
                "rejections": style.rejections,
                "ucb_score": style.score if style.score != float('inf') else "∞"
            })
        
        # Ordenar por approval_rate
        ranking.sort(key=lambda x: x["approval_rate"], reverse=True)
        return ranking
    
    def get_learning_summary(self) -> str:
        """Genera un resumen del aprendizaje"""
        lines = [
            f"📊 Learning Engine Summary",
            f"   Total rounds: {self._total_rounds}",
            f"   Styles tracked: {len(self._style_scores)}",
            "",
            "   Top styles by approval rate:"
        ]
        
        for item in self.get_style_ranking()[:5]:
            rate = item["approval_rate"]
            uses = item["uses"]
            lines.append(
                f"   • {item['style']}: {rate:.0%} ({uses} uses)"
            )
        
        if self._param_ranges:
            lines.append("")
            lines.append("   Learned parameter ranges:")
            for name, pr in self._param_ranges.items():
                lines.append(
                    f"   • {name}: [{pr.min_value:.2f} - {pr.max_value:.2f}] best={pr.best_value:.2f}"
                )
        
        return "\n".join(lines)
    
    def save_state(self, filepath: Optional[Path] = None):
        """Guarda el estado del engine"""
        if filepath is None:
            filepath = Path(__file__).parent.parent.parent / "data" / "learning_state.json"
        
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        state = {
            "total_rounds": self._total_rounds,
            "style_scores": {
                name: asdict(score) 
                for name, score in self._style_scores.items()
            },
            "param_ranges": {
                name: asdict(pr)
                for name, pr in self._param_ranges.items()
            },
            "updated_at": datetime.now().isoformat()
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, ensure_ascii=False, default=str)
    
    def load_state(self, filepath: Optional[Path] = None):
        """Carga el estado del engine"""
        if filepath is None:
            filepath = Path(__file__).parent.parent.parent / "data" / "learning_state.json"
        
        if not filepath.exists():
            return
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                state = json.load(f)
            
            self._total_rounds = state.get("total_rounds", 0)
            
            for name, data in state.get("style_scores", {}).items():
                self._style_scores[name] = StyleScore(**data)
            
            for name, data in state.get("param_ranges", {}).items():
                self._param_ranges[name] = ParameterRange(**data)
            
            self._update_ucb_scores()
            
        except Exception as e:
            print(f"Error loading learning state: {e}")


# Singleton
_learning_engine: Optional[LearningEngine] = None

def get_learning_engine() -> LearningEngine:
    global _learning_engine
    if _learning_engine is None:
        _learning_engine = LearningEngine()
    return _learning_engine
