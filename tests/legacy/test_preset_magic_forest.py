"""
Prueba: Preset Bosque Mágico - Estilo Editorial Clean
"""
import requests
import json
import base64

API_URL = "http://localhost:8000/api/art-studio"

# PRESET: Bosque Mágico (Usuario)
# Aplicamos exactamente los prompts dados
positive_prompt = "enchanted forest, cathedral-like tall trees, misty volumetric light, dawn haze, clean editorial composition, negative space in the center for layout, subject on sides or lower third, soft background detail, no characters, no animals, no text"

negative_prompt = "people, character, portrait, animal, busy foreground, central subject, high-contrast center, text, logo, label, signage, watermark, harsh vignette, objects, intricate texture in center"

# Configuramos params específicos
request_data = {
    "tema": positive_prompt,
    "publico": "todos",
    "estilo": "clean editorial",
    "titulo": "BOSQUE MÁGICO",
    "palabras": [
        "MAGIA", "ÁRBOL", "NIEBLA", "LUZ", "BOSQUE",
        "ALBA", "ENCANTO", "CALMA", "PAZ", "VIDA"
    ],
    "modo": "explorar", # Usará el modo estándar pero con nuestro prompt
    "grilla_letters": [
        ["M","A","G","I","A","X","A","R","B","O"],
        ["L","N","I","E","B","L","A","L","U","Z"],
        ["B","O","S","Q","U","E","A","L","B","A"],
        ["E","N","C","A","N","T","O","C","A","L"],
        ["M","A","P","A","Z","V","I","D","A","X"],
    ],
    "paleta": [
        "#1a2f23",  # Verde oscuro
        "#4a6741",  # Verde medio
        "#a4c3b2",  # Verde niebla
        "#e9f5db",  # Luz alba
        "#f4f1de"   # Crema
    ],
    # Forzamos parámetros específicos en el request (si el backend lo soporta, o los simulamos aqui)
    "advanced_params": {
        "steps": 30,
        "cfg": 5.5,
        "negative_prompt": negative_prompt
    }
}

print("🌲 Generando: PRESET BOSQUE MÁGICO (Editorial)")
print(f"   Prompt: {positive_prompt[:50]}...")
print(f"   Negative: {negative_prompt[:50]}...")
print()

try:
    print("📡 Enviando request al Director Híbrido...")
    # Usamos timeout largo
    resp = requests.post(f"{API_URL}/director/generate", json=request_data, timeout=300)
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n✅ Success: {data.get('success')}")
        
        if data.get('qc_result'):
            qc = data['qc_result']
            print(f"\n📊 QC Result:")
            print(f"   Passed: {qc.get('passed')}")
            
        if data.get('final_image'):
            print("\n🖼️ Guardando imagen final...")
            img_data = base64.b64decode(data['final_image'])
            output_path = "bosque_editorial_output.png"
            with open(output_path, "wb") as f:
                f.write(img_data)
            print(f"   ✅ Saved to: {output_path}")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
