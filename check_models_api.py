
import requests
import json

def check_available_models():
    print("🕵️ Consultando modelos disponibles en ComfyUI API...")
    try:
        # Obtener info del nodo CheckpointLoaderSimple para ver sus opciones
        resp = requests.get('http://127.0.0.1:8188/object_info/CheckpointLoaderSimple')
        
        if resp.status_code == 200:
            data = resp.json()
            # La lista de modelos suele estar en input > required > ckpt_name > 0
            models = data.get('input', {}).get('required', {}).get('ckpt_name', [])[0]
            
            print(f"✅ Modelos detectados ({len(models)}):")
            found_realistic = False
            for m in models:
                print(f" - {m}")
                if "Realistic" in m:
                    found_realistic = True
            
            if found_realistic:
                print("\n✅ CONFIRMADO: Realistic Vision está disponible para ComfyUI.")
            else:
                print("\n❌ ALERTA: Realistic Vision NO aparece en la lista. ComfyUI necesita un Refresh o Reinicio.")
        else:
            print(f"❌ Error API: {resp.status_code}")
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    check_available_models()
