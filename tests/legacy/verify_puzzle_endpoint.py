
import requests
import json
import time

URL = "http://localhost:8000/api/puzzle/create"

payload = {
    "words": ["HELLO", "WORLD", "PYTHON", "FASTAPI", "PUZZLE"],
    "width": 15,
    "height": 15,
    "difficulty": "EASY"
}

def check_endpoint():
    try:
        start_time = time.time()
        print(f"Sending POST to {URL}...")
        response = requests.post(URL, json=payload, timeout=5)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Response valid JSON, keys:", data.keys())
            if "grid" in data and "placedWords" in data:
                print("✅ PUZZLE GENERATION SUCCESS")
                print(f"Generated Grid {data['width']}x{data['height']}")
                print(f"Placed {len(data['placedWords'])}/{len(payload['words'])} words")
                return True
            else:
                print("❌ Invalid Response Schema")
                print(data)
        else:
            print("❌ Request Failed")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
    
    return False

if __name__ == "__main__":
    for i in range(5):
        if check_endpoint():
            break
        print("Retrying in 2s...")
        time.sleep(2)
