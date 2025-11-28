import requests
import json
import base64

URL = "http://localhost:8000/api/ai/generate-svg"

def test_svg_generation():
    print("Testing Backend SVG Generation...")
    
    payload = {
        "prompt": "A simple star",
        "style": "bw"
    }
    
    try:
        response = requests.post(URL, json=payload, timeout=60)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "image" in data:
                print("Success! SVG data received.")
                image_data = data["image"]
                print(f"Image Data Length: {len(image_data)}")
                print(f"Image Data Preview: {image_data[:50]}...")
            else:
                print("Response JSON missing 'image' key:", data)
        else:
            print("Failed:", response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_svg_generation()
