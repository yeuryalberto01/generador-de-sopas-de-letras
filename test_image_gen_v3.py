import requests
import os
import json
import base64

# Configuration
BASE_URL = "http://127.0.0.1:8000"
ENDPOINT = "/api/ai/generate-image"

# Test Payload
payload = {
    "prompt": "A futuristic city skyline with neon lights, digital art style",
    "style": "color"
}

print(f"Testing {BASE_URL}{ENDPOINT}...")
print(f"Payload: {payload}")

try:
    response = requests.post(f"{BASE_URL}{ENDPOINT}", json=payload, timeout=60)
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print(f"Provider: {data.get('provider')}")
        
        image_data = data.get('image')
        if image_data and image_data.startswith('data:image'):
            print("Image data received correctly (base64).")
            # Optional: save to file to prove it works
            # header, encoded = image_data.split(",", 1)
            # with open("test_gen_v3.png", "wb") as f:
            #     f.write(base64.b64decode(encoded))
            # print("Saved test_gen_v3.png")
        else:
            print("ERROR: Invalid image data format.")
    else:
        print(f"Failed. Response: {response.text}")

except Exception as e:
    print(f"Exception: {e}")
