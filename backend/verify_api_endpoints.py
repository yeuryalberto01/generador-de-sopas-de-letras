import requests
import sys
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(name, url, method="GET", expected_status=200):
    print(f"Testing {name} [{method} {url}]...", end=" ")
    try:
        start_time = time.time()
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url)
        else:
            print("Unsupported method")
            return False
        
        elapsed = (time.time() - start_time) * 1000
        
        if response.status_code == expected_status:
            print(f"✅ OK ({response.status_code}) - {elapsed:.2f}ms")
            return True
        else:
            print(f"❌ FAILED (Status: {response.status_code}) - {elapsed:.2f}ms")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ FAILED (Connection Refused)")
        print("   Is the backend running? Please start 'launcher.py' or 'backend/main.py'.")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def run_tests():
    print("=== System API Verification Test ===")
    print(f"Target: {BASE_URL}\n")
    
    # 1. Root Check
    if not test_endpoint("Root / Health", f"{BASE_URL}/"):
        print("\nCRITICAL: Backend is not accessible. Aborting further tests.")
        sys.exit(1)

    # 2. ML Stats
    test_endpoint("ML Stats", f"{BASE_URL}/api/ml/stats")
    
    # 3. ML Config
    test_endpoint("ML Config", f"{BASE_URL}/api/ml/config")
    
    # 4. Auth Login (Check if endpoint exists, expect 405 Method Not Allowed on GET or 422 Validation Error on POST without data)
    # We'll just check if it complies with being there.
    # Actually, let's just test a known working GET endpoint or checking 404s for non-existent.
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    run_tests()
