"""
Layer Compositor - Ensambla todas las capas en una imagen final

Combina:
1. Background (fondo)
2. Frame (marco decorativo)
3. Grid (grilla de letras renderizada)
4. Illustrations (elementos decorativos)
5. Title (título estilizado)
6. WordList (lista de palabras)

Respeta la legibilidad del texto usando máscaras y transparencias.
"""

import base64
import io
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import asyncio


@dataclass
class GridData:
    """Datos de la grilla de letras"""
    letters: List[List[str]]  # Matriz de letras
    rows: int
    cols: int
    cell_size: int = 40


@dataclass
class PuzzleContent:
    """Contenido del puzzle para renderizar"""
    title: str
    grid: GridData
    words: List[str]
    subtitle: Optional[str] = None
    footer: Optional[str] = None


class LayerCompositor:
    """Compositor de capas para crear la imagen final"""
    
    # Dimensiones estándar para hoja carta
    PAGE_WIDTH = 816   # 8.5" x 96 DPI
    PAGE_HEIGHT = 1056  # 11" x 96 DPI
    
    # Márgenes
    MARGIN_TOP = 80
    MARGIN_BOTTOM = 100
    MARGIN_LEFT = 60
    MARGIN_RIGHT = 60
    
    def __init__(self):
        self._default_font = None
        self._title_font = None
        
    def apply_clean_center(
        self,
        background: Image.Image,
        grid_area: Tuple[int, int, int, int],
        mode: str = "blur",  # 'blur' o 'multiply'
        intensity: float = 0.3
    ) -> Image.Image:
        """
        Aplica limpieza visual detrás de la grilla para mejorar legibilidad.
        Protocolo Salvamento Rápido: Blur gaussiano o Multiplicar suave.
        """
        result = background.copy()
        
        # Crear máscara para el área central con borde suave
        mask = Image.new("L", background.size, 0)
        draw = ImageDraw.Draw(mask)
        
        x, y, w, h = grid_area
        padding = 40  # Padding generoso
        
        # Área blanca central
        draw.rectangle(
            [x - padding, y - padding, x + w + padding, y + h + padding],
            fill=255
        )
        
        # Suavizar bordes de la máscara (Gaussian Blur fuerte)
        mask = mask.filter(ImageFilter.GaussianBlur(15))
        
        if mode == "blur":
            # Aplicar desenfoque al fondo
            blurred = result.filter(ImageFilter.GaussianBlur(radius=10))
            # Componer: Fondo original + (Fondo borroso enmascarado)
            result.paste(blurred, mask=mask)
            
        elif mode == "multiply":
            # Aplicar capa oscura/multiply
            overlay = Image.new("RGBA", background.size, (255, 255, 255, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            
            # Rectángulo blanco con alpha
            alpha = int(255 * intensity)
            overlay_draw.rectangle(
                [0, 0, background.width, background.height],
                fill=(240, 240, 240, alpha) 
            )
            
            # Usamos alpha composite con la máscara
            overlay_masked = Image.new("RGBA", background.size, (0,0,0,0))
            overlay_masked.paste(overlay, mask=mask)
            
            result = Image.alpha_composite(result.convert("RGBA"), overlay_masked)
        
        print(f"    ✨ Clean Center aplicado: {mode}")
        return result

    def _get_font(self, size: int = 24, bold: bool = False) -> ImageFont.FreeTypeFont:
        """Obtiene una fuente del sistema"""
        try:
            # Intentar cargar fuentes del sistema
            font_paths = [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
                "arial.ttf",
            ]
            for path in font_paths:
                try:
                    return ImageFont.truetype(path, size)
                except:
                    continue
        except:
            pass
        return ImageFont.load_default()
    
    def load_layer_from_base64(self, b64_data: str) -> Image.Image:
        """Carga una capa desde datos base64"""
        img_data = base64.b64decode(b64_data)
        return Image.open(io.BytesIO(img_data)).convert("RGBA")
    
    def load_layer_from_file(self, path: str) -> Image.Image:
        """Carga una capa desde archivo"""
        return Image.open(path).convert("RGBA")
    
    def resize_layer(self, layer: Image.Image, width: int = None, height: int = None) -> Image.Image:
        """Redimensiona una capa manteniendo aspecto"""
        if width is None:
            width = self.PAGE_WIDTH
        if height is None:
            height = self.PAGE_HEIGHT
        return layer.resize((width, height), Image.Resampling.LANCZOS)
    
    def create_grid_layer(
        self,
        grid: GridData,
        x_offset: int,
        y_offset: int,
        cell_size: int = 40,
        font_size: int = 28,
        text_color: Tuple[int, int, int] = (30, 30, 30),
        bg_color: Tuple[int, int, int, int] = (255, 255, 255, 230),
        border_color: Tuple[int, int, int] = (100, 100, 100),
        style: str = "modern",
        background_texture_b64: str = None  # Nuevo parámetro para textura física
    ) -> Image.Image:
        """Crea la capa de la grilla de letras con estilo y textura opcional"""
        
        grid_width = grid.cols * cell_size
        grid_height = grid.rows * cell_size
        
        # Crear imagen del tamaño de la página
        layer = Image.new("RGBA", (self.PAGE_WIDTH, self.PAGE_HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        
        # Padding
        padding = 15
        grid_rect = [
            x_offset - padding,
            y_offset - padding,
            x_offset + grid_width + padding,
            y_offset + grid_height + padding
        ]
        
        # INTEGRACIÓN VISUAL: Usar textura o fallback a color sólido
        if background_texture_b64:
            try:
                # Decodificar y cargar textura
                texture_img = self.base64_to_image(background_texture_b64)
                
                # Redimensionar al tamaño del contenedor + borde
                w = grid_rect[2] - grid_rect[0]
                h = grid_rect[3] - grid_rect[1]
                texture_img = texture_img.resize((w, h), Image.Resampling.LANCZOS)
                
                # Crear máscara redondeada para la textura
                mask = Image.new("L", (w, h), 0)
                mask_draw = ImageDraw.Draw(mask)
                mask_draw.rounded_rectangle([0, 0, w, h], radius=15, fill=255)
                
                # Pegar textura con máscara
                layer.paste(texture_img, (grid_rect[0], grid_rect[1]), mask)
                
                # Dibujar borde para definición
                draw.rounded_rectangle(grid_rect, radius=15, outline=border_color, width=2)
                
            except Exception as e:
                print(f"⚠️ Error aplicando textura de grilla: {e}")
                # Fallback a estilo normal
                draw.rounded_rectangle(grid_rect, radius=15, fill=bg_color, outline=border_color, width=2)
        else:
            # Estilos standard sin textura
            if style == "modern":
                draw.rounded_rectangle(grid_rect, radius=15, fill=bg_color, outline=border_color, width=2)
            elif style == "futuristic":
                draw.rectangle(grid_rect, fill=(20, 20, 40, 220))
                draw.rectangle(grid_rect, outline=(0, 255, 255), width=3)
            else:
                draw.rectangle(grid_rect, fill=bg_color, outline=border_color, width=1)
        
        # Dibujar las letras
        font = self._get_font(font_size, bold=True)
        
        for row_idx, row in enumerate(grid.letters):
            for col_idx, letter in enumerate(row):
                x = x_offset + col_idx * cell_size + cell_size // 2
                y = y_offset + row_idx * cell_size + cell_size // 2
                
                # Centrar la letra
                bbox = draw.textbbox((0, 0), letter, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                # Color del texto según estilo
                if style == "futuristic":
                    draw.text(
                        (x - text_width // 2, y - text_height // 2),
                        letter,
                        fill=(0, 255, 255),  # Cyan neón
                        font=font
                    )
                else:
                    draw.text(
                        (x - text_width // 2, y - text_height // 2),
                        letter,
                        fill=text_color,
                        font=font
                    )
        
        return layer
    
    def create_title_layer(
        self,
        title: str,
        y_position: int = 30,
        font_size: int = 48,
        color: Tuple[int, int, int] = (30, 30, 30),
        style: str = "modern"
    ) -> Image.Image:
        """Crea la capa del título"""
        
        layer = Image.new("RGBA", (self.PAGE_WIDTH, self.PAGE_HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        
        font = self._get_font(font_size, bold=True)
        
        # Medir texto
        bbox = draw.textbbox((0, 0), title, font=font)
        text_width = bbox[2] - bbox[0]
        x = (self.PAGE_WIDTH - text_width) // 2
        
        if style == "futuristic":
            # Efecto neón: sombra brillante
            for offset in range(3, 0, -1):
                shadow_color = (0, 200, 255, 100)
                draw.text((x - offset, y_position), title, fill=shadow_color, font=font)
                draw.text((x + offset, y_position), title, fill=shadow_color, font=font)
            draw.text((x, y_position), title, fill=(0, 255, 255), font=font)
        else:
            # Sombra suave
            draw.text((x + 2, y_position + 2), title, fill=(100, 100, 100, 128), font=font)
            draw.text((x, y_position), title, fill=color, font=font)
        
        return layer
    
    def create_wordlist_layer(
        self,
        words: List[str],
        x_offset: int,
        y_offset: int,
        font_size: int = 16,
        columns: int = 3,
        style: str = "modern"
    ) -> Image.Image:
        """Crea la capa de la lista de palabras CON FONDO LEGIBLE"""
        
        layer = Image.new("RGBA", (self.PAGE_WIDTH, self.PAGE_HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        
        font = self._get_font(font_size)
        bold_font = self._get_font(font_size + 2, bold=True)
        
        # Calcular dimensiones de la caja
        rows_needed = (len(words) + columns - 1) // columns
        box_height = 50 + rows_needed * (font_size + 10)
        box_width = self.PAGE_WIDTH - 2 * x_offset + 40
        
        # FONDO SEMI-TRANSPARENTE PARA LEGIBILIDAD
        padding = 20
        box_rect = [
            x_offset - padding,
            y_offset - padding,
            x_offset + box_width,
            y_offset + box_height
        ]
        
        if style == "futuristic":
            # Fondo oscuro con borde neón
            draw.rounded_rectangle(box_rect, radius=15, fill=(20, 20, 40, 240))
            draw.rounded_rectangle(box_rect, radius=15, outline=(0, 255, 255), width=2)
            header_color = (0, 255, 255)
            text_color = (200, 255, 255)
            checkbox_color = (0, 200, 200)
        else:
            # Fondo claro semi-transparente
            draw.rounded_rectangle(box_rect, radius=10, fill=(255, 255, 255, 230))
            draw.rounded_rectangle(box_rect, radius=10, outline=(100, 100, 100), width=1)
            header_color = (30, 30, 30)
            text_color = (30, 30, 30)
            checkbox_color = (100, 100, 100)
        
        # Título de la sección
        header = "Palabras a encontrar:"
        draw.text((x_offset, y_offset), header, fill=header_color, font=bold_font)
        
        # Distribuir palabras en columnas
        col_width = (box_width - 20) // columns
        y_start = y_offset + 35
        
        for idx, word in enumerate(words):
            col = idx % columns
            row = idx // columns
            x = x_offset + col * col_width
            y = y_start + row * (font_size + 10)
            
            # Checkbox
            draw.rectangle([x, y + 2, x + 14, y + 16], outline=checkbox_color, width=2)
            draw.text((x + 20, y), word.upper(), fill=text_color, font=font)
        
        return layer
    
    def composite_layers(
        self,
        background: Optional[Image.Image] = None,
        frame: Optional[Image.Image] = None,
        grid_plate: Optional[Image.Image] = None,
        grid_layer: Optional[Image.Image] = None,
        title_layer: Optional[Image.Image] = None,
        wordlist_layer: Optional[Image.Image] = None,
        illustrations: Optional[Image.Image] = None,
    ) -> Image.Image:
        """Compone todas las capas en la imagen final"""
        
        # Crear lienzo base blanco
        final = Image.new("RGBA", (self.PAGE_WIDTH, self.PAGE_HEIGHT), (255, 255, 255, 255))
        
        # Orden de composición (de fondo a primer plano):
        # 1. Background
        if background:
            bg = self.resize_layer(background)
            # FULL OPACITY REQUEST: El usuario quiere colores vibrantes "con todo su esplendor"
            final = Image.alpha_composite(final, bg)
            
        # 2. Grid Plate (Placa contenedora de grilla) [NUEVO]
        if grid_plate:
            # Centrar la placa si es más pequeña
            plate_img = grid_plate.convert("RGBA")
            if plate_img.width < self.PAGE_WIDTH:
                 # Centrar
                 x = (self.PAGE_WIDTH - plate_img.width) // 2
                 y = (self.PAGE_HEIGHT - plate_img.height) // 2 + 50 # Un poco hacia abajo para dejar espacio al título
                 
                 # Crear capa temporal del tamaño de página
                 plate_layer = Image.new("RGBA", (self.PAGE_WIDTH, self.PAGE_HEIGHT), (0,0,0,0))
                 plate_layer.paste(plate_img, (x, y), plate_img) # Paste with alpha mask
                 final = Image.alpha_composite(final, plate_layer)
            else:
                 gp = self.resize_layer(grid_plate)
                 final = Image.alpha_composite(final, gp)
        
        # 3. Frame (marco)
        if frame:
            fr = self.resize_layer(frame)
            fr = self._adjust_opacity(fr, 0.8)
            final = Image.alpha_composite(final, fr)
        
        # 4. Illustrations (posicionadas en bordes)
        if illustrations:
            ill = self.resize_layer(illustrations)
            ill = self._adjust_opacity(ill, 0.6)
            final = Image.alpha_composite(final, ill)
        
        # 5. Grid (grilla de letras) - máxima visibilidad
        if grid_layer:
            final = Image.alpha_composite(final, grid_layer)
        
        # 5. Title
        if title_layer:
            final = Image.alpha_composite(final, title_layer)
        
        # 6. Word list
        if wordlist_layer:
            final = Image.alpha_composite(final, wordlist_layer)
        
        return final
    
    def _adjust_opacity(self, img: Image.Image, opacity: float) -> Image.Image:
        """Ajusta la opacidad de una imagen"""
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Crear máscara de opacidad
        alpha = img.split()[3]
        alpha = ImageEnhance.Brightness(alpha).enhance(opacity)
        img.putalpha(alpha)
        return img
    
    def save_image(self, img: Image.Image, path: str, format: str = "PNG"):
        """Guarda la imagen final"""
        if format.upper() == "PNG":
            img.save(path, "PNG")
        else:
            # Convertir a RGB para JPEG
            rgb_img = Image.new("RGB", img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
            rgb_img.save(path, "JPEG", quality=95)
    
    def image_to_base64(self, img: Image.Image) -> str:
        """Convierte imagen a base64"""
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode('utf-8')


def create_demo_puzzle() -> Tuple[PuzzleContent, GridData]:
    """Crea un puzzle de demostración para pruebas"""
    
    # Matriz de letras de ejemplo
    letters = [
        ['I', 'N', 'T', 'E', 'L', 'I', 'G', 'E', 'N', 'C', 'I', 'A'],
        ['A', 'R', 'Q', 'U', 'A', 'N', 'T', 'U', 'M', 'X', 'Y', 'Z'],
        ['R', 'O', 'B', 'O', 'T', 'I', 'C', 'A', 'W', 'V', 'U', 'T'],
        ['T', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
        ['I', 'O', 'N', 'E', 'U', 'R', 'A', 'L', 'P', 'Q', 'R', 'S'],
        ['F', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D'],
        ['I', 'I', 'H', 'O', 'L', 'O', 'G', 'R', 'A', 'F', 'I', 'C'],
        ['C', 'C', 'I', 'B', 'E', 'R', 'N', 'E', 'T', 'I', 'C', 'O'],
        ['I', 'A', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
        ['A', 'M', 'E', 'T', 'A', 'V', 'E', 'R', 'S', 'O', 'W', 'X'],
        ['L', 'Y', 'Z', 'R', 'E', 'A', 'L', 'I', 'D', 'A', 'D', 'V'],
    ]
    
    grid = GridData(
        letters=letters,
        rows=len(letters),
        cols=len(letters[0]),
        cell_size=45
    )
    
    words = ["INTELIGENCIA", "ARTIFICIAL", "ROBOTICA", "QUANTUM", 
             "NEURAL", "HOLOGRAFICO", "CIBERNETICO", "METAVERSO", "REALIDAD"]
    
    content = PuzzleContent(
        title="TECNOLOGÍAS DEL FUTURO",
        grid=grid,
        words=words,
        subtitle="Encuentra todas las palabras",
        footer="Puzzle Generado con IA"
    )
    
    return content, grid


# Singleton
_compositor: Optional[LayerCompositor] = None

def get_compositor() -> LayerCompositor:
    global _compositor
    if _compositor is None:
        _compositor = LayerCompositor()
    return _compositor
