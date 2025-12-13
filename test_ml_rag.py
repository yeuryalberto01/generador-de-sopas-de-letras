import requests
import json
import time

BASE_URL = "http://localhost:8000/api/ml"

def test_ml_rag():
    print("Testing ML RAG System...")
    
    # 1. Check Config
    try:
        res = requests.get(f"{BASE_URL}/config")
        print(f"Current Config: {res.json()}")
    except Exception as e:
        print(f"❌ Backend not running? {e}")
        return

    # 2. Log a Training Example
    example = {
        "prompt": "Un bosque encantado con luces de neón",
        "image_path": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==",
        "style": "cyberpunk_nature",
        "rating": 1,
        "timestamp": time.time(),
        "meta": {"test": True}
    }
    
    print("Logging example...")
    res = requests.post(f"{BASE_URL}/log", json=example)
    if res.status_code == 200:
        print(f"✅ Logged: {res.json()}")
    else:
        print(f"❌ Log Failed: {res.text}")
        return

    # 3. Retrieve
    print("Retrieving similar examples...")
    search = {
        "prompt": "bosque neón",
        "limit": 3,
        "min_rating": 1
    }
    res = requests.post(f"{BASE_URL}/retrieve", json=search)
    results = res.json()
    
    found = False
    for r in results:
        if r['style'] == "cyberpunk_nature":
            found = True
            print(f"✅ Found Match: {r['prompt']}")
            break
            
    if not found:
        print("❌ Retrieval failed or not indexed yet.")
    else:
        print("🎉 RAG System Verified!")

if __name__ == "__main__":
    test_ml_rag()
