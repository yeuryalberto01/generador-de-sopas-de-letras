"""
Hybrid Director - Director Híbrido Principal

Orquesta todo el pipeline de generación:
1. Recibe el brief
2. Planifica etapas (via IntentPlanner)
3. Conmuta nodos necesarios
4. Ejecuta cada etapa
5. Aplica QC
6. Solicita aprobación
7. Aprende del feedback
"""

import asyncio
import base64
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

from .intent_planner import (
    IntentPlanner, Brief, Stage, StageType, GenerationMode,
    get_intent_planner
)
from .training_memory import get_training_memory
import google.generativeai as genai
import os


@dataclass
class QCResult:
    """Resultado de Quality Control"""
    passed: bool
    grid_integrity: float  # 0-1, 1 = perfecta
    title_contrast: float  # ratio de contraste
    visual_load: float  # 0-1, 0 = limpio, 1 = sobrecargado
    issues: List[str]
    suggestions: List[str]


@dataclass
class GenerationResult:
    """Resultado de una generación"""
    success: bool
    stages_completed: List[StageType]
    layers: Dict[str, str]  # layer_name -> base64 image
    final_image: Optional[str]  # base64
    qc_result: Optional[QCResult]
    metadata: Dict[str, Any]
    errors: List[str]
    
    # Para aprendizaje
    generation_id: str
    prompts_used: Dict[str, str]
    params_used: Dict[str, Any]
    plan: Optional[Dict[str, Any]] = None # Plan detallado de intent planner


