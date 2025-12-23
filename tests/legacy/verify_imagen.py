import requests
import time
import base64
import os

BASE_URL = "http://localhost:8000/api/ai"
MODEL = "imagen-4.0-ultra-generate-001"
OUTPUT_FILE = "verification_test.png"

print(f">>> TESTING IMAGE GENERATION ({MODEL}) <<<")

payload = {
    "prompt": "A magical library floating in a nebula, cinematic lighting, 8k, highly detailed, fantasy art style",
    "style": "color",
    "model": MODEL
}

try:
    start = time.time()
    print("Sending request...")
    resp = requests.post(f"{BASE_URL}/generate-image", json=payload, timeout=60)
    duration = time.time() - start

    if resp.status_code == 200:
        data = resp.json()
        image_data_uri = data.get("image", "")
        
        if image_data_uri.startswith("data:image"):
            # Extract base64
            header, b64 = image_data_uri.split(";base64,")
            image_bytes = base64.b64decode(b64)
            
            with open(OUTPUT_FILE, "wb") as f:
                f.write(image_bytes)
                
            print(f"✅ SUCCESS! Image generated in {duration:.2f}s")
            print(f"Saved to: {os.path.abspath(OUTPUT_FILE)}")
            print(f"Provider: {data.get('provider', 'Unknown')}")
        else:
            print(f"⚠️ RECEIVED 200 OK but invalid image format: {image_data_uri[:50]}...")
    else:
        print(f"❌ FAILED validation. Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")

except Exception as e:
    print(f"❌ ERROR: {e}")
