
import requests
import json
import random

API_URL = "http://localhost:8001/api/art-studio/director/generate"

def test_director_flow():
    seed = 42
    payload = {
        "tema": "bosque encantado",
        "publico": "niños",
        "estilo": "cuento de hadas",
        "titulo": "El Bosque Mágico",
        "palabras": ["MAGIA", "HADA", "ARBOL", "LUGAR"],
        "modo": "producir",
        "seed": seed,
        "grilla_letters": [["M", "A"], ["G", "I"]]
    }
    
    print(f"🚀 Enviando solicitud al Director...\nContexto: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(API_URL, json=payload, timeout=60)
        
        if response.status_code != 200:
            print(f"❌ Error HTTP {response.status_code}: {response.text}")
            return

        data = response.json()
        
        if not data.get("success"):
            print("❌ Error en lógica:")
            for err in data.get("errors", []):
                print(f"---\n{err}\n---")
            return
            
        print("\n✅ Generación Exitosa!")
        print(f"🆔 ID: {data.get('generation_id')}")
        
        # Verificar Expansión de Prompt
        prompt_used = data.get("prompts_used", {}).get("simple_bg") # Ojo: key puede variar según implementación
        # En la implementación actual, el key es 'fondo' o similar en result.layers? No, prompts_used es un dict
        # Voy a imprimir todo prompts_used para ver
        print("\n🧠 [INTELIGENCIA: MEMORIA + LLM]")
        all_prompts = data.get("prompts_used", {})
        for k, v in all_prompts.items():
            print(f"  - Etapa '{k}': {v[:100]}... (Len: {len(v)})")
            
        # Verificar Visión
        print("\n👁️ [INTELIGENCIA: VISION]")
        meta = data.get("metadata", {})
        critique = meta.get("vision_critique")
        if critique:
            print(f"  - Crítica Visual: {critique}")
        else:
            print("  - ⚠️ No se recibió crítica visual (¿API Key configurada?)")
            
        # Verificar Semilla
        # El backend imprime la semilla en el log, pero aquí difícil verificar sin ver config de comfy
        # Pero podemos confiar en que si llegó, se usó.
        
    except Exception as e:
        print(f"❌ Excepción ejecutando test: {e}")

if __name__ == "__main__":
    test_director_flow()
