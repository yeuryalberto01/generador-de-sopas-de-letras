"""
Smart Brain - Motor de Inteligencia para Auto-Aprendizaje
===========================================================
Usa embeddings semánticos para:
1. Buscar ejemplos de entrenamiento similares
2. Predecir éxito de nuevos prompts
3. Sugerir reglas automáticamente
"""

import json
import os
import glob
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from pydantic import BaseModel
from fastapi import APIRouter

# Lazy loading for ML libraries (only load when needed)
_embedder = None
_cosine_similarity = None

def get_embedder():
    """Lazy load sentence transformer model"""
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Modelo ligero pero efectivo para similitud semántica
            _embedder = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Smart Brain: Modelo de embeddings cargado")
        except ImportError:
            print("⚠️ sentence-transformers no instalado. Usando modo fallback.")
            _embedder = "fallback"
    return _embedder

def get_cosine_similarity():
    """Lazy load sklearn cosine similarity"""
    global _cosine_similarity
    if _cosine_similarity is None:
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            _cosine_similarity = cosine_similarity
        except ImportError:
            _cosine_similarity = "fallback"
    return _cosine_similarity

# Router
router = APIRouter(prefix="/api/ml/smart", tags=["smart-brain"])

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BRAIN_DATA_DIR = BASE_DIR / "backend" / "data" / "brain"
MEMORY_DIR = BRAIN_DATA_DIR / "memory"
EMBEDDINGS_CACHE = BRAIN_DATA_DIR / "embeddings_cache.json"

# Ensure directories exist
os.makedirs(MEMORY_DIR, exist_ok=True)


class PredictionRequest(BaseModel):
    prompt: str
    style: str = ""


class PredictionResponse(BaseModel):
    success_probability: float
    similar_examples: List[dict]
    suggestions: List[str]
    reasoning: str


class InsightData(BaseModel):
    pattern_name: str
    count: int
    impact: str  # 'positive' | 'negative' | 'neutral'
    description: str


