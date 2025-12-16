
import requests

try:
    response = requests.get("http://localhost:8001/api/art-studio/director/test_ping")
    print(f"Ping Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Ping Failed: {e}")
