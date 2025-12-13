import os
import sys
import importlib.util

def check_step_1_env():
    print("--- [Step 1] Environment & Dependencies ---")
    
    # 1. Check .env
    env_path = ".env"
    if os.path.exists(env_path):
        print("✅ .env file exists.")
        # Check specific keys without printing values
        has_gemini = False
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
            if "GEMINI_API_KEY" in content:
                has_gemini = True
        
        if has_gemini:
            print("✅ GEMINI_API_KEY found in .env configuration.")
        else:
            print("❌ GEMINI_API_KEY NOT found in .env.")
    else:
        print("❌ .env file missing!")
        
    # 2. Check minimal requirements
    pkgs = ["fastapi", "uvicorn", "pydantic", "httpx", "google.generativeai"]
    all_ok = True
    for pkg in pkgs:
        if importlib.util.find_spec(pkg):
            # print(f"✅ {pkg} installed.")
            pass
        else:
            # Handle package name differences
            if pkg == "google.generativeai" and importlib.util.find_spec("google"):
                 pass # Approximation
            else:
                print(f"❌ Missing package: {pkg}")
                all_ok = False
    
    if all_ok:
        print("✅ Critical Core Dependencies installed.")

def check_step_2_launcher():
    print("\n--- [Step 2] Launcher & Core Services ---")
    
    # Check if launcher files exist
    files = ["launcher.py", "launcher_core.py"]
    missing = [f for f in files if not os.path.exists(f)]
    
    if missing:
        print(f"❌ Missing launcher files: {missing}")
        return

    print("✅ Launcher files present.")
    
    # Basic Syntax Check (compilation)
    for f in files:
        try:
            with open(f, "r", encoding="utf-8") as file:
                compile(file.read(), f, "exec")
            print(f"✅ {f} syntax OK.")
        except SyntaxError as e:
            print(f"❌ Syntax Error in {f}: {e}")

if __name__ == "__main__":
    check_step_1_env()
    check_step_2_launcher()