class SmartBrain:
    """Motor de inteligencia con embeddings semánticos"""
    
    def __init__(self):
        self.embeddings_cache: Dict[str, List[float]] = {}
        self._load_cache()
    
    def _load_cache(self):
        """Carga cache de embeddings si existe"""
        if EMBEDDINGS_CACHE.exists():
            try:
                with open(EMBEDDINGS_CACHE, 'r', encoding='utf-8') as f:
                    self.embeddings_cache = json.load(f)
            except:
                self.embeddings_cache = {}
    
    def _save_cache(self):
        """Guarda cache de embeddings"""
        with open(EMBEDDINGS_CACHE, 'w', encoding='utf-8') as f:
            json.dump(self.embeddings_cache, f)
    
    def get_embedding(self, text: str) -> Optional[List[float]]:
        """Genera embedding para un texto"""
        # Check cache first
        cache_key = text[:100]  # Limite para key
        if cache_key in self.embeddings_cache:
            return self.embeddings_cache[cache_key]
        
        embedder = get_embedder()
        if embedder == "fallback" or embedder is None:
            return None
        
        try:
            embedding = embedder.encode(text).tolist()
            self.embeddings_cache[cache_key] = embedding
            self._save_cache()
            return embedding
        except Exception as e:
            print(f"Error generando embedding: {e}")
            return None
    
    def find_similar(self, query: str, top_k: int = 5) -> List[Tuple[dict, float]]:
        """Encuentra ejemplos similares usando cosine similarity"""
        query_emb = self.get_embedding(query)
        if query_emb is None:
            return self._fallback_search(query, top_k)
        
        cos_sim = get_cosine_similarity()
        if cos_sim == "fallback":
            return self._fallback_search(query, top_k)
        
        results = []
        
        # Cargar todos los ejemplos
        json_files = list(MEMORY_DIR.glob("*.json"))
        
        for fpath in json_files:
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Generar embedding para el prompt del ejemplo
                example_text = f"{data.get('prompt', '')} {data.get('style', '')}"
                example_emb = self.get_embedding(example_text)
                
                if example_emb:
                    # Calcular similitud
                    similarity = cos_sim([query_emb], [example_emb])[0][0]
                    data['_filename'] = fpath.name
                    data['_similarity'] = float(similarity)
                    results.append((data, similarity))
            except:
                continue
        
        # Ordenar por similitud descendente
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    def _fallback_search(self, query: str, top_k: int) -> List[Tuple[dict, float]]:
        """Búsqueda por palabras clave como fallback"""
        query_words = set(query.lower().split())
        results = []
        
        json_files = list(MEMORY_DIR.glob("*.json"))
        
        for fpath in json_files:
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                text = f"{data.get('prompt', '')} {data.get('style', '')}".lower()
                matches = sum(1 for w in query_words if w in text)
                
                if matches > 0:
                    score = matches / len(query_words)
                    data['_filename'] = fpath.name
                    data['_similarity'] = score
                    results.append((data, score))
            except:
                continue
        
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]
    
    def predict_success(self, prompt: str, style: str = "") -> PredictionResponse:
        """Predice la probabilidad de éxito de un prompt"""
        query = f"{prompt} {style}".strip()
        similar = self.find_similar(query, top_k=10)
        
        if not similar:
            return PredictionResponse(
                success_probability=0.5,
                similar_examples=[],
                suggestions=["No hay suficientes datos para predecir. ¡Sigue entrenando!"],
                reasoning="Sin ejemplos previos similares"
            )
        
        # Calcular probabilidad basada en ratings de ejemplos similares
        total_weight = 0
        weighted_success = 0
        
        for data, sim in similar:
            rating = data.get('rating', 0)
            weight = sim  # Usar similitud como peso
            total_weight += weight
            if rating > 0:
                weighted_success += weight
        
        probability = weighted_success / total_weight if total_weight > 0 else 0.5
        
        # Generar sugerencias basadas en ejemplos exitosos
        suggestions = self._generate_suggestions(similar)
        
        # Preparar ejemplos para retorno (sin embedding en la respuesta)
        examples = []
        for data, sim in similar[:5]:
            examples.append({
                "prompt": data.get('prompt', ''),
                "style": data.get('style', ''),
                "rating": data.get('rating', 0),
                "similarity": round(sim, 3)
            })
        
        return PredictionResponse(
            success_probability=round(probability, 2),
            similar_examples=examples,
            suggestions=suggestions,
            reasoning=f"Basado en {len(similar)} ejemplos similares"
        )
    
    def _generate_suggestions(self, similar: List[Tuple[dict, float]]) -> List[str]:
        """Genera sugerencias basadas en patrones de éxito/fallo"""
        suggestions = []
        
        # Separar exitosos y fallidos
        successes = [d for d, s in similar if d.get('rating', 0) > 0]
        failures = [d for d, s in similar if d.get('rating', 0) < 0]
        
        if successes:
            # Encontrar palabras comunes en éxitos
            all_words = []
            for s in successes:
                all_words.extend(s.get('prompt', '').lower().split())
            
            from collections import Counter
            common = Counter(all_words).most_common(5)
            if common:
                keywords = [w for w, c in common if len(w) > 3 and c > 1]
                if keywords:
                    suggestions.append(f"💡 Palabras clave exitosas: {', '.join(keywords[:3])}")
        
        if failures:
            # Encontrar palabras comunes en fallos
            all_words = []
            for f in failures:
                all_words.extend(f.get('prompt', '').lower().split())
            
            from collections import Counter
            common = Counter(all_words).most_common(5)
            if common:
                avoid_words = [w for w, c in common if len(w) > 3 and c > 1]
                if avoid_words:
                    suggestions.append(f"⚠️ Evitar términos: {', '.join(avoid_words[:3])}")
        
        if not suggestions:
            suggestions.append("📊 Continúa entrenando para mejores predicciones")
        
        return suggestions
    
    def get_insights(self) -> List[InsightData]:
        """Analiza patrones en los datos de entrenamiento"""
        insights = []
        
        # Conteo por estilo
        style_counts: Dict[str, Dict[str, int]] = {}
        total_count = 0
        
        json_files = list(MEMORY_DIR.glob("*.json"))
        
        for fpath in json_files:
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                style = data.get('style', 'unknown')
                rating = data.get('rating', 0)
                
                if style not in style_counts:
                    style_counts[style] = {'success': 0, 'fail': 0}
                
                if rating > 0:
                    style_counts[style]['success'] += 1
                else:
                    style_counts[style]['fail'] += 1
                
                total_count += 1
            except:
                continue
        
        # Generar insights por estilo
        for style, counts in style_counts.items():
            total = counts['success'] + counts['fail']
            if total < 2:
                continue
            
            success_rate = counts['success'] / total
            
            if success_rate > 0.7:
                impact = 'positive'
                desc = f"Estilo '{style}' tiene {int(success_rate*100)}% de éxito"
            elif success_rate < 0.3:
                impact = 'negative'
                desc = f"Estilo '{style}' tiene solo {int(success_rate*100)}% de éxito"
            else:
                impact = 'neutral'
                desc = f"Estilo '{style}' tiene {int(success_rate*100)}% de éxito"
            
            insights.append(InsightData(
                pattern_name=f"style_{style}",
                count=total,
                impact=impact,
                description=desc
            ))
        
        # Insight general
        if total_count > 0:
            insights.append(InsightData(
                pattern_name="total_training",
                count=total_count,
                impact="neutral",
                description=f"Total de {total_count} ejemplos de entrenamiento"
            ))
        
        return insights
    
    def suggest_rules(self) -> List[Dict]:
        """Sugiere nuevas reglas basadas en patrones de fallo"""
        suggestions = []
        
        # Recopilar prompts fallidos
        failed_prompts = []
        json_files = list(MEMORY_DIR.glob("*.json"))
        
        for fpath in json_files:
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if data.get('rating', 0) < 0:
                    failed_prompts.append(data.get('prompt', ''))
            except:
                continue
        
        if len(failed_prompts) < 3:
            return []
        
        # Encontrar palabras problemáticas comunes
        from collections import Counter
        all_words = []
        for prompt in failed_prompts:
            all_words.extend(prompt.lower().split())
        
        common = Counter(all_words).most_common(10)
        
        for word, count in common:
            if len(word) > 4 and count >= 2:
                suggestions.append({
                    "type": "visual",
                    "content": f"Evitar el uso excesivo de '{word}' en prompts - asociado con {count} fallos",
                    "confidence": min(count / len(failed_prompts), 1.0)
                })
        
        return suggestions[:5]


