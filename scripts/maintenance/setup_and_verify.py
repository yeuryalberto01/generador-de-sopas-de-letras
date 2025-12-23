
import os
import urllib.request
import json
import random
import time
import sys

# Define Paths
BASE_DIR = r"c:\Users\yeury\Desktop\Proyecto Cenecompuc\SOPA DE LETRAS IA"
FONT_DIR = os.path.join(BASE_DIR, "ComfyUI_copy", "resources", "ComfyUI", "fonts")
FONT_URL = "https://github.com/google/fonts/raw/main/apache/courierprime/CourierPrime-Bold.ttf"
FONT_PATH = os.path.join(FONT_DIR, "Courier Prime Bold.ttf")
WORKFLOW_PATH = os.path.join(BASE_DIR, "ComfyUI_copy", "workflows", "sopa_workflow.json")
COMFY_SERVER = "http://127.0.0.1:8188"

def download_font():
    # Check for Fallback Font
    fallback_path = os.path.join(FONT_DIR, "Roboto-Regular.ttf")
    if os.path.exists(fallback_path):
        print("✅ Local font found (Roboto-Regular). Skipping download.")
        return True

    print(f"📂 Checking font directory: {FONT_DIR}")
    if not os.path.exists(FONT_DIR):
        os.makedirs(FONT_DIR)
        print("   Created directory.")
    
    print(f"⬇️ Downloading font from: {FONT_URL}")
    try:
        urllib.request.urlretrieve(FONT_URL, FONT_PATH)
        if os.path.exists(FONT_PATH) and os.path.getsize(FONT_PATH) > 0:
            print("✅ Font downloaded successfully!")
        else:
            print("❌ Download failed (file empty or missing).")
            return False
    except Exception as e:
        print(f"❌ Error downloading font: {e}")
        return False
    return True

def generate_puzzle():
    print("🧠 Starting Generation Process...")
    
    # Theme Data
    theme = {
        "title": "PRUEBA REPUBLICA",
        "prompt": "caribbean beach landscape, dominican republic culture, palm trees, blue ocean, maracas, tambora drum, vibrant colors, vector art style",
        "words": ["PC", "TECLADO", "MOUSE", "PANTALLA", "INTERNET", "WIFI", "CODIGO", "PYTHON", "DATOS", "NUBE"],
        "color": "#000000"
    }
    
    # Grid Logic
    grid = "P C . . . . . . . .\nT E C L A D O . . .\nM O U S E . . . . .\nP A N T A L L A . .\nI N T E R N E T . .\nW I F I . . . . . .\nC O D I G O . . . .\nP Y T H O N . . . .\nD A T O S . . . . .\nN U B E . . . . . ."
    
    # Load Workflow
    try:
        with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
            workflow = json.load(f)
    except Exception as e:
        print(f"❌ Error loading workflow: {e}")
        return

    # Inject Data
    workflow["6"]["inputs"]["text"] = f"word search background, {theme['prompt']}"
    workflow["10"]["inputs"]["text"] = theme["title"]
    workflow["10"]["inputs"]["font"] = "Roboto-Regular.ttf"
    # workflow["11"]["inputs"]["font"] = "Roboto-Regular.ttf"
    workflow["12"]["inputs"]["text"] = grid
    workflow["12"]["inputs"]["font"] = "Roboto-Regular.ttf"
    # workflow["13"]["inputs"]["font"] = "Roboto-Regular.ttf"
    
    # Send to ComfyUI
    p = {"prompt": workflow}
    data = json.dumps(p).encode('utf-8')
    
    print("🚀 Sending request to ComfyUI...")
    try:
        req = urllib.request.Request(f"{COMFY_SERVER}/prompt", data=data)
        with urllib.request.urlopen(req) as response:
            res_json = json.loads(response.read())
            print(f"✅ Success! Prompt ID: {res_json['prompt_id']}")
    except Exception as e:
        print(f"❌ Failed to send request: {e}")

if __name__ == "__main__":
    if download_font():
        generate_puzzle()
