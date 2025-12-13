import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

# Retrieve key from environment or hardcode for testing if known (but better to use env)
API_KEY = os.getenv("GEMINI_API_KEY")

def test_google_api_direct():
    print("Testing Google Imagen 3 API Direct...")
    
    if not API_KEY:
        print("ERROR: GEMINI_API_KEY not found in environment.")
        return

    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={API_KEY}"
    
    headers = {"Content-Type": "application/json"}
    payload = {
        "instances": [{"prompt": "A beautiful landscape"}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "1:1"
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code != 200:
            print("Error Response:", response.text)
        else:
            print("Success! Image generated.")
            # print(response.json()) # structured data

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_google_api_direct()
