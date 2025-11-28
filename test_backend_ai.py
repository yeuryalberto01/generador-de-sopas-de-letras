import requests
import json

URL = "http://localhost:8000/api/ai/generate"

def test_backend_generation():
    print("Testing Backend AI Generation with DeepSeek...")
    
    payload = {
        "provider": "deepseek",
        "prompt": "Generate a list of 5 words related to 'Space'. Return JSON: {words: []}",
        "json_mode": True
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
    test_backend_generation()
