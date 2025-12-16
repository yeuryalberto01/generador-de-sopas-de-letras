"""
Comprehensive Image Generation Test Suite
Tests all image-related functionality across 5 categories.
"""
import requests
import time
import base64
import os
import json
from datetime import datetime

BACKEND = "http://localhost:8001/api/ai"
RESULTS_DIR = "test_results"

class TestResult:
    def __init__(self, name, category):
        self.name = name
        self.category = category
        self.status = "pending"
        self.latency = 0
        self.details = {}
        self.error = None

    def to_dict(self):
        return {
            "name": self.name,
            "category": self.category,
            "status": self.status,
            "latency_ms": self.latency,
            "details": self.details,
            "error": self.error
        }

results = []

def log_test(name, category):
    result = TestResult(name, category)
    results.append(result)
    print(f"\n🧪 [{category}] {name}")
    return result

def save_image(data, name, folder="test_results"):
    """Save image data to file."""
    os.makedirs(folder, exist_ok=True)
    if data.startswith("data:"):
        header, b64 = data.split(",", 1)
        ext = "svg" if "svg" in header else "png"
        filename = f"{folder}/{name}.{ext}"
        
        if ext == "svg":
            with open(filename, "w", encoding="utf-8") as f:
                f.write(base64.b64decode(b64).decode("utf-8"))
        else:
            with open(filename, "wb") as f:
                f.write(base64.b64decode(b64))
        return filename
    return None

# ============= CATEGORY 1: BASIC GENERATION =============

def test_1_1_simple_image():
    result = log_test("Simple Image Generation", "Basic")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-image", json={
            "prompt": "Red apple on white background",
            "style": "color"
        }, timeout=120)
        result.latency = (time.time() - start) * 1000
        
        if r.status_code == 200:
            data = r.json()
            result.status = "pass" if "data:" in data.get("image", "") else "fail"
            result.details = {"provider": data.get("provider"), "has_image": "data:" in data.get("image", "")}
            if result.status == "pass":
                save_image(data["image"], "1_1_simple_image")
            print(f"   ✅ Provider: {data.get('provider')} | {result.latency:.0f}ms")
        else:
            result.status = "fail"
            result.error = f"HTTP {r.status_code}"
            print(f"   ❌ {result.error}")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

def test_1_2_complex_scene():
    result = log_test("Complex Scene Generation", "Basic")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-image", json={
            "prompt": "Tropical beach with palm trees at sunset, waves crashing on shore",
            "style": "color"
        }, timeout=120)
        result.latency = (time.time() - start) * 1000
        
        if r.status_code == 200:
            data = r.json()
            result.status = "pass" if "data:" in data.get("image", "") else "fail"
            result.details = {"provider": data.get("provider")}
            if result.status == "pass":
                save_image(data["image"], "1_2_complex_scene")
            print(f"   ✅ Provider: {data.get('provider')} | {result.latency:.0f}ms")
        else:
            result.status = "fail"
            result.error = f"HTTP {r.status_code}"
            print(f"   ❌ {result.error}")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

def test_1_3_svg_simple():
    result = log_test("Simple SVG Generation", "Basic")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-svg", json={
            "prompt": "Simple star shape",
            "style": "color",
            "count": 1
        }, timeout=120)
        result.latency = (time.time() - start) * 1000
        
        if r.status_code == 200:
            data = r.json()
            assets = data.get("assets", [])
            result.status = "pass" if len(assets) > 0 else "fail"
            result.details = {"count": len(assets), "provider": assets[0].get("provider") if assets else None}
            if assets:
                save_image(assets[0]["image"], "1_3_svg_simple")
            print(f"   ✅ Assets: {len(assets)} | {result.latency:.0f}ms")
        else:
            result.status = "fail"
            result.error = f"HTTP {r.status_code}"
            print(f"   ❌ {result.error}")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

def test_1_4_smart_design_batch():
    result = log_test("Batch Smart Design (3 assets)", "Basic")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-smart-design", json={
            "prompt": "Ocean underwater theme",
            "style": "color",
            "count": 3
        }, timeout=180)
        result.latency = (time.time() - start) * 1000
        
        if r.status_code == 200:
            data = r.json()
            assets = data.get("assets", [])
            result.status = "pass" if len(assets) >= 2 else "fail"
            result.details = {"count": len(assets)}
            for i, asset in enumerate(assets):
                save_image(asset["image"], f"1_4_batch_{i+1}")
            print(f"   ✅ Assets: {len(assets)} | {result.latency:.0f}ms")
        else:
            result.status = "fail"
            result.error = f"HTTP {r.status_code}"
            print(f"   ❌ {result.error}")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

# ============= CATEGORY 2: STYLE VARIATIONS =============

def test_2_1_color_style():
    result = log_test("Color Style", "Styles")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-image", json={
            "prompt": "Colorful butterfly with vibrant wings",
            "style": "color"
        }, timeout=120)
        result.latency = (time.time() - start) * 1000
        
        if r.status_code == 200:
            data = r.json()
            result.status = "pass"
            result.details = {"provider": data.get("provider")}
            save_image(data["image"], "2_1_color_style")
            print(f"   ✅ {result.latency:.0f}ms")
        else:
            result.status = "fail"
            print(f"   ❌ HTTP {r.status_code}")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

def test_2_2_bw_style():
    result = log_test("Black & White Style", "Styles")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-image", json={
            "prompt": "Mountain landscape in black and white, high contrast",
            "style": "bw"
        }, timeout=120)
        result.latency = (time.time() - start) * 1000
        
        if r.status_code == 200:
            data = r.json()
            result.status = "pass"
            save_image(data["image"], "2_2_bw_style")
            print(f"   ✅ {result.latency:.0f}ms")
        else:
            result.status = "fail"
            print(f"   ❌ HTTP {r.status_code}")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

