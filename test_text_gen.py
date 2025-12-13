import requests
import json
import time

url = "http://localhost:8000/api/ai/generate"
headers = {"Content-Type": "application/json"}
payload = {
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "prompt": "List 5 fruits."
}

try:
    print(f"Testing {url}...")
    start = time.time()
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    duration = time.time() - start
    
    print(f"Status Code: {response.status_code}")
    print(f"Time: {duration:.2f}s")
    
    if response.status_code == 200:
        print("Success!")
        print("Response:", response.json())
    else:
        print("Failed!")
        print("Response:", response.text)

except Exception as e:
    print(f"Error: {e}")
