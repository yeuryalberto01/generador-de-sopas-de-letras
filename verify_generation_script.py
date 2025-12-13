
import requests
import json
import sys

def verify_generation():
    url = "http://localhost:8000/api/ai/generate-image"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": "Un diseño geométrico abstracto para una sopa de letras, colores pastel, estilo minimalista",
        "style": "color"
    }

    print(f"📡 Connecting to {url}...")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=60)
        
        print(f"⬇️ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "image" in data:
                img_data = data["image"][:50] + "..."
                provider = data.get("provider", "unknown")
                print(f"✅ SUCCESS! Image generated.")
                print(f"🖼️ Provider: {provider}")
                print(f"📦 Data: {img_data}")
                
                if "svg" in img_data or "<svg" in data.get("image", ""):
                     print("ℹ️ Note: Result is an SVG Vector.")
                elif "data:image/png" in img_data:
                     print("ℹ️ Note: Result is a Raster Image (PNG).")
            else:
                print("⚠️ Warning: structure valid but 'image' key missing.")
                print(data)
        else:
            print(f"❌ FAILED. Server returned error.")
            print(response.text)

    except Exception as e:
        print(f"💥 CONNECTION ERROR: {e}")
        print("Ensure the backend server is running on port 8000.")

if __name__ == "__main__":
    verify_generation()
