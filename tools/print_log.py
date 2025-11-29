import os
with open('backend/backend_debug.log', 'rb') as f:
    try:
        f.seek(-5000, 2)
    except OSError:
        f.seek(0)
    content = f.read().decode('utf-8', errors='ignore')
    with open('last_log.txt', 'w', encoding='utf-8') as out:
        out.write(content)
    print("Log written to last_log.txt")
