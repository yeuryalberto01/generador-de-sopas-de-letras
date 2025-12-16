"""
Test del Director Híbrido
"""
import requests
import json

API_URL = "http://localhost:8000/api/art-studio"

# Datos de prueba
request_data = {
    "tema": "animales marinos",
    "publico": "niños",
    "estilo": "playful",
    "titulo": "ANIMALES DEL MAR",
    "palabras": ["DELFIN", "TIBURON", "PULPO", "ESTRELLA", "TORTUGA"],
    "modo": "explorar",
    "grilla_letters": [
        ["D","E","L","F","I","N","X","P"],
        ["T","I","B","U","R","O","N","U"],
        ["M","E","D","U","S","A","V","L"],
        ["E","S","T","R","E","L","L","P"],
        ["T","O","R","T","U","G","A","O"]
    ],
    "paleta": ["#00BFFF", "#FF6B6B", "#4ECDC4", "#FFE66D"]
}

print("🎬 Enviando request al Director Híbrido...")
print(f"   Tema: {request_data['tema']}")
print(f"   Estilo: {request_data['estilo']}")
print(f"   Modo: {request_data['modo']}")
print()

try:
    resp = requests.post(f"{API_URL}/director/generate", json=request_data, timeout=120)
    print(f"📡 Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ Success: {data.get('success')}")
        print(f"🆔 Generation ID: {data.get('generation_id')}")
        print(f"📋 Stages completed: {data.get('stages_completed')}")
        
        if data.get('qc_result'):
            qc = data['qc_result']
            print()
            print("📊 QC Result:")
            print(f"   Passed: {qc.get('passed')}")
            print(f"   Grid Integrity: {qc.get('grid_integrity'):.1%}")
            print(f"   Title Contrast: {qc.get('title_contrast'):.1f}:1")
            print(f"   Visual Load: {qc.get('visual_load'):.1%}")
            if qc.get('issues'):
                print(f"   Issues: {qc['issues']}")
        
        if data.get('errors'):
            print(f"⚠️ Errors: {data['errors']}")
        
        if data.get('final_image'):
            print()
            print("🖼️ Final image generated!")
            # Guardar imagen
            import base64
            img_data = base64.b64decode(data['final_image'])
            with open("director_test_output.png", "wb") as f:
                f.write(img_data)
            print("   Saved to: director_test_output.png")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
