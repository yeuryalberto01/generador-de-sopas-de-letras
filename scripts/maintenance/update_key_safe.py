import os

env_path = 'backend/.env'
new_key = 'AIzaSyBOoZNi08r2LA9TEehIKG-B8_9x2iKGXD8'

if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    with open(env_path, 'w') as f:
        found = False
        for line in lines:
            if line.startswith('GEMINI_API_KEY='):
                f.write(f'GEMINI_API_KEY={new_key}\n')
                found = True
            else:
                f.write(line)
        if not found:
            f.write(f'GEMINI_API_KEY={new_key}\n')
    print("Updated .env successfully")
else:
    print(".env not found")