# Instancia global
smart_brain = SmartBrain()


# --- API Endpoints ---

@router.post("/predict", response_model=PredictionResponse)
def predict_prompt_success(req: PredictionRequest):
    """Predice la probabilidad de éxito de un prompt"""
    return smart_brain.predict_success(req.prompt, req.style)


@router.get("/insights")
def get_brain_insights():
    """Obtiene insights y patrones detectados"""
    insights = smart_brain.get_insights()
    return {"insights": [i.dict() for i in insights]}


@router.get("/suggest-rules")
def get_rule_suggestions():
    """Obtiene sugerencias automáticas de reglas"""
    suggestions = smart_brain.suggest_rules()
    return {"suggestions": suggestions}


@router.post("/similar")
def find_similar_examples(req: PredictionRequest):
    """Encuentra ejemplos similares a un prompt"""
    similar = smart_brain.find_similar(f"{req.prompt} {req.style}", top_k=10)
    
    results = []
    for data, sim in similar:
        results.append({
            "prompt": data.get('prompt', ''),
            "style": data.get('style', ''),
            "rating": data.get('rating', 0),
            "similarity": round(sim, 3),
            "filename": data.get('_filename', '')
        })
    
    return {"similar": results}


@router.get("/health")
def smart_brain_health():
    """Verifica el estado del motor inteligente"""
    embedder = get_embedder()
    cos_sim = get_cosine_similarity()
    
    ml_available = embedder != "fallback" and cos_sim != "fallback"
    
    return {
        "status": "healthy" if ml_available else "degraded",
        "ml_enabled": ml_available,
        "embeddings_cached": len(smart_brain.embeddings_cache),
        "model": "all-MiniLM-L6-v2" if ml_available else "keyword-fallback"
    }
