
import json
import urllib.request
import time

COMFY_SERVER = "http://127.0.0.1:8188"

def test_minimal():
    # Minimal Workflow: Empty Latent -> Save Image (No Checkpoint loader needed if cached, but we include full path)
    # Actually, simplistic is: Checkpoint -> Empty Latent -> KSampler -> VAE Decode -> Save Image
    # But let's reuse the structure we have but STRIP the text nodes.
    
    path = r"c:\Users\yeury\Desktop\Proyecto Cenecompuc\SOPA DE LETRAS IA\ComfyUI_copy\workflows\sopa_workflow.json"
    with open(path, "r", encoding="utf-8") as f:
        full_workflow = json.load(f)

    # CREATE A NEW MINIMAL WORKFLOW FROM SCRATCH TO BE SAFE
    # Using Node IDs from the original JSON to keep consistent
    minimal_workflow = {
      "3": full_workflow["3"], # KSampler
      "4": full_workflow["4"], # Checkpoint
      "5": full_workflow["5"], # Empty Latent
      "6": full_workflow["6"], # Positive
      "7": full_workflow["7"], # Negative
      "8": { # VAE Decode (Missing in original JSON?! WAS Text Image handles it? No, WAS usually takes image input)
             # Wait, the original JSON has KSampler "3", but then "10" (WAS Text Image) takes input from "3"?
             # KSampler returns LATENT. WAS Text Image likely expects IMAGE.
             # WE ARE MISSING A VAE DECODE NODE IN THE ORIGINAL JSON!!!
             # That explains HTTP 400 (Invalid link types).
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode",
        "_meta": { "title": "VAE Decode" }
      },
      "20": {
        "inputs": {
            "images": ["8", 0], # Connect VAE Decode output to Save Image
            "filename_prefix": "minimal_test"
        },
        "class_type": "SaveImage",
        "_meta": { "title": "Save Image" }
      }
    }
    
    # Fix KSampler output: It returns LATENT.
    # WAS Text Image (Node 10) in original JSON had: "image": ["3", 0]. 
    # If Node 3 is KSampler, it outputs LATENT, not IMAGE.
    # WAS Text Image needs IMAGE. 
    # THE ORIGINAL JSON WAS MISSING THE VAE DECODE STEP. That is the bug!
    
    print("🚀 Sending MINIMAL workflow (With VAE Decode Fix)...")
    p = {"prompt": minimal_workflow}
    data = json.dumps(p).encode('utf-8')
    
    try:
        req = urllib.request.Request(f"{COMFY_SERVER}/prompt", data=data)
        with urllib.request.urlopen(req) as response:
            print(f"✅ Success! Response: {response.read().decode('utf-8')}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_minimal()