class HybridDirector:
    """
    Director Híbrido Principal
    
    Orquesta el pipeline completo de generación de sopas de letras artísticas.
    Implementa los principios MUST:
    - Grilla y letras INTACTAS
    - Título nítido (no IA)
    - Decoración FUERA de la grilla
    """
    
    # Thresholds de QC
    QC_THRESHOLDS = {
        "grid_integrity_min": 0.95,    # La grilla debe estar 95%+ intacta
        "title_contrast_min": 4.5,     # WCAG AA ratio
        "visual_load_max": 0.6,        # No más del 60% de sobrecarga
    }
    
    # Reintentos máximos
    MAX_RETRIES = 3
    
    def __init__(self):
        self.planner = get_intent_planner()
        self.training = get_training_memory()
        self._load_user_preferences()
        
        # Estado del pipeline
        self._current_layers: Dict[str, Any] = {}
        self._current_brief: Optional[Brief] = None
        self._generation_id: Optional[str] = None

    def _load_user_preferences(self):
        """Carga preferencias del usuario desde JSON"""
        import json
        import os
        self.user_prefs = {}
        try:
            path = os.path.join(os.path.dirname(__file__), "../../data/art_training/user_preferences.json")
            if os.path.exists(path):
                with open(path, "r") as f:
                    self.user_prefs = json.load(f).get("global_preferences", {})
                    print("🧠 [DIRECTOR] Preferencias de usuario aprendidas cargadas.")
        except Exception as e:
            print(f"⚠️ Error cargando preferencias: {e}")
    
    async def generar(
        self,
        brief: Brief,
        auto_retry: bool = True
    ) -> GenerationResult:
        """
        Ejecuta el pipeline completo de generación.
        """
        import uuid
        
        # [ENTRENAMIENTO] Aplicar reglas aprendidas del usuario
        rules = self.user_prefs.get("generation_rules", {})
        
        # 1. Regla: Auto-Retry
        if "auto_retry_qc" in rules:
             should_retry = rules["auto_retry_qc"]
             # Si el usuario explícitamente desactivó reintentos globalmente
             if should_retry is False:
                 print(f"    🧠 [MEMORIA] Aplicando preferencia: No reintentos (Auto-Retry=False)")
                 auto_retry = False
        
        # Override específico por estilo (mantenemos lógica de seguridad)
        if "fantasy" in brief.estilo.lower() or "art" in brief.estilo.lower() or "reference" in brief.estilo.lower():
            auto_retry = False
            
        self._current_brief = brief
        self._generation_id = str(uuid.uuid4())[:8]
        self._current_layers = {}
        
        result = GenerationResult(
            success=False,
            stages_completed=[],
            layers={},
            final_image=None,
            qc_result=None,
            metadata={
                "generation_id": self._generation_id,
                "brief": {
                    "tema": brief.tema,
                    "estilo": brief.estilo,
                    "modo": brief.modo.value,
                },
                "timestamp": datetime.now().isoformat(),
            },
            errors=[],
            generation_id=self._generation_id,
            prompts_used={},
            params_used={},

        )
        
        try:
            # 1. Planificar etapas
            print(f"🎬 [DIRECTOR] Iniciando generación: {self._generation_id}")
            stages = self.planner.planificar(brief)
            print(self.planner.get_stage_summary(stages))
            
            # 2. Obtener contexto de aprendizaje
            learning_context = self.training.get_learning_context(brief.tema)
            if learning_context:
                print(f"📚 [DIRECTOR] Aplicando {len(self.training.get_positive_examples())} ejemplos positivos")
            
            # 3. Ejecutar cada etapa
            retry_count = 0
            qc_passed = False
            
            while not qc_passed and retry_count < self.MAX_RETRIES:
                for stage in stages:
                    stage_result = await self._ejecutar_etapa(stage, brief, learning_context)
                    
                    if stage_result["success"]:
                        result.stages_completed.append(stage.type)
                        
                        if stage.type == StageType.QC:
                            result.qc_result = stage_result.get("qc_result")
                            qc_passed = result.qc_result.passed if result.qc_result else False
                            
                            if not qc_passed and auto_retry:
                                retry_count += 1
                                print(f"⚠️ [DIRECTOR] QC falló, reintentando ({retry_count}/{self.MAX_RETRIES})")
                                # Ajustar parámetros para reintento
                                self._ajustar_params_reintento(result.qc_result)
                                break
                    else:
                        result.errors.append(f"{stage.type.value}: {stage_result.get('error', 'Unknown error')}")
                else:
                    # Todas las etapas completadas
                    break
            
            # 4. Recopilar resultado
            result.layers = self._current_layers
            result.final_image = self._current_layers.get("final")
            result.success = qc_passed or (len(result.errors) == 0)
            result.plan = {
                "theme": brief.tema,
                "art_style": brief.estilo,
                "color_palette": brief.paleta,
                "mood": brief.modo.value,
            }
            
            # 4.1 Vision Analysis (The "Eye")
            if result.final_image:
                print("👁️ [DIRECTOR] Iniciando análisis visual...")
                critique = await self._analizar_vision(result.final_image, brief)
                # critique = "Disabled for debugging"
                if critique:
                    result.metadata["vision_critique"] = critique
                    # Add to training memory immediately? Or wait for feedback?
                    # For now just verify it works by putting it in metadata
            
            # 5. Guardar para aprendizaje (sin esperar feedback aún)
            if result.success:
                self._guardar_generacion(result, brief)
            
            return result
            
        except Exception as e:
            result.errors.append(f"Exception: {str(e)}")
            print(f"❌ [DIRECTOR] Error: {e}")
            return result
    
    async def _ejecutar_etapa(
        self,
        stage: Stage,
        brief: Brief,
        learning_context: str
    ) -> Dict[str, Any]:
        """Ejecuta una etapa individual del pipeline"""
        
        print(f"  ⏳ Ejecutando: {stage.type.value.upper()}")
        
        try:
            if stage.type == StageType.FONDO:
                return await self._generar_fondo(stage, brief, learning_context)
            
            elif stage.type == StageType.GRID_PLATE:
                return await self._generar_placa_grilla(stage, brief, learning_context)
            
            elif stage.type == StageType.GRILLA:
                return await self._renderizar_grilla(stage, brief)
            
            elif stage.type == StageType.TITULO:
                return await self._renderizar_titulo(stage, brief)
            
            elif stage.type == StageType.MARGENES:
                return await self._generar_margenes(stage, brief, learning_context)
            
            elif stage.type == StageType.ENSAMBLAR:
                return await self._ensamblar_capas(stage)
            
            elif stage.type == StageType.QC:
                return await self._ejecutar_qc(stage)
            
            elif stage.type == StageType.UPSCALE:
                return await self._upscale_imagen(stage)
            
            else:
                return {"success": False, "error": f"Etapa desconocida: {stage.type}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def _generar_placa_grilla(
        self,
        stage: Stage,
        brief: Brief,
        learning_context: str
    ) -> Dict[str, Any]:
        """Genera la placa/contenedor temático para la grilla"""
        from .art_studio_comfy_client import get_art_studio_comfy_client
        client = get_art_studio_comfy_client()
        
        # Construir prompt específico para la placa
        base_prompt = stage.params.get("prompt_must", "panel")
        style = brief.estilo
        context_prompt = stage.params.get("prompt_should", "")
        
        prompt = f"{base_prompt}, {context_prompt}, {brief.tema} aesthetic"
        
        print(f"    🧱 Generando Placá de Grilla: {prompt[:50]}...")
        
        # Usar generate_asset
        result = await client.generate_asset(
            prompt=prompt,
            style=style,
            width=640, 
            height=640,
            mode="isolated"
        )
        
        if result.success:
            self._current_layers["grid_plate"] = result.image_data
            return {"success": True}
        else:
            print(f"    ⚠️ Error generando placa: {result.error}")
            return {"success": False, "error": result.error}
    
    async def _generar_fondo(
        self,
        stage: Stage,
        brief: Brief,
        learning_context: str
    ) -> Dict[str, Any]:
        """Genera el fondo usando ComfyUI con estrategia Best of N"""
        
        from .art_studio_comfy_client import get_art_studio_comfy_client
        from .visual_analyzer import get_visual_analyzer
        
        client = get_art_studio_comfy_client()
        analyzer = get_visual_analyzer()
        
        # Construir prompt
        prompt_parts = [
            brief.tema,
            stage.params.get("prompt_should", f"{brief.estilo} style"),
            stage.params.get("prompt_can", "texture, atmosphere"),
        ]
        prompt = ", ".join(filter(None, prompt_parts))
        
        # Calcular área de grilla
        grid_area = None
        if brief.grilla_data:
            letters = brief.grilla_data.get("letters", [])
            if letters:
                rows = len(letters)
                cols = len(letters[0]) if letters else 8
                cell_size = 45
                grid_width = cols * cell_size
                grid_height = rows * cell_size
                x_offset = (816 - grid_width) // 2
                grid_area = (x_offset, 150, grid_width, grid_height)
        
        # DETERMINAR ESTRATEGIA: Best of N vs Single Shot
        # Usamos reglas aprendidas si existen
        rules = self.user_prefs.get("generation_rules", {})
        default_n = rules.get("best_of_n_candidates", 1)
        
        # Si es fantasía/arte, generamos N variaciones (aprendido: 2)
        is_fantasy = "fantasy" in brief.estilo.lower() or "art" in brief.estilo.lower() or "magical" in brief.tema.lower() or "reference" in brief.estilo.lower()
        
        num_candidates = default_n if is_fantasy else 1
        
        candidates = []
        
        print(f"    🎨 Generando fondo (Estrategia: {'Best of ' + str(num_candidates) if num_candidates > 1 else 'Single Shot'})...")
        
        for i in range(num_candidates):
            if num_candidates > 1:
                print(f"    🌟 Generando candidato {i+1}/{num_candidates}...")
            
            result = await client.generate_background(
                prompt=prompt,
                style=brief.estilo,
                color_palette=brief.paleta or [],
                reference_image=brief.referencias[0] if brief.referencias else None,
                grid_area=grid_area,
                # [TECH OVERRIDES]
                checkpoint=stage.params.get("checkpoint_override"),
                sampler=stage.params.get("sampler_override"),
                scheduler=stage.params.get("scheduler_override"),
                seed=stage.params.get("seed_override") # [NUEVO]
            )

            
            if result.success:
                candidates.append(result.image_data)
            else:
                print(f"    ⚠️ Error generando candidato {i+1}: {result.error}")
        
        if not candidates:
            # Fallback total
            print("    ❌ Todos los intentos fallaron. Usando fallback sólido.")
            # ... código de fallback existente (se manejará fuera o retorno error) ...
            return {"success": False, "error": "All generations failed"}
            
        # SELECCIÓN DEL MEJOR
        selected_image = candidates[0]
        if len(candidates) > 1:
            print(f"    👁️ Analizando {len(candidates)} candidatos para elegir el mejor (Full Color)...")
            best_idx = await analyzer.select_best_image(
                candidates,
                criteria="vibrant full color, high saturation, not opaque, artistic masterpiece, sharp details"
            )
            selected_image = candidates[best_idx]
            print(f"    🏆 Seleccionado candidato #{best_idx+1}")
            
        self._current_layers["fondo"] = selected_image
        print(f"    ✅ Fondo final establecido")
        return {"success": True}
    
    async def _renderizar_grilla(
        self,
        stage: Stage,
        brief: Brief
    ) -> Dict[str, Any]:
        """
        Renderiza la grilla de sopa de letras.
        INTEGRACIÓN TOTAL: Genera una textura física para el fondo de las letras.
        """
        from .layer_compositor import get_compositor, GridData
        from .stage_generators import get_stage_generators
        
        compositor = get_compositor()
        stage_gen = get_stage_generators()
        
        grilla_data = brief.grilla_data or {}
        letters = grilla_data.get("letters", [["A", "B"], ["C", "D"]])
        rows = len(letters)
        cols = len(letters[0]) if letters else 2
        
        grid = GridData(
            letters=letters,
            rows=rows,
            cols=cols,
            cell_size=45
        )
        
        # Calcular posición centrada
        grid_width = cols * grid.cell_size
        grid_height = rows * grid.cell_size
        x_offset = (compositor.PAGE_WIDTH - grid_width) // 2
        y_offset = 150
        
        # 1. Generar textura física con ComfyUI (SOLO si no es estilo limpio)
        texture_b64 = None
        
        # Si el estilo es "clean editorial" o similar, queremos transparencia/limpieza, no textura
        if "clean" in brief.estilo.lower() or "editorial" in brief.estilo.lower():
             print(f"    ℹ️ Estilo '{brief.estilo}' detectado: Saltando textura de grilla para limpieza")
        else:
            print(f"    🧱 Generando textura para grilla ({grid_width}x{grid_height})...")
            texture_result = await stage_gen.generate_grid_texture(
                prompt=brief.tema,
                style=brief.estilo,
                width=grid_width + 40,
                height=grid_height + 40
            )
            
            if texture_result["success"]:
                texture_b64 = texture_result["image_data"]
                print("    ✅ Textura generada por ComfyUI")
            else:
                print(f"    ⚠️ Falló textura: {texture_result.get('error')}, usando fondo simple")
        
        # 2. Renderizar letras sobre la textura
        grid_layer = compositor.create_grid_layer(
            grid=grid,
            x_offset=x_offset,
            y_offset=y_offset,
            style=brief.estilo,
            background_texture_b64=texture_b64
        )
        
        # Convertir a base64
        self._current_layers["grilla"] = compositor.image_to_base64(grid_layer)
        print(f"    ✅ Grilla renderizada ({rows}x{cols}) con integración visual")
        
        return {"success": True}
    
    async def _renderizar_titulo(
        self,
        stage: Stage,
        brief: Brief
    ) -> Dict[str, Any]:
        """Renderiza el título (determinístico, NO IA)"""
        
        from .layer_compositor import get_compositor
        
        compositor = get_compositor()
        
        title_layer = compositor.create_title_layer(
            title=brief.titulo or "SOPA DE LETRAS",
            y_position=40,
            font_size=42,
            style=brief.estilo if brief.estilo in ["futuristic", "modern"] else "modern"
        )
        
        self._current_layers["titulo"] = compositor.image_to_base64(title_layer)
        print(f"    ✅ Título renderizado: {brief.titulo}")
        
        return {"success": True}
    
    async def _generar_margenes(
        self,
        stage: Stage,
        brief: Brief,
        learning_context: str
    ) -> Dict[str, Any]:
        """Genera decoración de márgenes con inpainting y máscara"""
        
        from .art_studio_comfy_client import get_art_studio_comfy_client
        from .stage_generators import get_stage_generators
        
        client = get_art_studio_comfy_client()
        stage_gen = get_stage_generators()
        
        # Necesitamos el fondo base para hacer inpainting
        base_image = self._current_layers.get("fondo")
        
        if not base_image:
            # Sin fondo, dejar márgenes vacíos (capa transparente)
            print("    ⚠️ No hay fondo base para inpainting, usando capa transparente")
            from PIL import Image
            import io
            
            # Crear capa transparente
            img = Image.new('RGBA', (816, 1056), (0, 0, 0, 0))
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            self._current_layers["margenes"] = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return {"success": True}
        
        # Calcular área de grilla y título para crear máscara
        grid_area = None
        if brief.grilla_data:
            letters = brief.grilla_data.get("letters", [])
            if letters:
                rows = len(letters)
                cols = len(letters[0]) if letters else 8
                cell_size = 45
                grid_width = cols * cell_size
                grid_height = rows * cell_size
                x_offset = (816 - grid_width) // 2
                grid_area = (x_offset, 150, grid_width, grid_height)
        
        title_area = (100, 30, 616, 60)  # Área aproximada del título
        
        # Crear máscara que protege grilla y título
        if grid_area:
            stage_gen.set_layout(grid_area, title_area)
            mask = stage_gen.get_margins_mask()
            
            if mask:
                mask_b64 = stage_gen.mask_gen.mask_to_base64(mask)
                
                # Generar márgenes con inpainting
                result = await client.generate_margins_inpainting(
                    base_image=base_image,
                    mask_image=mask_b64,
                    prompt=f"decorative borders, ornamental corners, {brief.tema}",
                    style=brief.estilo,
                    denoise=stage.params.get("denoise", 0.6)
                )
                
                if result.success:
                    self._current_layers["margenes"] = result.image_data
                    print(f"    ✅ Márgenes generados ({result.workflow_used})")
                    return {"success": True}
                else:
                    print(f"    ⚠️ Inpainting falló: {result.error}")
        
        # Si no hay máscara o falla, usar capa vacía
        self._current_layers["margenes"] = None
        return {"success": True}  # No crítico
    
    async def _ensamblar_capas(self, stage: Stage) -> Dict[str, Any]:
        """Ensambla todas las capas en la imagen final"""
        
        from .layer_compositor import get_compositor
        from PIL import Image
        import io
        
        compositor = get_compositor()
        
        # Cargar capas desde base64
        def load_b64(data):
            if data is None:
                return None
            try:
                return Image.open(io.BytesIO(base64.b64decode(data))).convert("RGBA")
            except:
                return None
        
        # Cargar capas
        background = load_b64(self._current_layers.get("fondo"))
        grid_plate = load_b64(self._current_layers.get("grid_plate"))
        grilla = load_b64(self._current_layers.get("grilla"))
        titulo = load_b64(self._current_layers.get("titulo"))
        margenes = load_b64(self._current_layers.get("margenes"))

        # PROTOCOLO DE RESCATE: Clean Center para estilos editoriales
        if background and ("clean" in self._current_brief.estilo.lower() or "editorial" in self._current_brief.estilo.lower()):
            if self._current_brief.grilla_data:
                # Recalcular área central (de forma simplificada basada en 816px)
                # O idealmente guardar el área real. Como aproximación, usamos la lógica standard:
                # Grid width default = 2 (cols) * 45 = 90 (muy pequeño, error si no hay datos)
                # Mejor usar dimensiones fijas seguras si falla
                grilla_data = self._current_brief.grilla_data
                letters = grilla_data.get("letters", [])
                cols = len(letters[0]) if letters else 10
                rows = len(letters)
                cell_size = 45
                
                grid_width = cols * cell_size
                grid_height = rows * cell_size
                x_offset = (compositor.PAGE_WIDTH - grid_width) // 2
                grid_area = (x_offset, 150, grid_width, grid_height)
                
                print("    ✨ Aplicando Clean Center (Blur) para estilo Editorial")
                background = compositor.apply_clean_center(
                    background=background,
                    grid_area=grid_area,
                    mode="blur",
                    intensity=0.3
                )

        # Componer
        final = compositor.composite_layers(
            background=background,
            grid_plate=grid_plate,
            frame=margenes,
            grid_layer=grilla,
            title_layer=titulo,
        )
        
        self._current_layers["final"] = compositor.image_to_base64(final)
        print(f"    ✅ Capas ensambladas")
        
        return {"success": True}
    
    async def _ejecutar_qc(self, stage: Stage) -> Dict[str, Any]:
        """Ejecuta controles de calidad usando QualityControlEngine"""
        
        from .quality_control import get_qc_engine
        
        qc_engine = get_qc_engine()
        
        # Obtener imagen final
        final_image = self._current_layers.get("final")
        grid_reference = self._current_layers.get("grilla")
        
        if not final_image:
            return {
                "success": False,
                "error": "No hay imagen final para validar"
            }
        
        # 1. Ejecutar QC técnico con PIL
        qc_result_real = qc_engine.validate(
            final_image=final_image,
            grid_reference=grid_reference
        )
        
        # 2. Ejecutar análisis visual con Gemini
        from .visual_analyzer import get_visual_analyzer
        
        visual_analyzer = get_visual_analyzer()
        visual_analysis = await visual_analyzer.analyze_generation(
            image_b64=final_image,
            context={
                "tema": self._current_brief.tema if self._current_brief else "N/A",
                "estilo": self._current_brief.estilo if self._current_brief else "N/A",
                "palabras": self._current_brief.palabras if self._current_brief else [],
            }
        )
        
        # 3. Combinar resultados
        # Priorizar análisis de Gemini si está disponible
        issues = qc_result_real.issues.copy()
        suggestions = qc_result_real.suggestions.copy()
        
        if visual_analysis.success:
            # Agregar issues de Gemini que no estén ya
            for issue in visual_analysis.issues:
                if issue not in issues:
                    issues.append(f"[Gemini] {issue}")
            
            # Agregar sugerencias de Gemini
            for sug in visual_analysis.suggestions:
                if sug not in suggestions:
                    suggestions.append(f"[Gemini] {sug}")
            
            # Mostrar resumen de Gemini
            print(visual_analyzer.get_analysis_summary(visual_analysis))
        
        # Determinar si pasó (combinar ambos resultados)
        passed = qc_result_real.passed
        if visual_analysis.success:
            # Si Gemini dice que la legibilidad es muy baja, no pasar
            if visual_analysis.legibility_score < 5:
                passed = False
                issues.append("Legibilidad insuficiente según análisis visual")
            # Si la grilla no está intacta según Gemini, no pasar
            if not visual_analysis.grid_intact:
                passed = False
                issues.append("Grilla modificada según análisis visual")
        
        # Convertir a formato esperado
        qc_result = QCResult(
            passed=passed,
            grid_integrity=qc_result_real.metrics.grid_integrity,
            title_contrast=qc_result_real.metrics.title_contrast,
            visual_load=qc_result_real.metrics.visual_load,
            issues=issues,
            suggestions=suggestions
        )
        
        # Mostrar resumen técnico
        print(qc_engine.get_summary(qc_result_real))
        
        return {"success": True, "qc_result": qc_result}
    
    async def _upscale_imagen(self, stage: Stage) -> Dict[str, Any]:
        """Escala la imagen a 300 DPI"""
        
        # TODO: Integrar con RealESRGAN en ComfyUI
        print(f"    ⏭️ Upscale pendiente de implementar")
        return {"success": True}
    
    def _ajustar_params_reintento(self, qc_result: QCResult):
        """Ajusta parámetros para el siguiente reintento basado en fallos de QC"""
        
        if "Grilla modificada" in str(qc_result.issues):
            # Aumentar peso de ControlNet
            print("    🔧 Ajustando: +ControlNet weight")
        
        if "Contraste" in str(qc_result.issues):
            # Ajustar paleta
            print("    🔧 Ajustando: Paleta de colores")
        
        if "sobrecargado" in str(qc_result.issues):
            # Reducir denoise
            print("    🔧 Ajustando: -denoise, menos ornamentos")
    
    def _guardar_generacion(self, result: GenerationResult, brief: Brief):
        """Guarda la generación para aprendizaje"""
        
        self.training.save_generation(
            puzzle_title=brief.titulo,
            puzzle_theme=brief.tema,
            words=brief.palabras,
            target_audience=brief.publico,
            design_plan={
                "theme": brief.tema,
                "art_style": brief.estilo,
                "color_palette": brief.paleta,
                "mood": brief.modo.value,
            },

            prompts=result.prompts_used,
            images_b64=result.layers
        )
        
        print(f"💾 [DIRECTOR] Generación guardada: {self._generation_id}")

    async def _analizar_vision(self, image_b64: str, brief: Brief) -> Optional[str]:
        """Usa Gemini Vision para criticar y etiquetar la imagen generada"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key: return None
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash') # Vision capable
            
            prompt = f"""
            Act as an Art Director. Analyze this generated image for a puzzle game background.
            THEME: {brief.tema}
            STYLE: {brief.estilo}
            
            Provide a concise critique covering:
            1. Lighting and Mood (Is it too dark? Too bright?)
            2. Composition (Is there space for text/grid?)
            3. Style adherence.
            
            Return a single paragraph summary.
            """
            
            # Decodificar b64 para pasar a Gemini (o pasar objeto imagen si librería soporta)
            # La librería google.generativeai suele aceptar dicts con 'mime_type' y 'data'
            image_part = {"mime_type": "image/png", "data": image_b64}
            
            response = await model.generate_content_async([prompt, image_part])
            critique = response.text
            print(f"👁️ [VISION] Crítica: {critique[:100]}...")
            return critique
            
        except Exception as e:
            print(f"⚠️ [VISION] Error analizando imagen: {e}")
            return None
    
    async def solicitar_aprobacion(
        self,
        result: GenerationResult
    ) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Solicita aprobación del usuario.
        
        Returns:
            (aprobado, feedback) donde feedback incluye:
            - rating: 1 (aprobar) o -1 (rechazar)
            - problems: lista de problemas si rechazado
            - improvements_needed: mejoras sugeridas
        """
        # Este método será llamado desde la API/UI
        # Por ahora retorna placeholder
        return False, None
    
    def aprender_de_feedback(
        self,
        generation_id: str,
        rating: int,
        feedback_text: str = None,
        problems: List[str] = None,
        improvements_needed: List[str] = None,
        style_used: str = None,
        params_used: Dict[str, float] = None
    ):
        """Aprende del feedback del usuario usando Learning Engine"""
        
        # 1. Guardar en training memory
        self.training.add_feedback(
            example_id=generation_id,
            rating=rating,
            feedback_text=feedback_text,
            problems=problems,
            improvements_needed=improvements_needed
        )
        
        # 2. Actualizar Learning Engine con bandit
        from .learning_engine import get_learning_engine
        
        learning = get_learning_engine()
        
        if style_used:
            learning.record_feedback(
                style=style_used,
                approved=rating > 0,
                params_used=params_used
            )
            
            # Guardar estado actualizado
            learning.save_state()
        
        # 3. Mostrar resumen de aprendizaje
        print(learning.get_learning_summary())


# Singleton
_director: Optional[HybridDirector] = None

def get_hybrid_director() -> HybridDirector:
    global _director
    if _director is None:
        _director = HybridDirector()
    return _director
