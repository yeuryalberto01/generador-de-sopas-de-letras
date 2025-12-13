import os

def check_step_7_styling():
    print("--- [Step 7] Styling System ---")
    fe_dir = "Creador-de-sopas-de-letras-Ultra-IA"
    
    # 1. Tailwind Config
    tw_config = os.path.join(fe_dir, "tailwind.config.js")
    if os.path.exists(tw_config):
        print("✅ tailwind.config.js found.")
        # Optional: check if content path includes ./src
        with open(tw_config, "r", encoding="utf-8") as f:
            if "content" in f.read():
                print("✅ Tailwind 'content' key found.")
    else:
        print("❌ tailwind.config.js missing!")

    # 2. Main CSS
    css_path = os.path.join(fe_dir, "index.css")
    if os.path.exists(css_path):
        with open(css_path, "r", encoding="utf-8") as f:
            content = f.read()
            if "@tailwind base" in content:
                print("✅ index.css contains Tailwind directives.")
            else:
                 print("⚠️ index.css missing @tailwind base directive.")
    else:
        print("❌ index.css missing!")

def check_step_8_data():
    print("\n--- [Step 8] Client-Side Data Service ---")
    services_dir = "Creador-de-sopas-de-letras-Ultra-IA/services"
    
    # 1. Critical Files
    files = ["storageService.ts", "../db.ts"] # Relative to services_dir logic
    
    base = services_dir
    if not os.path.exists(base):
         print(f"❌ Services dir missing: {base}")
         return

    stor_path = os.path.join(base, "storageService.ts")
    if os.path.exists(stor_path):
        print("✅ storageService.ts exists.")
    else:
        print("❌ storageService.ts missing!")

    db_path = os.path.join("Creador-de-sopas-de-letras-Ultra-IA", "db.ts")
    if os.path.exists(db_path):
        print("✅ db.ts (Dexie) exists.")
    else:
        print("❌ db.ts missing!")

if __name__ == "__main__":
    check_step_7_styling()
    check_step_8_data()
