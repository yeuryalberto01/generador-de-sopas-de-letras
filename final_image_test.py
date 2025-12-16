"""
Final Image Generation Test Script - 5 Tests
Tests the configured gemini-2.0-flash-exp-image-generation model.
"""
import requests
import time
import base64
import os

BACKEND_URL = "http://localhost:8001/api/ai/generate-image"
OUTPUT_DIR = "test_images"

def test_image(prompt: str, name: str) -> dict:
    """Generate an image and save it."""
    print(f"\n🎨 Generating: {name}")
    print(f"   Prompt: {prompt}")
    
    payload = {
        "prompt": prompt,
        "style": "color"
    }
    
    start = time.time()
    try:
        response = requests.post(BACKEND_URL, json=payload, timeout=120)
        elapsed = (time.time() - start) * 1000
        
        if response.status_code == 200:
            data = response.json()
            provider = data.get("provider", "unknown")
            image_data = data.get("image", "")
            
            # Save the image
            if image_data.startswith("data:"):
                # Extract base64 data
                header, b64 = image_data.split(",", 1)
                ext = "png" if "png" in header else "jpg" if "jpg" in header or "jpeg" in header else "svg"
                if "svg" in header:
                    ext = "svg"
                
                filename = f"{OUTPUT_DIR}/{name}.{ext}"
                os.makedirs(OUTPUT_DIR, exist_ok=True)
                
                if ext == "svg":
                    with open(filename, "w", encoding="utf-8") as f:
                        f.write(base64.b64decode(b64).decode("utf-8"))
                else:
                    with open(filename, "wb") as f:
                        f.write(base64.b64decode(b64))
                
                print(f"   ✅ SUCCESS!")
                print(f"   Provider: {provider}")
                print(f"   Saved: {filename}")
                print(f"   Latency: {elapsed:.0f}ms")
                return {"status": "success", "provider": provider, "file": filename, "latency": elapsed}
            else:
                print(f"   ⚠️ No valid image data")
                return {"status": "no_image", "provider": provider}
        else:
            print(f"   ❌ Error: {response.status_code}")
            return {"status": "error", "code": response.status_code}
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return {"status": "exception", "error": str(e)}

def main():
    print("=" * 70)
    print("🖼️  FINAL IMAGE GENERATION TEST - 5 IMAGES")
    print("=" * 70)
    
    tests = [
        ("ocean_sunset", "Beautiful ocean sunset with golden light reflecting on calm waves"),
        ("christmas_theme", "Christmas holiday scene with snow, pine trees, and festive decorations"),
        ("geometric_pattern", "Abstract geometric pattern with triangles and circles in blue and gold"),
        ("floral_design", "Elegant floral design with roses and vines, watercolor style"),
        ("space_galaxy", "Deep space nebula with stars and colorful cosmic clouds")
    ]
    
    results = []
    for name, prompt in tests:
        result = test_image(prompt, name)
        results.append((name, result))
    
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    
    success = 0
    for name, result in results:
        status = "✅" if result["status"] == "success" else "❌"
        provider = result.get("provider", "-")
        print(f"   {status} {name}: {provider}")
        if result["status"] == "success":
            success += 1
    
    print(f"\n   Total: {success}/{len(tests)} images generated successfully")
    print("=" * 70)

if __name__ == "__main__":
    main()
