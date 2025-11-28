import requests
import json
import base64
import os

URL = "http://localhost:8002/api/ai/generate-image"

def test_image_generation():
    print("Testing Backend Image Generation (Imagen 3)...")
    
    payload = {
        "prompt": "A futuristic city skyline at sunset",
        "style": "color",
        "model": "imagen-4.0-fast-generate-001"
    }
    
    try:
        print(f"Sending request to {URL}...")
        response = requests.post(URL, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "image" in data:
                print("Success! Image data received.")
                image_data = data["image"]
                print(f"Image Data Length: {len(image_data)}")
                print(f"Image Data Preview: {image_data[:50]}...")
                
                # Save it to verify it's a real image
                if image_data.startswith("data:image/png;base64,"):
                    base64_data = image_data.split(",")[1]
                    with open("test_image_output.png", "wb") as f:
                        f.write(base64.b64decode(base64_data))
                    print("Saved test_image_output.png")
            else:
                print("Response JSON missing 'image' key:", data)
        else:
            print("Failed:", response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_image_generation()
