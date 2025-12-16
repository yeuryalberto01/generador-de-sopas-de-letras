import requests

URL = "http://localhost:8000/api/ai/generate"
KEY = "AIzaSyBOoZNi08r2LA9TEehIKG-B8_9x2iKGXD8"

payload = {
    "provider": "gemini",
    "model": "gemini-3-pro",
    "prompt": "Reply with 'GEMINI 3 PRO WORKING'"
}
headers = {
    "Content-Type": "application/json",
    "X-API-Key": KEY
}

print(f"Testing Gemini 3.0 Pro with Key ending in ...{KEY[-4:]}")
try:
    resp = requests.post(URL, json=payload, headers=headers, timeout=15)
    if resp.status_code == 200:
        print(f"SUCCESS ✅\nResponse: {resp.json()}")
    else:
        print(f"FAILED ❌ (Status {resp.status_code})\nBody: {resp.text[:200]}")
except Exception as e:
    print(f"FAILED ❌ (Connection Error): {e}")
