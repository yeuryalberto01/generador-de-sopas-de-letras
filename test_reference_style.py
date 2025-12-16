"""
Prueba: Full Opacity + Referencia de Estilo
"""
import requests
import json
import base64
import os

API_URL = "http://localhost:8000/api/art-studio"
REF_IMAGE_PATH = r"C:/Users/yeury/.gemini/antigravity/brain/aec0de0c-b501-41b9-b521-151ba2eddc8a/uploaded_image_1765777933161.jpg"

# Cargar imagen de referencia
ref_b64 = None
if os.path.exists(REF_IMAGE_PATH):
    with open(REF_IMAGE_PATH, "rb") as f:
        ref_b64 = base64.b64encode(f.read()).decode("utf-8")
    print(f"✅ Imagen de referencia cargada: {REF_IMAGE_PATH}")
else:
    print(f"⚠️ No se encontró imagen de referencia en: {REF_IMAGE_PATH}")

request_data = {
    "tema": "floating island with a magical treehouse, glowing waterfalls, bioluminescent pink cherry blossom trees, aurora borealis sky, neon teal and purple palette",
    "publico": "todos",
    "estilo": "fantasy digital art, vibrant masterpiece, same style as reference",
    "titulo": "ISLA MÁGICA",
    "palabras": [], # Sin texto
    "modo": "explorar",
    "grilla_letters": [],
    "referencias": [ref_b64] if ref_b64 else [],
    "paleta": [
        "#ff00ff", # Neon Pink
        "#00ffff", # Cyan
        "#4b0082", # Indigo
        "#ffffff"
    ]
}

print("✨ Generando: FULL OPACITY + STYLE REFERENCE")
print(f"   Tema: {request_data['tema']}")
print()

try:
    print("📡 Enviando request al Director Híbrido...")
    # Timeout largo para generación + análisis visual
    resp = requests.post(f"{API_URL}/director/generate", json=request_data, timeout=600)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n✅ Success: {data.get('success')}")
        
        if data.get('final_image'):
            print("\n🖼️ Guardando imagen final...")
            img_data = base64.b64decode(data['final_image'])
            output_path = "vibrant_reference_output.png"
            with open(output_path, "wb") as f:
                f.write(img_data)
            print(f"   ✅ Saved to: {output_path}")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
