import os
import requests
from dotenv import load_dotenv

load_dotenv('backend/.env')
api_key = os.getenv("GEMINI_API_KEY")

def test_model(model_name):
    print(f"Testing {model_name}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": "Hello, simply reply 'OK'."}]}]
    }
    
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Success!")
        print(response.json())
        return True
    else:
        print("Failed.")
        print(response.text)
        return False

# Test the requested model
test_model("gemini-2.5-flash")
# Also test the experimental one we saw earlier
test_model("gemini-2.0-flash-exp")
