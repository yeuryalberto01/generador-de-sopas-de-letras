import requests
import json
import os
import time

BASE_URL = "http://localhost:8000/api/ml"

def test_backend_flow():
    print("--- STARTING BRAIN BACKEND VERIFICATION ---")
    
    # 1. Test Stats (GET)
    print("\n1. Testing GET /stats...")
    try:
        res = requests.get(f"{BASE_URL}/stats")
        if res.status_code == 200:
            print(f"✅ Stats OK: {res.json()}")
        else:
            print(f"❌ Stats Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Create Dummy Memory (to delete later)
    print("\n2. Creating Dummy Memory for Test...")
    dummy_payload = {
        "prompt": "TEST_ENTRY_TO_DELETE",
        "style": "test_style",
        "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", # 1x1 pixel
        "meta": {"test": True}
    }
    
    try:
        res = requests.post(f"{BASE_URL}/log", json=dummy_payload)
        if res.status_code == 200:
            data = res.json()
            filename = data.get("file")
            print(f"✅ Created Dummy Memory: {filename}")
        else:
            print(f"❌ Creation Failed: {res.status_code} - {res.text}")
            return
    except Exception as e:
        print(f"❌ Creation Error: {e}")
        return

    # 3. Retrieve and Verify (POST)
    print("\n3. Verifying Retrieval...")
    try:
        res = requests.post(f"{BASE_URL}/retrieve", json={"prompt": "TEST_ENTRY", "limit": 5})
        results = res.json()
        found = any(r['_filename'] == filename for r in results)
        if found:
            print(f"✅ Retrieval OK: Found {filename} in results.")
        else:
            print(f"❌ Retrieval Warning: {filename} not found in search results.")
    except Exception as e:
        print(f"❌ Retrieval Error: {e}")

    # 4. DELETE Flow
    print(f"\n4. Testing DELETE /log/{filename}...")
    try:
        res = requests.delete(f"{BASE_URL}/log/{filename}")
        if res.status_code == 200:
            print(f"✅ Delete OK: {res.json()}")
        else:
            print(f"❌ Delete Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Delete Error: {e}")

    # 5. Verify Deletion (Should not find it)
    print("\n5. Verifying Deletion...")
    try:
        res = requests.post(f"{BASE_URL}/retrieve", json={"prompt": "TEST_ENTRY", "limit": 5})
        results = res.json()
        found = any(r['_filename'] == filename for r in results)
        if not found:
            print("✅ Verification OK: Memory is gone.")
        else:
            print("❌ Verification Failed: Memory still exists!")
    except Exception as e:
        print(f"❌ Verification Error: {e}")

    print("\n--- VERIFICATION COMPLETE ---")

if __name__ == "__main__":
    test_backend_flow()
