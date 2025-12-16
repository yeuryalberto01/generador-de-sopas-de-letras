"""
Prueba: Bosque Encantado - Mitología Griega
"""
import requests
import json
import base64

API_URL = "http://localhost:8000/api/art-studio"

# Datos del puzzle: Bosque Encantado con Mitología Griega
request_data = {
    "tema": "bosque encantado mitología griega, ninfas bailando, luciernagas brillantes volando, arboles antiguos magicos",
    "publico": "adolescentes y adultos",
    "estilo": "elegant",  # Estilo elegante para mitología
    "titulo": "BOSQUE DE LAS NINFAS",
    "palabras": [
        "NINFA", "DRÍADE", "NÁYADE", "ARTEMISA", "APOLO",
        "BOSQUE", "LUCIERNAGAS", "MAGIA", "ENCANTO", "HADAS"
    ],
    "modo": "explorar",
    "grilla_letters": [
        ["N","I","N","F","A","D","R","I","A","D","E"],
        ["A","R","T","E","M","I","S","A","X","P","H"],
        ["Y","B","O","S","Q","U","E","M","A","O","A"],
        ["A","P","O","L","O","X","N","A","L","L","D"],
        ["D","L","U","C","I","E","R","N","A","G","A"],
        ["E","N","C","A","N","T","O","G","I","A","S"],
        ["M","A","G","I","A","Z","Y","I","W","Q","X"],
    ],
    "paleta": [
        "#1a472a",  # Verde bosque oscuro
        "#2d5a27",  # Verde musgo
        "#f4e4bc",  # Dorado antiguo
        "#8b7355",  # Marrón corteza
        "#e8d5b7"   # Crema pergamino
    ]
}

print("🌲 Generando: BOSQUE DE LAS NINFAS")
print(f"   Tema: {request_data['tema']}")
print(f"   Estilo: {request_data['estilo']}")
print(f"   Palabras: {', '.join(request_data['palabras'])}")
print()

try:
    print("📡 Enviando request al Director Híbrido...")
    resp = requests.post(f"{API_URL}/director/generate", json=request_data, timeout=300)
    print(f"   Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"\n✅ Success: {data.get('success')}")
        print(f"🆔 Generation ID: {data.get('generation_id')}")
        print(f"📋 Stages: {data.get('stages_completed')}")
        
        if data.get('qc_result'):
            qc = data['qc_result']
            print(f"\n📊 QC Result:")
            print(f"   Passed: {qc.get('passed')}")
            print(f"   Grid Integrity: {qc.get('grid_integrity', 0):.1%}")
            print(f"   Title Contrast: {qc.get('title_contrast', 0):.1f}:1")
            print(f"   Visual Load: {qc.get('visual_load', 0):.1%}")
            
            if qc.get('issues'):
                print(f"\n   ⚠️ Issues:")
                for issue in qc['issues'][:5]:
                    print(f"      - {issue}")
            
            if qc.get('suggestions'):
                print(f"\n   💡 Suggestions:")
                for sug in qc.get('suggestions', [])[:3]:
                    print(f"      - {sug}")
        
        if data.get('errors'):
            print(f"\n❌ Errors: {data['errors']}")
        
        if data.get('final_image'):
            print("\n🖼️ Guardando imagen final...")
            img_data = base64.b64decode(data['final_image'])
            output_path = "bosque_ninfas_output.png"
            with open(output_path, "wb") as f:
                f.write(img_data)
            print(f"   ✅ Saved to: {output_path}")
    else:
        print(f"❌ Error: {resp.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
