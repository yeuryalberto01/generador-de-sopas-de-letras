
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"API Key found: {'Yes' if api_key else 'No'}")
if api_key:
    print(f"Key prefix: {api_key[:5]}...")
    try:
        genai.configure(api_key=api_key)
        print("Listing models with google.generativeai...")
        with open("models.txt", "w") as f:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    line = f"- {m.name}\n"
                    print(line.strip())
                    f.write(line)
    except Exception as e:
        print(f"Error listing models: {e}")
