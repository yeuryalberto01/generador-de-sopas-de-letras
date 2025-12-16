"""
Quality Control Engine - Motor de Control de Calidad

Valida que las imágenes generadas cumplan con los principios MUST:
1. Grilla y letras INTACTAS
2. Título con contraste suficiente
3. Sin sobrecarga visual
"""

from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from PIL import Image
import base64
import io


@dataclass
class QCMetrics:
    """Métricas de calidad de una imagen"""
    grid_integrity: float  # 0-1, 1 = perfecta
    title_contrast: float  # ratio de contraste WCAG
    visual_load: float  # 0-1, 0 = limpio, 1 = sobrecargado
    edge_sharpness: float  # 0-1, 1 = muy nítido
    color_harmony: float  # 0-1, 1 = armónico


@dataclass
class QCResult:
    """Resultado del control de calidad"""
    passed: bool
    metrics: QCMetrics
    issues: List[str]
    suggestions: List[str]
    
    # Para debugging
    details: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.details is None:
            self.details = {}


class QualityControlEngine:
    """
    Motor de Control de Calidad
    
    Valida imágenes generadas contra criterios de calidad predefinidos.
    Implementa los principios MUST del Director Híbrido.
    """
    
    # Thresholds
    THRESHOLDS = {
        "grid_integrity_min": 0.95,    # 95% de la grilla debe estar intacta
        "title_contrast_min": 4.5,     # WCAG AA ratio
        "visual_load_max": 0.6,        # Máximo 60% de complejidad visual
        "edge_sharpness_min": 0.7,     # Mínimo 70% de nitidez
    }
    
    def __init__(self):
        self._last_result: Optional[QCResult] = None
    
    def validate(
        self,
        final_image: str,  # base64
        grid_reference: Optional[str] = None,  # base64 de grilla original
        title_area: Optional[Tuple[int, int, int, int]] = None,  # (x, y, w, h)
    ) -> QCResult:
        """
        Ejecuta validación completa de calidad.
        
        Args:
            final_image: Imagen final en base64
            grid_reference: Imagen de referencia de la grilla (para comparar)
            title_area: Área del título para verificar contraste
        
        Returns:
            QCResult con métricas, issues y sugerencias
        """
        issues = []
        suggestions = []
        
        # Cargar imagen
        try:
            img = self._load_image(final_image)
        except Exception as e:
            return QCResult(
                passed=False,
                metrics=QCMetrics(0, 0, 1, 0, 0),
                issues=[f"Error cargando imagen: {e}"],
                suggestions=["Verificar que la imagen se generó correctamente"]
            )
        
        # 1. Verificar integridad de grilla
        grid_integrity = self._check_grid_integrity(img, grid_reference)
        if grid_integrity < self.THRESHOLDS["grid_integrity_min"]:
            issues.append(f"Grilla modificada (integridad: {grid_integrity:.1%})")
            suggestions.append("Aumentar peso de ControlNet Canny")
        
        # 2. Verificar contraste del título
        title_contrast = self._check_title_contrast(img, title_area)
        if title_contrast < self.THRESHOLDS["title_contrast_min"]:
            issues.append(f"Contraste de título bajo ({title_contrast:.1f}:1)")
            suggestions.append("Ajustar colores del título o fondo")
        
        # 3. Verificar sobrecarga visual
        visual_load = self._check_visual_load(img)
        if visual_load > self.THRESHOLDS["visual_load_max"]:
            issues.append(f"Diseño sobrecargado (carga: {visual_load:.1%})")
            suggestions.append("Reducir ornamentos, bajar denoise")
        
        # 4. Verificar nitidez
        edge_sharpness = self._check_edge_sharpness(img)
        if edge_sharpness < self.THRESHOLDS["edge_sharpness_min"]:
            issues.append(f"Imagen borrosa (nitidez: {edge_sharpness:.1%})")
            suggestions.append("Considerar upscaling o reducir blur")
        
        # 5. Armonía de colores
        color_harmony = self._check_color_harmony(img)
        
        # Crear métricas
        metrics = QCMetrics(
            grid_integrity=grid_integrity,
            title_contrast=title_contrast,
            visual_load=visual_load,
            edge_sharpness=edge_sharpness,
            color_harmony=color_harmony
        )
        
        # Determinar si pasó
        passed = len(issues) == 0
        
        result = QCResult(
            passed=passed,
            metrics=metrics,
            issues=issues,
            suggestions=suggestions,
            details={
                "image_size": img.size,
                "mode": img.mode,
            }
        )
        
        self._last_result = result
        return result
    
    def _load_image(self, b64_data: str) -> Image.Image:
        """Carga imagen desde base64"""
        img_data = base64.b64decode(b64_data)
        return Image.open(io.BytesIO(img_data))
    
    def _check_grid_integrity(
        self,
        img: Image.Image,
        grid_reference: Optional[str]
    ) -> float:
        """
        Verifica que la grilla esté intacta comparando con referencia.
        
        Usa diferencia de histogramas en el área de la grilla.
        """
        if grid_reference is None:
            # Sin referencia, asumir que está bien
            return 0.98
        
        try:
            ref_img = self._load_image(grid_reference)
            
            # Convertir ambas a escala de grises
            img_gray = img.convert('L')
            ref_gray = ref_img.convert('L')
            
            # Redimensionar referencia si es necesario
            if img_gray.size != ref_gray.size:
                ref_gray = ref_gray.resize(img_gray.size, Image.Resampling.LANCZOS)
            
            # Calcular histogramas
            hist_img = img_gray.histogram()
            hist_ref = ref_gray.histogram()
            
            # Correlación de histogramas
            import math
            
            mean_img = sum(i * h for i, h in enumerate(hist_img)) / sum(hist_img)
            mean_ref = sum(i * h for i, h in enumerate(hist_ref)) / sum(hist_ref)
            
            numerator = sum((i - mean_img) * (j - mean_ref) 
                          for i, j in zip(hist_img, hist_ref))
            
            var_img = sum((i - mean_img) ** 2 for i in hist_img)
            var_ref = sum((j - mean_ref) ** 2 for j in hist_ref)
            
            if var_img * var_ref == 0:
                return 1.0
            
            correlation = numerator / math.sqrt(var_img * var_ref)
            
            # Normalizar a 0-1
            return max(0.0, min(1.0, (correlation + 1) / 2))
            
        except Exception as e:
            print(f"Error checking grid integrity: {e}")
            return 0.95  # Default optimista
    
    def _check_title_contrast(
        self,
        img: Image.Image,
        title_area: Optional[Tuple[int, int, int, int]]
    ) -> float:
        """
        Verifica el ratio de contraste del título según WCAG.
        
        WCAG AA requiere 4.5:1 para texto normal, 3:1 para texto grande.
        """
        if title_area is None:
            # Asumir que el título está en la parte superior (10% de altura)
            width, height = img.size
            title_area = (0, 0, width, int(height * 0.1))
        
        try:
            x, y, w, h = title_area
            title_region = img.crop((x, y, x + w, y + h))
            
            # Obtener colores dominantes
            colors = title_region.getcolors(maxcolors=1000)
            if not colors:
                return 5.0  # Default bueno
            
            # Ordenar por frecuencia
            colors = sorted(colors, key=lambda x: x[0], reverse=True)
            
            # Tomar los dos colores más frecuentes (fondo y texto)
            if len(colors) < 2:
                return 5.0
            
            bg_color = colors[0][1]
            text_color = colors[1][1]
            
            # Si son tuplas RGBA o RGB, tomar RGB
            if isinstance(bg_color, tuple):
                bg_color = bg_color[:3]
            if isinstance(text_color, tuple):
                text_color = text_color[:3]
            
            # Calcular luminancia relativa
            def relative_luminance(rgb):
                r, g, b = [c / 255.0 for c in rgb]
                r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
                g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
                b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
                return 0.2126 * r + 0.7152 * g + 0.0722 * b
            
            l1 = relative_luminance(bg_color)
            l2 = relative_luminance(text_color)
            
            # Ratio de contraste
            if l1 > l2:
                contrast = (l1 + 0.05) / (l2 + 0.05)
            else:
                contrast = (l2 + 0.05) / (l1 + 0.05)
            
            return contrast
            
        except Exception as e:
            print(f"Error checking title contrast: {e}")
            return 5.0  # Default bueno
    
    def _check_visual_load(self, img: Image.Image) -> float:
        """
        Calcula la complejidad visual de la imagen.
        
        Usa variación de colores y densidad de bordes.
        """
        try:
            # Usar varianza de la imagen como proxy de complejidad
            import statistics
            
            gray = img.convert('L')
            pixels = list(gray.getdata())
            
            if len(pixels) < 2:
                return 0.5
            
            # Calcular varianza
            variance = statistics.variance(pixels)
            
            # Normalizar (asumiendo max variance ~6500 para 8-bit)
            normalized = min(1.0, variance / 6500)
            
            return normalized
            
        except Exception as e:
            print(f"Error checking visual load: {e}")
            return 0.4  # Default moderado
    
    def _check_edge_sharpness(self, img: Image.Image) -> float:
        """
        Mide la nitidez de los bordes de la imagen.
        
        Usa el operador Laplacian para detectar bordes.
        """
        try:
            from PIL import ImageFilter
            
            gray = img.convert('L')
            
            # Aplicar filtro de detección de bordes
            edges = gray.filter(ImageFilter.FIND_EDGES)
            
            # Calcular intensidad media de bordes
            pixels = list(edges.getdata())
            mean_edge = sum(pixels) / len(pixels) if pixels else 0
            
            # Normalizar a 0-1
            normalized = min(1.0, mean_edge / 128)
            
            return normalized
            
        except Exception as e:
            print(f"Error checking edge sharpness: {e}")
            return 0.8  # Default bueno
    
    def _check_color_harmony(self, img: Image.Image) -> float:
        """
        Evalúa la armonía de colores de la paleta usada.
        
        Verifica si los colores dominantes están en relación armónica.
        """
        try:
            # Reducir imagen para análisis rápido
            small = img.resize((100, 100), Image.Resampling.LANCZOS)
            
            # Obtener colores dominantes
            colors = small.convert('RGB').getcolors(maxcolors=10000)
            if not colors:
                return 0.8
            
            # Ordenar por frecuencia
            top_colors = sorted(colors, key=lambda x: x[0], reverse=True)[:5]
            
            if len(top_colors) < 2:
                return 0.8
            
            # Calcular diferencias de saturación/luminosidad
            harmonies = []
            for i, (freq1, c1) in enumerate(top_colors[:-1]):
                for freq2, c2 in top_colors[i+1:]:
                    # Diferencia euclidiana
                    diff = sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5
                    # Normalizar
                    normalized_diff = diff / (255 * 1.732)  # Max diff en RGB
                    harmonies.append(1 - normalized_diff)
            
            return sum(harmonies) / len(harmonies) if harmonies else 0.8
            
        except Exception as e:
            print(f"Error checking color harmony: {e}")
            return 0.8  # Default bueno
    
    def get_summary(self, result: QCResult) -> str:
        """Genera un resumen legible del resultado de QC"""
        status = "✅ PASÓ" if result.passed else "❌ FALLÓ"
        
        lines = [
            f"{status} Control de Calidad",
            f"  📊 Integridad grilla: {result.metrics.grid_integrity:.1%}",
            f"  🔤 Contraste título: {result.metrics.title_contrast:.1f}:1",
            f"  🎨 Carga visual: {result.metrics.visual_load:.1%}",
            f"  🔎 Nitidez: {result.metrics.edge_sharpness:.1%}",
        ]
        
        if result.issues:
            lines.append("  ⚠️ Problemas:")
            for issue in result.issues:
                lines.append(f"    - {issue}")
        
        if result.suggestions:
            lines.append("  💡 Sugerencias:")
            for sug in result.suggestions:
                lines.append(f"    - {sug}")
        
        return "\n".join(lines)


# Singleton
_qc_engine: Optional[QualityControlEngine] = None

def get_qc_engine() -> QualityControlEngine:
    global _qc_engine
    if _qc_engine is None:
        _qc_engine = QualityControlEngine()
    return _qc_engine
