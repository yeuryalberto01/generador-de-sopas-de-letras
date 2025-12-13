
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key present: {bool(api_key)}")

url = "http://localhost:8000/api/ai/generate-smart-design"
payload = {
    "prompt": "geometric decorative star",
    "style": "color"
}
headers = {
    "Content-Type": "application/json",
    "X-API-Key": api_key or ""
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print(f"Image Data URI Length: {len(data.get('image', ''))}")
        # print(data)
    else:
        print("Error:")
        print(response.text)
except Exception as e:
    print(f"Exception: {e}")
