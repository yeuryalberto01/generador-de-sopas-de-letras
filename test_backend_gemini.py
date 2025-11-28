import requests
import json

URL = "http://localhost:8000/api/ai/generate"

def test_gemini_generation():
    print("Testing Backend Gemini Generation...")
    
    payload = {
        "provider": "gemini",
        "model": "gemini-2.0-flash",
        "prompt": "Say hello",
        "schema_type": None
    }
    
    try:
        response = requests.post(URL, json=payload, timeout=30)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success! Backend returned:")
            print(json.dumps(response.json(), indent=2))
        else:
            print("Failed:", response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_gemini_generation()
