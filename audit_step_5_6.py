import os
import json

def check_step_5_comfy():
    print("--- [Step 5] Template Engine (ComfyUI) ---")
    base = "backend/modules/template_engine"
    if not os.path.exists(base):
        print(f"⚠️ Template engine module missing at {base}")
        return

    files = ["router.py", "comfy_client.py", "gpu_manager.py"]
    for f in files:
        fp = os.path.join(base, f)
        if os.path.exists(fp):
            try:
                with open(fp, "r", encoding="utf-8") as file:
                    compile(file.read(), fp, "exec")
                print(f"✅ {f} syntax OK.")
            except Exception as e:
                print(f"❌ Syntax Error in {f}: {e}")
        else:
             print(f"⚠️ Missing file: {f}")

def check_step_6_frontend_config():
    print("\n--- [Step 6] Frontend Configuration ---")
    fe_dir = "Creador-de-sopas-de-letras-Ultra-IA"
    
    # 1. Vite Config
    vite_path = os.path.join(fe_dir, "vite.config.ts")
    if os.path.exists(vite_path):
        print("✅ vite.config.ts exists.")
    else:
        print("❌ vite.config.ts missing!")

    # 2. Package.json
    pkg_path = os.path.join(fe_dir, "package.json")
    if os.path.exists(pkg_path):
        try:
            with open(pkg_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Check scripts
            if "dev" in data.get("scripts", {}):
                print("✅ 'dev' script found package.json.")
            else:
                 print("⚠️ 'dev' script missing in package.json.")
                 
            # Check dependencies (sample)
            deps = data.get("dependencies", {})
            if "react" in deps and "framer-motion" in deps:
                print("✅ Core frontend deps (React, Framer Motion) listed.")
        except Exception as e:
            print(f"❌ Error reading package.json: {e}")
    else:
        print("❌ package.json missing!")

if __name__ == "__main__":
    check_step_5_comfy()
    check_step_6_frontend_config()
