import requests
import sys

def check_backend_comfy_status():
    url = "http://localhost:8000/api/template-engine/comfy/status"
    print(f"Checking {url}...")
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("Response JSON:", data)
            if data.get("available"):
                print("✅ Backend reports ComfyUI is AVAILABLE")
            else:
                print("❌ Backend reports ComfyUI is UNAVAILABLE")
        else:
            print(f"❌ Backend returned status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    check_backend_comfy_status()
