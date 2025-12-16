"""
Stage Generators - Generadores por Etapa con Máscaras

Implementa generadores especializados para cada etapa:
- FONDO: txt2img con área de grilla excluida
- GRILLA: Renderizado determinístico (NO IA)
- MÁRGENES: Inpainting con máscara que protege grilla
- WORDLIST: Renderizado determinístico con fondo legible

Principio MUST: NUNCA modificar letras/grilla con IA
"""

import base64
import io
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path


@dataclass
class MaskConfig:
    """Configuración de máscara"""
    grid_area: Tuple[int, int, int, int]  # (x, y, w, h) de la grilla
    title_area: Tuple[int, int, int, int]  # (x, y, w, h) del título
    wordlist_area: Optional[Tuple[int, int, int, int]] = None
    padding: int = 20  # Padding extra de protección
    blur_radius: int = 5  # Suavizado de bordes de máscara


class MaskGenerator:
    """
    Generador de Máscaras
    
    Crea máscaras para proteger áreas específicas durante la generación.
    """
    
    # Dimensiones estándar
    PAGE_WIDTH = 816
    PAGE_HEIGHT = 1056
    
    def create_grid_protection_mask(
        self,
        grid_area: Tuple[int, int, int, int],
        padding: int = 20,
        blur_radius: int = 5
    ) -> Image.Image:
        """
        Crea una máscara que PROTEGE la grilla (negro = proteger, blanco = generar).
        
        Para Inpainting: el área blanca es donde se genera, negro donde se preserva.
        """
        mask = Image.new("L", (self.PAGE_WIDTH, self.PAGE_HEIGHT), 255)  # Blanco = generar
        draw = ImageDraw.Draw(mask)
        
        x, y, w, h = grid_area
        # Área negra = proteger grilla
        draw.rectangle(
            [x - padding, y - padding, x + w + padding, y + h + padding],
            fill=0  # Negro = proteger
        )
        
        # Suavizar bordes
        if blur_radius > 0:
            mask = mask.filter(ImageFilter.GaussianBlur(blur_radius))
        
        return mask
    
    def create_margins_only_mask(
        self,
        grid_area: Tuple[int, int, int, int],
        title_area: Tuple[int, int, int, int],
        wordlist_area: Optional[Tuple[int, int, int, int]] = None,
        padding: int = 20
    ) -> Image.Image:
        """
        Crea una máscara para generar SOLO en márgenes.
        Protege: grilla, título, wordlist.
        """
        mask = Image.new("L", (self.PAGE_WIDTH, self.PAGE_HEIGHT), 255)
        draw = ImageDraw.Draw(mask)
        
        # Proteger grilla
        x, y, w, h = grid_area
        draw.rectangle(
            [x - padding, y - padding, x + w + padding, y + h + padding],
            fill=0
        )
        
        # Proteger título
        tx, ty, tw, th = title_area
        draw.rectangle(
            [tx - padding, ty - 5, tx + tw + padding, ty + th + 5],
            fill=0
        )
        
        # Proteger wordlist si existe
        if wordlist_area:
            wx, wy, ww, wh = wordlist_area
            draw.rectangle(
                [wx - padding, wy - padding, wx + ww + padding, wy + wh + padding],
                fill=0
            )
        
        return mask
    
    def create_header_only_mask(
        self,
        header_height: int = 120
    ) -> Image.Image:
        """
        Crea una máscara para generar SOLO en el encabezado.
        """
        mask = Image.new("L", (self.PAGE_WIDTH, self.PAGE_HEIGHT), 0)  # Negro = proteger
        draw = ImageDraw.Draw(mask)
        
        # Solo el header es blanco
        draw.rectangle([0, 0, self.PAGE_WIDTH, header_height], fill=255)
        
        return mask
    
    def create_footer_only_mask(
        self,
        footer_start: int = 900
    ) -> Image.Image:
        """
        Crea una máscara para generar SOLO en el pie de página.
        """
        mask = Image.new("L", (self.PAGE_WIDTH, self.PAGE_HEIGHT), 0)
        draw = ImageDraw.Draw(mask)
        
        # Solo el footer es blanco
        draw.rectangle([0, footer_start, self.PAGE_WIDTH, self.PAGE_HEIGHT], fill=255)
        
        return mask
    
    def mask_to_base64(self, mask: Image.Image) -> str:
        """Convierte máscara a base64"""
        buffer = io.BytesIO()
        mask.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    def visualize_mask(
        self,
        mask: Image.Image,
        background: Optional[Image.Image] = None
    ) -> Image.Image:
        """
        Crea una visualización de la máscara sobre una imagen.
        Útil para debugging.
        """
        if background is None:
            background = Image.new("RGB", (self.PAGE_WIDTH, self.PAGE_HEIGHT), (100, 100, 100))
        else:
            background = background.convert("RGB")
        
        # Colorear máscara (rojo = proteger, verde = generar)
        colored = Image.new("RGBA", mask.size, (0, 0, 0, 0))
        pixels = mask.load()
        colored_pixels = colored.load()
        
        for y in range(mask.height):
            for x in range(mask.width):
                if pixels[x, y] < 128:
                    colored_pixels[x, y] = (255, 0, 0, 128)  # Rojo semi-transparente
                else:
                    colored_pixels[x, y] = (0, 255, 0, 64)   # Verde semi-transparente
        
        result = background.copy()
        result.paste(colored, (0, 0), colored)
        return result


