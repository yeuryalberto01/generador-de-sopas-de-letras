import requests
import time

def check_connection():
    try:
        print("Checking Backend...")
        response = requests.get("http://localhost:8000/")
        print(f"Backend Status: {response.status_code}")
        
        print("Checking ComfyUI via Backend...")
        comfy_response = requests.get("http://localhost:8000/api/template-engine/comfy/status")
        if comfy_response.status_code == 200:
            data = comfy_response.json()
            print(f"ComfyUI Available: {data.get('available')}")
            print(f"ComfyUI URL: {data.get('url')}")
        else:
            print(f"ComfyUI Interface Error: {comfy_response.status_code}")
            
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_connection()
