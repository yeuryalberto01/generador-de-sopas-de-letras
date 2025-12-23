import requests
import json
import sys

def check_status():
    print("🧠 Checking Brain Status...")
    try:
        # 1. Ping the Config Endpoint
        response = requests.get("http://localhost:8000/api/ml/config")
        if response.status_code == 200:
            config = response.json()
            path = config.get("training_path", "Not Set")
            print(f"✅ CONNECTION SUCCESSFUL!")
            print(f"📂 Memory Path: {path}")
            
            # 2. Check if we can write a test memory
            print("\n📝 Attempting to write a test memory...")
            log_res = requests.post("http://localhost:8000/api/ml/log", json={
                "prompt": "SYSTEM_TEST_VERIFICATION",
                "image_path": "TEST_NO_IMAGE",
                "style": "TEST",
                "rating": 1,
                "timestamp": 123456789
            })
            
            if log_res.status_code == 200:
                print(f"✅ WRITE SUCCESSFUL! File created: {log_res.json().get('file')}")
                print(f"👉 Go check your drive: {path}")
            else:
                print(f"❌ WRITE FAILED: {log_res.text}")

        else:
            print(f"❌ Backend reachable but endpoint failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION FAILED: The Backend Server is NOT running or not reachable.")
        print("💡 Solution: Restart 'launcher.py' or check the terminal window.")

if __name__ == "__main__":
    check_status()
