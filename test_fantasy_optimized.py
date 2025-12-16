"""
Prueba: Fantasía Optimizada (DreamShaper Boosted)
"""
import requests
import json
import base64

API_URL = "http://localhost:8000/api/art-studio"

request_data = {
    "tema": "magical enchanted forest, bioluminescent plants, glowing ancient runes on trees, fairy dust, etheral atmosphere, purple and blue nebula sky",
    "publico": "todos",
    "estilo": "fantasy digital art", # Esto activará DreamShaper + Boost
    "titulo": "BOSQUE ENCANTADO",
    "palabras": [
        "MAGIA", "HADA", "POLVO", "LUZ", "BOSQUE",
        "RUNA", "ETÉREO", "SUEÑO", "BRILLO", "VIDA"
    ],
    "modo": "explorar",
    "grilla_letters": [
        ["M","A","G","I","A","X","A","R","B","O"],
        ["L","N","I","E","B","L","A","L","U","Z"],
        ["B","O","S","Q","U","E","A","L","B","A"],
        ["E","N","C","A","N","T","O","C","A","L"],
        ["M","A","P","A","Z","V","I","D","A","X"],
    ],
    "paleta": [
        "#2a0a4d",  # Morado oscuro
        "#4b0082",  # Indigo
        "#00ced1",  # Turquesa brillante
        "#ff00ff",  # Magenta neón
        "#ffffff"   # Luz pura
    ]
}

print("✨ Generando: FANTASÍA OPTIMIZADA (DreamShaper Boosted)")
print(f"   Tema: {request_data['tema']}")
print(f"   Estilo: {request_data['estilo']}")
print()

try:
    print("📡 Enviando request al Director Híbrido...")
    # Usamos timeout largo
    resp = requests.post(f"{API_URL}/director/generate", json=request_data, timeout=300)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n✅ Success: {data.get('success')}")
        
        if data.get('final_image'):
            print("\n🖼️ Guardando imagen final...")
            img_data = base64.b64decode(data['final_image'])
            output_path = "bosque_fantasy_output.png"
            with open(output_path, "wb") as f:
                f.write(img_data)
            print(f"   ✅ Saved to: {output_path}")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
