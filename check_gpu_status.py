import requests
import sys

def check_backend_gpu_status():
    url = "http://localhost:8000/api/template-engine/gpu-status"
    print(f"Checking {url}...")
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("Response JSON:", data)
            gpu_data = data.get("data", {})
            if gpu_data.get("has_cuda"):
                print("✅ Backend reports CUDA GPU is AVAILABLE")
                print(f"   GPUs: {gpu_data.get('gpus')}")
            else:
                print("⚠️ Backend reports NO CUDA GPU detected")
                print(f"   Recommended Device: {gpu_data.get('recommended_device')}")
        else:
            print(f"❌ Backend returned status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == "__main__":
    check_backend_gpu_status()
