
import urllib.request
import time
import sys
import json

URL = "http://127.0.0.1:8188/system_stats"

print(f"⏳ Polling {URL} for 120 seconds...")
start = time.time()
while time.time() - start < 120:
    try:
        with urllib.request.urlopen(URL, timeout=1) as response:
            if response.status == 200:
                print("✅ Server is UP!")
                sys.exit(0)
    except Exception:
        pass
    time.sleep(2)
    print(".", end="", flush=True)

print("\n❌ Timeout waiting for server.")
sys.exit(1)