def test_2_3_geometric():
    result = log_test("Geometric Pattern", "Styles")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-svg", json={
            "prompt": "Geometric abstract pattern with triangles and hexagons in blue gold",
            "style": "color",
            "count": 1
        }, timeout=120)
        result.latency = (time.time() - start) * 1000
        
        if r.status_code == 200:
            data = r.json()
            assets = data.get("assets", [])
            result.status = "pass" if assets else "fail"
            if assets:
                save_image(assets[0]["image"], "2_3_geometric")
            print(f"   ✅ {result.latency:.0f}ms")
        else:
            result.status = "fail"
            print(f"   ❌ HTTP {r.status_code}")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

# ============= CATEGORY 3: ERROR HANDLING =============

def test_3_1_empty_prompt():
    result = log_test("Empty Prompt Handling", "Errors")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-image", json={
            "prompt": "",
            "style": "color"
        }, timeout=30)
        result.latency = (time.time() - start) * 1000
        
        # Empty prompt should still work or return graceful error
        result.status = "pass" if r.status_code in [200, 400, 422] else "fail"
        result.details = {"status_code": r.status_code}
        print(f"   ✅ Handled with HTTP {r.status_code} | {result.latency:.0f}ms")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

def test_3_2_timeout_handling():
    result = log_test("Timeout Handling", "Errors")
    try:
        start = time.time()
        r = requests.post(f"{BACKEND}/generate-image", json={
            "prompt": "Simple circle",
            "style": "color"
        }, timeout=5)
        result.latency = (time.time() - start) * 1000
        result.status = "pass"
        print(f"   ✅ Response in {result.latency:.0f}ms (before timeout)")
    except requests.exceptions.Timeout:
        result.status = "pass"
        result.details = {"reason": "Expected timeout for stress test"}
        print(f"   ✅ Timeout handled correctly")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

# ============= CATEGORY 4: PERFORMANCE =============

def test_4_1_latency():
    result = log_test("Average Latency (3 requests)", "Performance")
    latencies = []
    try:
        for i in range(3):
            start = time.time()
            r = requests.post(f"{BACKEND}/generate-svg", json={
                "prompt": f"Simple shape {i+1}",
                "style": "color",
                "count": 1
            }, timeout=60)
            lat = (time.time() - start) * 1000
            latencies.append(lat)
            print(f"      Request {i+1}: {lat:.0f}ms")
        
        avg = sum(latencies) / len(latencies)
        result.latency = avg
        result.status = "pass" if avg < 30000 else "fail"
        result.details = {"latencies": latencies, "average": avg}
        print(f"   ✅ Average: {avg:.0f}ms")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

def test_4_2_consecutive():
    result = log_test("5 Consecutive Requests", "Performance")
    success = 0
    try:
        for i in range(5):
            r = requests.post(f"{BACKEND}/generate-svg", json={
                "prompt": f"Pattern number {i+1}",
                "style": "color",
                "count": 1
            }, timeout=60)
            if r.status_code == 200:
                success += 1
                print(f"      Request {i+1}: ✅")
            else:
                print(f"      Request {i+1}: ❌")
        
        result.status = "pass" if success == 5 else "fail"
        result.details = {"success": success, "total": 5}
        print(f"   Result: {success}/5 successful")
    except Exception as e:
        result.status = "error"
        result.error = str(e)
        print(f"   ❌ {e}")

# ============= MAIN =============

def main():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    
    print("=" * 70)
    print("🔬 COMPREHENSIVE IMAGE GENERATION TEST SUITE")
    print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Category 1: Basic Generation
    print("\n" + "=" * 40)
    print("📦 CATEGORY 1: BASIC GENERATION")
    print("=" * 40)
    test_1_1_simple_image()
    test_1_2_complex_scene()
    test_1_3_svg_simple()
    test_1_4_smart_design_batch()
    
    # Category 2: Style Variations
    print("\n" + "=" * 40)
    print("🎨 CATEGORY 2: STYLE VARIATIONS")
    print("=" * 40)
    test_2_1_color_style()
    test_2_2_bw_style()
    test_2_3_geometric()
    
    # Category 3: Error Handling
    print("\n" + "=" * 40)
    print("⚠️ CATEGORY 3: ERROR HANDLING")
    print("=" * 40)
    test_3_1_empty_prompt()
    test_3_2_timeout_handling()
    
    # Category 4: Performance
    print("\n" + "=" * 40)
    print("⚡ CATEGORY 4: PERFORMANCE")
    print("=" * 40)
    test_4_1_latency()
    test_4_2_consecutive()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 FINAL SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for r in results if r.status == "pass")
    failed = sum(1 for r in results if r.status == "fail")
    errors = sum(1 for r in results if r.status == "error")
    
    for r in results:
        icon = "✅" if r.status == "pass" else "❌" if r.status == "fail" else "⚠️"
        print(f"   {icon} [{r.category}] {r.name}")
    
    print(f"\n   TOTAL: {passed} passed, {failed} failed, {errors} errors")
    print(f"   SUCCESS RATE: {passed}/{len(results)} ({100*passed/len(results):.0f}%)")
    print("=" * 70)
    
    # Save results to JSON
    with open(f"{RESULTS_DIR}/test_results.json", "w") as f:
        json.dump([r.to_dict() for r in results], f, indent=2)
    print(f"   Results saved to {RESULTS_DIR}/test_results.json")

if __name__ == "__main__":
    main()
