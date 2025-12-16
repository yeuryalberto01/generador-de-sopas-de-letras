
import os
import requests
import sys

# URL directa de HuggingFace (más estable que Civitai para scripts)
MODEL_URL = "https://huggingface.co/SG161222/Realistic_Vision_V6.0_B1_noVAE/resolve/main/Realistic_Vision_V6.0_NV_B1.safetensors"
MODEL_NAME = "Realistic_Vision_V6.0_NV_B1.safetensors"

# Ruta detectada de ComfyUI
COMFY_MODELS_DIR = r"C:\Users\yeury\Documents\ComfyUI\models\checkpoints"
DESTINATION_PATH = os.path.join(COMFY_MODELS_DIR, MODEL_NAME)

def download_file(url, filename):
    print(f"⬇️ Iniciando descarga de: {MODEL_NAME}")
    print(f"📂 Destino: {filename}")
    print("🚀 Esto puede tomar unos minutos (2GB)...")
    
    try:
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            total_length = int(r.headers.get('content-length', 0))
            dl = 0
            with open(filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        dl += len(chunk)
                        f.write(chunk)
                        done = int(50 * dl / total_length)
                        sys.stdout.write(f"\r[{'=' * done}{' ' * (50-done)}] {dl/1024/1024:.2f} MB")
                        sys.stdout.flush()
        print("\n✅ Descarga completada exitosamente.")
        return True
    except Exception as e:
        print(f"\n❌ Error durante la descarga: {e}")
        return False

if __name__ == "__main__":
    if os.path.exists(DESTINATION_PATH):
        print(f"⚠️ El modelo ya existe en: {DESTINATION_PATH}")
    else:
        success = download_file(MODEL_URL, DESTINATION_PATH)
        if success:
            print("🎉 Modelo instalado. Ahora ComfyUI puede generar fotorealismo.")
