import os

NEW_KEY = "AIzaSyBOoZNi08r2LA9TEehIKG-B8_9x2iKGXD8"
ENV_FILE = ".env"

lines = []
if os.path.exists(ENV_FILE):
    try:
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading .env: {e}")

# Check if key exists and update, else append
key_found = False
new_lines = []
for line in lines:
    if line.strip().startswith("GEMINI_API_KEY="):
        new_lines.append(f"GEMINI_API_KEY={NEW_KEY}\n")
        key_found = True
    else:
        new_lines.append(line)

if not key_found:
    if new_lines and not new_lines[-1].endswith("\n"):
        new_lines.append("\n")
    new_lines.append(f"GEMINI_API_KEY={NEW_KEY}\n")

try:
    with open(ENV_FILE, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("SUCCESS: .env updated.")
except Exception as e:
    print(f"FAILED: Could not write .env: {e}")
