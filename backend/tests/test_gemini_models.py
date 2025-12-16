
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load env vars from backend/.env if possible, or assume user environment has it
# The terminal context usually implies environment variables are set or virtualenv is active.
# I'll try to load from typical locations just in case.
load_dotenv("backend/.env")

def check_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment.")
        return

    print(f"🔑 API Key found (starts with: {api_key[:4]}...)")
    genai.configure(api_key=api_key)

    print("\n📋 Listing available Gemini models:")
    try:
        models = list(genai.list_models())
        found_models = []
        for m in models:
            if "gemini" in m.name:
                print(f"  - {m.name} ({m.display_name})")
                found_models.append(m.name)
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return

    target_model = "models/gemini-2.5-flash" # or just "gemini-2.5-flash"
    # Note: older SDKs might verify "models/" prefix. list_models returns "models/..."
    
    print(f"\n🎯 Testing specific access to 'gemini-2.5-flash'...")
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content("Hello, do I have access to you?")
        print(f"✅ SUCCESS! Response from gemini-2.5-flash: {response.text}")
    except Exception as e:
        print(f"⚠️ Failed to use gemini-2.5-flash: {e}")
        
    # Also test 2.0-flash as a benchmark since we used it in the code
    print(f"\n🎯 Testing specific access to 'gemini-2.0-flash'...")
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content("Hello, verify 2.0 status.")
        print(f"✅ SUCCESS! Response from gemini-2.0-flash: {response.text}")
    except Exception as e:
        print(f"⚠️ Failed to use gemini-2.0-flash: {e}")

if __name__ == "__main__":
    check_models()
