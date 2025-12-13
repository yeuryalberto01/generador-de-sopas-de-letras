import os

log_file = r"backend/backend_debug.log"

if os.path.exists(log_file):
    try:
        with open(log_file, 'rb') as f:
            # Move to end
            f.seek(0, 2)
            file_size = f.tell()
            # Read last 4KB
            seek_pos = max(0, file_size - 4096)
            f.seek(seek_pos)
            data = f.read()
            
            # Decode ignoring errors
            text = data.decode('utf-8', errors='ignore')
            lines = text.splitlines()
            
            print("--- LOG START ---")
            for line in lines[-20:]: # Last 20 lines
                print(line)
            print("--- LOG END ---")
    except Exception as e:
        print(f"Error reading log: {e}")
else:
    print(f"Log file not found: {log_file}")
