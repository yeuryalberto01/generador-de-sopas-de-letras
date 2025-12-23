
import json
import urllib.request
import urllib.parse
import random
import time
import os
import sys

# === CONFIGURATION ===
COMFY_SERVER = "http://127.0.0.1:8188"
OUTPUT_DIR = r"c:\Users\yeury\Desktop\Proyecto Cenecompuc\SOPA DE LETRAS IA\ComfyUI_copy\output"

# === 1. THE BRAIN (Logic Part) ===
# Gemini/Logic decides the content.
THEMES = [
    {
        "topic": "PIRATES_OF_THE_CARIBBEAN",
        "title": "TESOROS PIRATAS",
        "prompt": "old vintage treasure map style background, pirate ship, skulls, gold coins, parchment texture, highly detailed, sharp focus, clean vector art style",
        "words": ["TESORO", "MAPA", "BARCO", "LORO", "ESPADA", "ISLA", "COFRE", "RON", "CALAVERA", "BRUJULA"],
        "color_title": "#8B0000", # Dark Red
        "color_grid": "#000000"
    },
    {
        "topic": "JUNGLE_SAFARI",
        "title": "AVENTURA SAFARI",
        "prompt": "lush jungle frame, cute cartoon animals, lions, giraffes, tropical leaves, bright colors, sunny day, educational illustration style",
        "words": ["LEON", "JIRAFA", "MONO", "SELVA", "RIO", "ARBOL", "TIGRE", "ZEBRA", "ELEFANTE", "MANGO"],
        "color_title": "#006400", # Dark Green
        "color_grid": "#000000"
    },
    {
        "topic": "SPACE_EXPLORATION",
        "title": "MISION ESPACIAL",
        "prompt": "outer space background, planets, rocket ship, stars, astronaut, nebula, deep blue and purple colors, vector art, flat design",
        "words": ["PLANETA", "LUNA", "COHETE", "ESTRELLA", "NASA", "MARTE", "ORBITA", "SOL", "ALIEN", "COMETA"],
        "color_title": "#000080", # Navy Blue
        "color_grid": "#FFFFFF" 
    }
]

def generate_grid(words, size=15):
    """Simple dummy grid generator for the test."""
    grid = [['.' for _ in range(size)] for _ in range(size)]
    # Just place words horizontally for this simple test to ensure legibility
    row = 0
    for word in words:
        if row >= size: break
        col = random.randint(0, size - len(word))
        for i, char in enumerate(word):
            grid[row][col + i] = char
        row += 1
    
    # Fill remaining with random letters
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    grid_str = ""
    for r in range(size):
        line = ""
        for c in range(size):
            if grid[r][c] == '.':
                line += random.choice(letters) + " "
            else:
                line += grid[r][c] + " "
        grid_str += line.strip() + "\n"
    return grid_str.strip()

def format_word_list(words):
    """Formats words into 2 columns."""
    res = "Palabras a buscar:\n"
    for i in range(0, len(words), 2):
        w1 = f"• {words[i]}"
        w2 = f"• {words[i+1]}" if i+1 < len(words) else ""
        res += f"{w1:<20} {w2}\n"
    return res

# === 2. ORCHESTRATION ===
def queue_prompt(workflow):
    p = {"prompt": workflow}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"{COMFY_SERVER}/prompt", data=data)
    return json.loads(urllib.request.urlopen(req).read())

def main():
    print("🧠 BRAIN: Selecting random theme...")
    theme = random.choice(THEMES)
    print(f"👉 Selected: {theme['title']}")
    
    print("🧠 BRAIN: Generating Puzzle Logic...")
    grid_text = generate_grid(theme['words'])
    word_list_text = format_word_list(theme['words'])
    
    # Load the template workflow
    workflow_path = r"c:\Users\yeury\Desktop\Proyecto Cenecompuc\SOPA DE LETRAS IA\ComfyUI_copy\workflows\sopa_workflow.json"
    with open(workflow_path, "r", encoding="utf-8") as f:
        template = json.load(f)
        
    # Inject Dynamic Data (This is the Brain controlling the Hand)
    # Node 6: Positive Prompt (Background/Theme)
    template["6"]["inputs"]["text"] = f"professional word search puzzle background, {theme['prompt']}, clear center area, high quality, 8k"
    
    # Node 10: Title
    template["10"]["inputs"]["text"] = theme["title"]
    template["10"]["inputs"]["color"] = theme["color_title"]
    
    # Node 12: Grid
    template["12"]["inputs"]["text"] = grid_text
    template["12"]["inputs"]["color"] = theme["color_grid"] # Contrast depends on bg provided by theme (simple logic here)
    if "SPACE" in theme["topic"]:
        template["12"]["inputs"]["color"] = "#FFFFFF" # White text for space
    else:
        template["12"]["inputs"]["color"] = "#000000"

    # Node 13: Word List
    template["13"]["inputs"]["text"] = word_list_text
    template["13"]["inputs"]["color"] = template["12"]["inputs"]["color"]

    # Node 20: Filename
    filename_prefix = f"autogen_{theme['topic']}_{random.randint(1000,9999)}"
    template["20"]["inputs"]["filename_prefix"] = filename_prefix

    print("🚀 SENDING TO COMYUI (The Hand)...")
    try:
        response = queue_prompt(template)
        prompt_id = response['prompt_id']
        print(f"✅ Job/Prompt ID: {prompt_id}")
        
        # Simple polling/wait (User can check folder, or we implement socket later)
        print(f"⏳ Waiting for generation... (Check '{filename_prefix}' in output folder)")
        
    except Exception as e:
        print(f"❌ ERROR: Could not connect to ComfyUI. Is it running on port 8188? {e}")

if __name__ == "__main__":
    main()
