import os
import sys

# Mock imports to avoid dependency errors if running standalone
# But we should rely on installed package if possible.

def check_step_3_ai():
    print("--- [Step 3] AI Router Audit ---")
    fp = "backend/routers/ai.py"
    if not os.path.exists(fp):
        print(f"❌ Missing {fp}")
        return

    try:
        with open(fp, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Verify Model Names
        if "gemini-3-pro-image-preview" in content:
            print("✅ Gemini 3 Pro (Image) implementation found.")
        else:
            print("❌ Gemini 3 Pro implementation MISSING.")

        if "gemini-2.5-flash" in content:
            print("✅ Gemini 2.5 Flash implementation found.")
        else:
            print("❌ Gemini 2.5 Flash implementation MISSING.")
        
        # Syntax check
        compile(content, fp, "exec")
        print("✅ Syntax OK.")

    except Exception as e:
        print(f"❌ Error auditing AI router: {e}")

def check_step_4_db():
    print("\n--- [Step 4] Database Audit ---")
    files = ["backend/database.py", "backend/models.py"]
    
    for fp in files:
        if not os.path.exists(fp):
             print(f"⚠️ Warning: Missing {fp} (Optional if using other structure)")
             continue
        
        try:
            with open(fp, "r", encoding="utf-8") as f:
                compile(f.read(), fp, "exec")
            print(f"✅ {fp} syntax OK.")
        except Exception as e:
            print(f"❌ Syntax Error in {fp}: {e}")

    # Check for SQLite DB file
    if os.path.exists("sopa_letras.db"):
        print("✅ SQLite database file exists.")
    else:
        print("ℹ️ SQLite DB not found (Will be created on startup).")

if __name__ == "__main__":
    check_step_3_ai()
    check_step_4_db()
