import requests
import time
import json

BASE_URL = "http://localhost:8000/api/ai"

text_models = [
    "gemini-3-pro",
    "gemini-2.5-flash", 
    "gemini-2.0-flash-exp"
]

image_models = [
    "imagen-4.0-generate",
    "imagen-4.0-fast-generate",
    "imagen-3.0-generate-001"
]

print(">>> VERIFYING MODELS VIA BACKEND (localhost:8000) <<<\n")

# 1. Text Models
print("--- Text Models ---")
for model in text_models:
    print(f"Testing {model}...", end=" ")
    try:
        resp = requests.post(f"{BASE_URL}/generate", json={
            "provider": "gemini",
            "model": model,
            "prompt": "Say 'OK'"
        }, timeout=15)
        
        if resp.status_code == 200:
            print(f"SUCCESS ✅ (Response: {resp.json().get('text', '').strip()})")
        else:
            print(f"FAILED ❌ (Status {resp.status_code}: {resp.text[:50]}...)")
    except Exception as e:
        print(f"FAILED ❌ (Connection Error: Is backend running? {str(e)[:50]})")

# 2. Image Models
print("\n--- Image Models ---")
for model in image_models:
    print(f"Testing {model}...", end=" ")
    try:
        resp = requests.post(f"{BASE_URL}/generate-image", json={
            "prompt": "Test pixel",
            "style": "color",
            "model": model
        }, timeout=30) # Longer timeout for images
        
        if resp.status_code == 200:
            print(f"SUCCESS ✅ (Image Generated)")
        else:
            print(f"FAILED ❌ (Status {resp.status_code}: {resp.text[:50]}...)")
    except Exception as e:
        print(f"FAILED ❌ (Connection Error: {str(e)[:50]})")

print("\n>>> DONE <<<")
