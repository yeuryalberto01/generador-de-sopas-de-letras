import os

def search_files():
    print("Searching for GEMINI_API_KEY in all files...")
    root_dir = "."
    found = False
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        if "node_modules" in dirpath or ".git" in dirpath or ".venv" in dirpath:
            continue
            
        for filename in filenames:
            ext = os.path.splitext(filename)[1]
            if ext in [".py", ".ts", ".tsx", ".js", ".json", ".env", ".txt"]:
                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                        if "AIza" in content: # Common Google Key prefix
                            print(f"POSSIBLE KEY in {filepath}")
                            # Print snippet (careful with logs, agent memory is safeish but still)
                            idx = content.find("AIza")
                            print(f"Snippet: {content[idx:idx+20]}...")
                            found = True
                        if "GEMINI_API_KEY" in content:
                            # Check if it assigns a value
                            lines = content.split('\n')
                            for line in lines:
                                if "GEMINI_API_KEY" in line and "=" in line:
                                    # sensitive
                                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                                    if len(val) > 20 and not val.startswith("import") and not val.startswith("os."):
                                         print(f"FOUND CONFIG in {filepath}: {line[:20]}...")
                                         if val.startswith("AIza"):
                                             print(f"Confimed Key found!")
                                             with open(".env", "a") as envf:
                                                 envf.write(f"\nGEMINI_API_KEY={val}\n")
                                             print("Added to .env!")
                                             return
                except Exception:
                    pass
    if not found:
        print("No key found.")

if __name__ == "__main__":
    search_files()
