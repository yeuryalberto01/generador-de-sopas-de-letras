import os
from google import genai
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.getcwd(), 'backend', '.env'))
print(f"CWD: {os.getcwd()}")


api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not found in environment variables.")
else:
    print(f"GEMINI_API_KEY found: {api_key[:5]}...{api_key[-5:]}")

try:
    client = genai.Client(api_key=api_key)
    print("Client initialized.")

    print("Listing models...")
    with open('models_list.txt', 'w') as f:
        models = client.models.list()
        for m in models:
            if 'imagen' in m.name.lower():
                f.write(f"MODEL: {m.name}\n")
                print(f"MODEL: {m.name}")
             
except Exception as e:
    print(f"Error: {e}")
