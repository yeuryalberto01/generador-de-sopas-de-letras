import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def print_pass(msg):
    print(f"   [PASS] {msg}")

def print_fail(msg):
    print(f"   [FAIL] {msg}")

def check_health():
    print("\n1. Checking Backend Health...")
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print_pass("Backend is online")
            return True
        else:
            print_fail(f"Status {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Connection refused: {e}")
        return False

def check_ai_text(provider="gemini"):
    print(f"\n2. Testing AI Text Generation ({provider})...")
    payload = {
        "provider": provider,
        "model": "gemini-2.0-flash" if provider == "gemini" else "deepseek-chat",
        "prompt": "Reply with 'OK'",
        "schema_type": None
    }
    try:
        response = requests.post(f"{BASE_URL}/api/ai/generate", json=payload, timeout=10)
        if response.status_code == 200:
            print_pass("Response received")
            return True
        else:
            print_fail(f"Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print_fail(f"Error: {e}")
        return False

def check_svg_generation():
    print("\n3. Testing SVG Generation...")
    payload = {
        "prompt": "A star",
        "style": "bw"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/ai/generate-svg", json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if "image" in data and "svg" in data["image"]:
                print_pass("SVG Generated")
                return True
            else:
                print_fail("Invalid response format")
                return False
        else:
            print_fail(f"Status {response.status_code}")
            return False
    except Exception as e:
        print_fail(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=== SYSTEM DIAGNOSTIC TOOL ===")
    if check_health():
        check_ai_text()
        check_svg_generation()
    else:
        print("\nCRITICAL: Backend is offline. Run 'iniciar_sistema.bat' first.")
