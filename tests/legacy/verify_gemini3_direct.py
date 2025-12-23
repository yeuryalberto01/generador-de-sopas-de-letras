import asyncio
import os
import httpx
import base64
import json

# Mimic the handler logic
async def test_gemini3_logic():
    print("Testing Gemini 3 Pro Image Preview Direct Logic...")
    
    prompt = "A futuristic city skyline with neon lights, digital art style"
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Manual .env loader fallback
    if not api_key:
        print("env var not found, checking .env file...")
        try:
            with open(".env", "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            api_key = parts[1].strip().strip('"').strip("'")
                            print(f"Loaded API KEY from .env file (Length: {len(api_key)})")
                            break
        except Exception as e:
            print(f"Failed to read .env: {e}")

    if not api_key:
        print("SKIPPING: No GEMINI_API_KEY found in environment or .env file.")
        return

    model_name = "gemini-3-pro-image-preview"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "image/png"
        }
    }

    print(f"Sending request to {url}...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error Body: {response.text}")
                return

            data = response.json()
            # print(json.dumps(data, indent=2)) # Debug full response

            # Extraction logic
            part = data["candidates"][0]["content"]["parts"][0]
            if "inlineData" in part:
                b64_image = part["inlineData"]["data"]
                mime_type = part["inlineData"].get("mimeType", "image/png")
                print(f"SUCCESS! Received image data ({len(b64_image)} bytes). Mime: {mime_type}")
                
                 # Optional: save
                with open("direct_test_gemini3.png", "wb") as f:
                    f.write(base64.b64decode(b64_image))
                print("Saved direct_test_gemini3.png")
                
            else:
                 print("FAILED: No inlineData in response.")
                 print(data)

        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini3_logic())
