"""
Prueba: Bosque Encantado Profundo - Atmósfera Mágica
"""
import requests
import json
import base64

API_URL = "http://localhost:8000/api/art-studio"

# Datos del puzzle: Enfoque en el entorno mágico, menos personajes
request_data = {
    "tema": "deep charmed forest, ancient twisted trees, bioluminescent plants, magical atmosphere, glowing moss, fireflies everywhere, moonlight filtering through leaves, mystical woods",
    "publico": "todos",
    "estilo": "fantasy art",  # Estilo fantasía
    "titulo": "BOSQUE MÁGICO",
    "palabras": [
        "MAGIA", "ÁRBOL", "MUSGO", "LUZ", "BOSQUE",
        "HADA", "ENCANTO", "NINFA", "HOJAS", "VIDA"
    ],
    "modo": "explorar",
    "grilla_letters": [
        ["M","A","G","I","A","X","A","R","B","O","L"],
        ["U","M","U","S","G","O","L","U","Z","Y","Q"],
        ["S","B","O","S","Q","U","E","H","A","D","A"],
        ["G","E","N","C","A","N","T","O","W","R","T"],
        ["O","N","I","N","F","A","H","O","J","A","S"],
        ["V","I","D","A","L","U","C","I","E","R","N"],
        ["A","G","A","S","M","A","G","I","C","O","S"],
    ],
    "paleta": [
        "#0f2a1d",  # Verde muy oscuro
        "#375525",  # Verde bosque
        "#88d498",  # Verde luz brillante
        "#1a936f",  # Turquesa oscuro
        "#c6dabf"   # Blanco verdoso
    ]
}

print("🌲 Generando: BOSQUE MÁGICO (Deep Atmosphere)")
print(f"   Tema: {request_data['tema']}")
print(f"   Estilo: {request_data['estilo']}")
print()

try:
    print("📡 Enviando request al Director Híbrido...")
    # Usamos timeout largo para dar tiempo a ComfyUI
    resp = requests.post(f"{API_URL}/director/generate", json=request_data, timeout=300)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n✅ Success: {data.get('success')}")
        
        if data.get('qc_result'):
            qc = data['qc_result']
            print(f"\n📊 QC Result:")
            print(f"   Passed: {qc.get('passed')}")
            print(f"   Visual Load: {qc.get('visual_load', 0):.1%}")
            
            if qc.get('issues'):
                print(f"   ⚠️ Issues: {qc['issues'][:3]}")
        
        if data.get('final_image'):
            print("\n🖼️ Guardando imagen final...")
            img_data = base64.b64decode(data['final_image'])
            output_path = "bosque_magico_output.png"
            with open(output_path, "wb") as f:
                f.write(img_data)
            print(f"   ✅ Saved to: {output_path}")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
