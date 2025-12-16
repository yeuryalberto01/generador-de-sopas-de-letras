
import requests
import os

def analyze_comfy_capabilities():
    print("🕵️ Analizando capacidades de ComfyUI (usando requests)...")
    try:
        resp = requests.get('http://127.0.0.1:8188/object_info')
        if resp.status_code != 200:
            print(f"❌ Error conectando: {resp.status_code}")
            return
        
        info = resp.json()
        
        nodes = list(info.keys())
        categories = set()
        special_features = {
            "ControlNet": False,
            "Upscale": False,
            "FaceRestore": False,
            "LoRA": False,
            "IPAdapter": False,
            "AnimateDiff": False,
            "Masking": False,
            "Inpaint": False
        }
        
        print(f"✅ Total Nodos Detectados: {len(nodes)}")
        
        for node_name, data in info.items():
            cat = data.get('category', 'Unknown')
            categories.add(cat)
            
            # Detectar features clave
            if "ControlNet" in node_name or "ControlNet" in cat:
                special_features["ControlNet"] = True
            if "Upscale" in node_name or "Upscale" in cat or "ESRGAN" in node_name:
                special_features["Upscale"] = True
            if "Face" in node_name or "Restore" in node_name:
                special_features["FaceRestore"] = True
            if "Lora" in node_name or "LoRA" in node_name:
                special_features["LoRA"] = True
            if "IPAdapter" in node_name:
                special_features["IPAdapter"] = True
            if "Animate" in node_name:
                special_features["AnimateDiff"] = True
            if "Mask" in node_name:
                special_features["Masking"] = True
            if "Inpaint" in node_name or "inpaint" in cat:
                 special_features["Inpaint"] = True

        print("\n📦 Categorías de Nodos Encontradas:")
        for cat in sorted(categories):
            # Filtro simple para no saturar
            print(f" - {cat}")

        print("\n🚀 Capacidades Avanzadas Detectadas (Nodos instalados):")
        for feature, available in special_features.items():
            status = "✅ SÍ" if available else "❌ NO"
            print(f" - {feature}: {status}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    analyze_comfy_capabilities()
