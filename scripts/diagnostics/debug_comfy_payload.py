
import json
import urllib.request
import sys

COMFY_SERVER = "http://127.0.0.1:8188"

def test_payload():
    # minimalist payload to check server health
    # just listing system stats or a very simple efficient node
    req = urllib.request.Request(f"{COMFY_SERVER}/system_stats")
    try:
        print("🔍 Checking Server Health...")
        with urllib.request.urlopen(req) as response:
            print(f"✅ Server Status: {response.status}")
            print(response.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ Server Check Failed: {e}")

    # Now try the actual workflow prompt
    path = r"c:\Users\yeury\Desktop\Proyecto Cenecompuc\SOPA DE LETRAS IA\ComfyUI_copy\workflows\sopa_workflow.json"
    with open(path, "r") as f:
        workflow = json.load(f)

    # Basic Injection
    workflow["6"]["inputs"]["text"] = "test prompt"
    
    p = {"prompt": workflow}
    data = json.dumps(p).encode('utf-8')
    
    print("\n🚀 Testing Workflow Submission...")
    req = urllib.request.Request(f"{COMFY_SERVER}/prompt", data=data)
    try:
        with urllib.request.urlopen(req) as response:
            print(f"✅ Submission Success! Status: {response.status}")
            print(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.reason}")
        print("Server Response:", e.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ Submission Failed: {e}")

if __name__ == "__main__":
    test_payload()
