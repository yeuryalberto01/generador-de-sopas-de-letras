from dotenv import load_dotenv
import os

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
if key:
    print(f"API Key found: {key[:5]}...{key[-5:]}")
    print(f"Length: {len(key)}")
else:
    print("API Key NOT found in environment.")