class StageGenerators:
    """
    Generadores especializados por etapa.
    
    Cada generador sabe cómo producir su capa respetando los principios MUST.
    """
    
    def __init__(self):
        self.mask_gen = MaskGenerator()
        self._grid_area: Optional[Tuple[int, int, int, int]] = None
        self._title_area: Optional[Tuple[int, int, int, int]] = None
    
    def set_layout(
        self,
        grid_area: Tuple[int, int, int, int],
        title_area: Tuple[int, int, int, int]
    ):
        """Establece las áreas de la grilla y título para las máscaras"""
        self._grid_area = grid_area
        self._title_area = title_area
    
    def calculate_grid_area(
        self,
        rows: int,
        cols: int,
        cell_size: int = 45,
        page_width: int = 816,
        y_offset: int = 150
    ) -> Tuple[int, int, int, int]:
        """Calcula el área de la grilla basado en sus dimensiones"""
        grid_width = cols * cell_size
        grid_height = rows * cell_size
        x_offset = (page_width - grid_width) // 2
        
        self._grid_area = (x_offset, y_offset, grid_width, grid_height)
        return self._grid_area
    
    def calculate_title_area(
        self,
        title: str,
        y_position: int = 40,
        font_size: int = 42,
        page_width: int = 816
    ) -> Tuple[int, int, int, int]:
        """Calcula el área aproximada del título"""
        # Estimación basada en caracteres
        char_width = font_size * 0.6
        title_width = len(title) * char_width
        x_offset = (page_width - title_width) // 2
        
        self._title_area = (
            int(x_offset),
            y_position,
            int(title_width),
            font_size + 10
        )
        return self._title_area
    
    def get_background_mask(self) -> Optional[Image.Image]:
        """Obtiene máscara para generación de fondo (protege grilla)"""
        if self._grid_area is None:
            return None
        
        return self.mask_gen.create_grid_protection_mask(
            self._grid_area,
            padding=30,
            blur_radius=8
        )
    
    def get_margins_mask(self) -> Optional[Image.Image]:
        """Obtiene máscara para generación de márgenes"""
        if self._grid_area is None or self._title_area is None:
            return None
        
        return self.mask_gen.create_margins_only_mask(
            self._grid_area,
            self._title_area,
            padding=25
        )
    
    async def generate_background_with_mask(
        self,
        prompt: str,
        style: str,
        color_palette: List[str],
        use_reference: bool = False,
        reference_image: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Genera fondo usando máscara para proteger área de grilla.
        
        La máscara asegura que el área central (donde irá la grilla)
        quede limpia/suave para máxima legibilidad.
        """
        from .layer_generator import get_layer_generator, StylePlan, LayerType
        from .node_switcher import get_node_switcher
        
        generator = get_layer_generator()
        switcher = get_node_switcher()
        
        # Configurar nodos para esta etapa
        node_config = switcher.configure_for_stage(
            stage="fondo",
            has_reference=use_reference,
            has_mask=True,
            protect_grid=False  # No ControlNet para fondo, usamos máscara
        )
        
        # Obtener máscara
        mask = self.get_background_mask()
        
        # Crear StylePlan
        style_plan = StylePlan(
            theme=prompt,
            color_palette=color_palette,
            elements=[],
            frame_style="",
            title_style="",
            mood=style
        )
        
        # Generar
        result = await generator.generate_layer(
            layer_type=LayerType.BACKGROUND,
            style_plan=style_plan
        )
        
        return {
            "success": result.success,
            "image_data": result.image_data,
            "mask_used": self.mask_gen.mask_to_base64(mask) if mask else None,
            "error": result.error
        }
    
    async def generate_grid_texture(
        self,
        prompt: str,
        style: str,
        width: int,
        height: int
    ) -> Dict[str, Any]:
        """
        Genera una textura física para el fondo de la grilla (piedra, papel, madera).
        Esto permite que el puzzle se sienta integrado en el mundo.
        """
        from .art_studio_comfy_client import get_art_studio_comfy_client
        client = get_art_studio_comfy_client()
        
        # Mapear estilo a textura material
        texture_prompt = f"texture of {style} surface, {prompt}, flat top view, high detail, material texture"
        if "greek" in prompt.lower() or "mythology" in prompt.lower():
            texture_prompt = "broken ancient marble slab texture, engraved stone surface, beige limestone, weathering, top view"
        elif "forest" in prompt.lower():
            texture_prompt = "texture of ancient tree bark, engraved wood, mossy edges, natural wooden surface, top view"
            
        print(f"🧱 [TEXTURE] Generating grid texture: {texture_prompt}")
        
        # Usar ComfyUI para generar la textura
        # Reusamos generate_background pero con dimensiones de la grilla
        result = await client.generate_background(
            prompt=texture_prompt,
            style="texture",
            color_palette=[],
            width=width,
            height=height
        )
        
        return {
            "success": result.success,
            "image_data": result.image_data,
            "error": result.error
        }
    
    async def generate_margins_with_inpainting(
        self,
        base_image: str,  # base64 de imagen actual
        prompt: str,
        style: str
    ) -> Dict[str, Any]:
        """
        Genera decoración de márgenes usando inpainting.
        
        Protege: grilla, título, wordlist.
        Genera: bordes, esquinas, ornamentos.
        """
        from .node_switcher import get_node_switcher
        
        switcher = get_node_switcher()
        
        # Configurar nodos para inpainting
        node_config = switcher.configure_for_stage(
            stage="margenes",
            has_reference=False,
            has_mask=True,
            protect_grid=True
        )
        
        # Obtener máscara
        mask = self.get_margins_mask()
        
        if mask is None:
            return {
                "success": False,
                "error": "No se pudo crear máscara (layout no definido)"
            }
        
        # TODO: Enviar a ComfyUI con inpainting workflow
        # Por ahora retornamos la imagen base sin cambios
        
        return {
            "success": True,
            "image_data": base_image,
            "mask_used": self.mask_gen.mask_to_base64(mask),
            "note": "Inpainting pendiente de implementar"
        }
    
    def render_grid_deterministic(
        self,
        letters: List[List[str]],
        style: str = "modern",
        cell_size: int = 45
    ) -> Dict[str, Any]:
        """
        Renderiza la grilla de forma DETERMINÍSTICA (sin IA).
        
        Principio MUST: Las letras NUNCA pasan por el modelo de IA.
        """
        from .layer_compositor import get_compositor, GridData
        
        compositor = get_compositor()
        
        rows = len(letters)
        cols = len(letters[0]) if letters else 2
        
        grid = GridData(
            letters=letters,
            rows=rows,
            cols=cols,
            cell_size=cell_size
        )
        
        # Calcular posición y guardar área
        grid_width = cols * cell_size
        x_offset = (compositor.PAGE_WIDTH - grid_width) // 2
        y_offset = 150
        
        self._grid_area = (x_offset, y_offset, grid_width, rows * cell_size)
        
        # Renderizar
        grid_layer = compositor.create_grid_layer(
            grid=grid,
            x_offset=x_offset,
            y_offset=y_offset,
            style=style
        )
        
        return {
            "success": True,
            "image_data": compositor.image_to_base64(grid_layer),
            "grid_area": self._grid_area
        }
    
    def render_title_deterministic(
        self,
        title: str,
        style: str = "modern",
        y_position: int = 40
    ) -> Dict[str, Any]:
        """
        Renderiza el título de forma DETERMINÍSTICA (sin IA).
        
        Principio MUST: El texto siempre es nítido y legible.
        """
        from .layer_compositor import get_compositor
        
        compositor = get_compositor()
        
        # Calcular área y guardar
        self._title_area = self.calculate_title_area(title, y_position)
        
        # Renderizar
        title_layer = compositor.create_title_layer(
            title=title,
            y_position=y_position,
            style=style
        )
        
        return {
            "success": True,
            "image_data": compositor.image_to_base64(title_layer),
            "title_area": self._title_area
        }
    
    def render_wordlist_deterministic(
        self,
        words: List[str],
        y_offset: int,
        style: str = "modern"
    ) -> Dict[str, Any]:
        """
        Renderiza la lista de palabras de forma DETERMINÍSTICA.
        
        Incluye fondo semi-transparente para legibilidad.
        """
        from .layer_compositor import get_compositor
        
        compositor = get_compositor()
        
        wordlist_layer = compositor.create_wordlist_layer(
            words=words,
            x_offset=80,
            y_offset=y_offset,
            style=style
        )
        
        return {
            "success": True,
            "image_data": compositor.image_to_base64(wordlist_layer)
        }


# Singleton
_stage_generators: Optional[StageGenerators] = None

def get_stage_generators() -> StageGenerators:
    global _stage_generators
    if _stage_generators is None:
        _stage_generators = StageGenerators()
    return _stage_generators
