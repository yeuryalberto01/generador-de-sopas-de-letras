"""
Prueba: Best of 2 + Full Color (No Text)
"""
import requests
import json
import base64

API_URL = "http://localhost:8000/api/art-studio"

request_data = {
    "tema": "underwater kingdom, vibrant coral reef, glowing bioluminescent jellyfish, sunlight rays through water, 8k resolution",
    "publico": "todos",
    "estilo": "fantasy digital art, vibrant color, masterpiece", 
    "titulo": "REINO SUBMARINO",
    "palabras": [], # Sin palabras -> Sin grilla de texto
    "modo": "explorar",
    "grilla_letters": [], # Grilla vacía para "no generar texto aun"
    "paleta": [
        "#00ffff", # Cyan
        "#ff00ff", # Magenta
        "#ffff00", # Yellow
        "#0000ff", # Deep Blue
        "#ffffff"
    ]
}

print("✨ Generando: BEST OF 2 + FULL COLOR (Sin Texto)")
print(f"   Tema: {request_data['tema']}")
print(f"   Estilo: {request_data['estilo']}")
print()

try:
    print("📡 Enviando request al Director Híbrido...")
    # Timeout largo para permitir 2 generaciones + análisis visual
    resp = requests.post(f"{API_URL}/director/generate", json=request_data, timeout=600)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n✅ Success: {data.get('success')}")
        
        if data.get('final_image'):
            print("\n🖼️ Guardando imagen final...")
            img_data = base64.b64decode(data['final_image'])
            output_path = "best_of_2_output.png"
            with open(output_path, "wb") as f:
                f.write(img_data)
            print(f"   ✅ Saved to: {output_path}")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
