import requests
import json
import time
import base64

BASE_URL = "http://localhost:8000/api/ml"

# A minimal 1x1 transparent PNG for valid image placeholders
EMPTY_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="

GENESIS_MEMORIES = [
    {
        "prompt": "GENESIS_RULE_01: Safe Zone Layout. The center must remain clean for text visibility. Decorations only on margins.",
        "style": "universal_rule",
        "rating": 1,
        "meta": {"type": "axiom", "rule": "layout_safety"}
    },
    {
        "prompt": "GENESIS_RULE_02: Contrast Mastery. Backgrounds for word lists must be light enough for black text, or dark enough for white text.",
        "style": "universal_rule",
        "rating": 1,
        "meta": {"type": "axiom", "rule": "contrast"}
    },
    {
        "prompt": "Style Example: Bosque Mágico. Magic Forest, glowing mushrooms, fireflies, dark green and purple palette, cinematic lighting. Margins framed with vines.",
        "style": "nature_fantasy",
        "rating": 1,
        "meta": {"type": "style_guide", "theme": "nature"}
    },
    {
        "prompt": "Style Example: Cyberpunk City. Neon lights, futuristic buildings, glitch effect borders, dark blue and pink palette. Center area faint grid texture.",
        "style": "tech_cyberpunk",
        "rating": 1,
        "meta": {"type": "style_guide", "theme": "tech"}
    }
]

def seed_brain():
    print("🧠 Seeding Brain with Genesis Knowledge...")
    
    # Check connection first
    try:
        requests.get(f"{BASE_URL}/config")
    except:
        print("❌ Backend unavailable. Please restart the backend server first.")
        return

    count = 0
    for mem in GENESIS_MEMORIES:
        payload = {
            "prompt": mem["prompt"],
            "image_path": EMPTY_IMG,
            "style": mem["style"],
            "rating": mem["rating"],
            "timestamp": time.time(),
            "meta": mem["meta"]
        }
        
        try:
            res = requests.post(f"{BASE_URL}/log", json=payload)
            if res.status_code == 200:
                print(f"✅ Implanted Memory: {mem['prompt'][:50]}...")
                count += 1
            else:
                print(f"⚠️ Failed to implant: {res.text}")
        except Exception as e:
            print(f"❌ Error: {e}")
            
    print(f"\n✨ Initialization Complete. {count}/{len(GENESIS_MEMORIES)} Core Memories installed on External Drive.")

if __name__ == "__main__":
    seed_brain()
