import requests
import json
import time

url = "http://localhost:8000/api/ai/generate-image"
payload = {
    "provider": "gemini", # Needed for AIRequest model? No, generate_image takes ImageRequest
    "model": "imagen-3.0-generate-001",
    "prompt": "Test decorative border with flowers",
    "style": "color"
}
# Note: ImageRequest model in ai.py:
# class ImageRequest(BaseModel):
#     prompt: str
#     style: str  # 'bw' or 'color'
#     model: Optional[str] = None

headers = {
    "Content-Type": "application/json"
}

print(f"Sending request to {url}...")
start = time.time()
try:
    response = requests.post(url, json=payload, headers=headers, timeout=300)
    elapsed = time.time() - start
    print(f"Time: {elapsed:.2f}s")
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print("Response Body:")
        print(response.text)
    else:
        data = response.json()
        if "image" in data and data["image"].startswith("data:image"):
             print("SUCCESS: Image data received.")
             print(f"Image length: {len(data['image'])}")
        else:
             print("RESPONSE OK but weird body:")
             print(data)

except Exception as e:
    elapsed = time.time() - start
    print(f"Time: {elapsed:.2f}s")
    print(f"Request failed: {e}")
