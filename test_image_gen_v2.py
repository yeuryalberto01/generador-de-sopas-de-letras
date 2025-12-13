import requests
import json
import time

url = "http://localhost:8000/api/ai/generate-image"
payload = {
    "model": "imagen-3.0-generate-001",
    "prompt": "Test decorative border with flowers",
    "style": "color"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, json=payload, headers=headers, timeout=300)
    print(f"Status: {response.status_code}")
    with open("last_test_response.txt", "w", encoding="utf-8") as f:
        f.write(response.text)
except Exception as e:
    print(f"Error: {e}")
