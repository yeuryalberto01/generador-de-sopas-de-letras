import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from modules.art_studio.hybrid_director import HybridDirector
from modules.art_studio.intent_planner import Brief, GenerationMode

async def test_modular_grid():
    print("🧪 Iniciando prueba de Grilla Modular (Fondo + Placa)...")
    
    director = HybridDirector()
    
    # Brief para activar todo el pipeline
    brief = Brief(
        tema="ancient ruins, jungle temple, mystical atmosphere, stone structures, vines",
        publico="adults",
        estilo="fantasy digital art",
        modo=GenerationMode.PRODUCIR,
        titulo="TEMPLO PERDIDO",
        palabras=["RUINA", "TEMPLO", "JUNGLA", "PIEDRA"],
        grilla_data={"letters": [["A"]*10]*10} # Dummy grid
    )
    
    # Ejecutar generación
    # Auto-retry desactivado por preferencias globales si aplica
    result = await director.generar(brief)
    
    if result.success:
        print("✅ Generación exitosa!")
        print(f"📂 Capas generadas: {list(result.layers.keys())}")
        
        if "grid_plate" in result.layers:
            print("    ✅ Capa 'grid_plate' (Placa) existe!")
        else:
            print("    ❌ FALTA capa 'grid_plate'")
            
        if "fondo" in result.layers:
            print("    ✅ Capa 'fondo' existe!")
            
        print(f"🖼️ Imagen final guardada en memoria (len={len(result.final_image) if result.final_image else 0})")
        
        # Guardar imagen final para inspección visual
        if result.final_image:
            import base64
            from PIL import Image
            import io
            img_data = base64.b64decode(result.final_image)
            img = Image.open(io.BytesIO(img_data))
            img.save("test_modular_result.png")
            print("    💾 Guardado: test_modular_result.png")
            
    else:
        print(f"❌ Error en generación: {result.errors}")

if __name__ == "__main__":
    asyncio.run(test_modular_grid())
