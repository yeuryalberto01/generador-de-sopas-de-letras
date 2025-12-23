
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
        for m in genai.list_models():
             print(f"model_id: {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")
