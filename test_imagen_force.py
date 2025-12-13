import os
import requests
import json
import base64

# Configuration
API_URL = "http://localhost:8000/api/ai/generate-image"
API_KEY = os.getenv("GEMINI_API_KEY") # Ensure this is set in your env when running, or the backend picks it up

def test_imagen_force():
    print("Testing Imagen 3 Force...")
    
    payload = {
        "prompt": "A majestic enchanted forest, highly detailed, professional concept art, cinematic lighting, 8k",
        "style": "color",
        "model": "imagen-3.0-generate-001"
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            provider = data.get("provider", "unknown")
            print(f"SUCCESS: Generated with provider '{provider}'")
            
            if provider != "imagen-3.0":
                print("WARNING: Fallback occurred! This explains the quality issue.")
            else:
                print("CONFIRMED: Imagen 3 is working.")
                
            # Save debug info
            with open("last_gen_provider.txt", "w") as f:
                f.write(provider)
                
        else:
            print(f"FAILURE: Status {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    test_imagen_force()
