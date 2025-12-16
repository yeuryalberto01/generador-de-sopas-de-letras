"""
Prueba: Bosque Mitológico Griego - Atmósfera Épica
"""
import requests
import json
import base64

API_URL = "http://localhost:8000/api/art-studio"

# Prompt ultra-específico para Greek Mythology
# Usamos elementos concretos: columnas corintias, templos, olivos, estatuas
request_data = {
    "tema": "ancient greek mythology forest, ruins of temple of artemis, overgrown ionic columns, sacred olive trees, statue of goddess, ethereal mist, mount olympus atmosphere, golden hour lighting, magical sanctuary",
    "publico": "todos",
    "estilo": "classical oil painting",  # Estilo clásico para dar peso histórico
    "titulo": "MITOLOGÍA GRIEGA",
    "palabras": [
        "ZEUS", "HERA", "ATENEA", "APOLO", "ARES",
        "OLIMPO", "TEMPLO", "HÉROE", "MITO", "DIOS"
    ],
    "modo": "explorar",
    "grilla_letters": [
        ["Z","E","U","S","H","E","R","A","M","I"],
        ["A","T","E","N","E","A","P","O","L","O"],
        ["A","R","E","S","O","L","I","M","P","O"],
        ["T","E","M","P","L","O","H","E","R","O"],
        ["E","M","I","T","O","D","I","O","S","X"],
        ["X","X","X","X","X","X","X","X","X","X"],
    ],
    "paleta": [
        "#f0e6d2",  # Marmol antiguo
        "#c0a080",  # Piedra caliza
        "#556b2f",  # Verde oliva
        "#b8860b",  # Oro divino
        "#87ceeb"   # Cielo etéreo
    ]
}

print("🏛️ Generando: MITOLOGÍA GRIEGA (True Fantasy)")
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
                
            if qc.get('suggestions'):
                print(f"   💡 Suggestions: {qc['suggestions'][:3]}")
        
        if data.get('final_image'):
            print("\n🖼️ Guardando imagen final...")
            img_data = base64.b64decode(data['final_image'])
            output_path = "bosque_mitologia_output.png"
            with open(output_path, "wb") as f:
                f.write(img_data)
            print(f"   ✅ Saved to: {output_path}")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
