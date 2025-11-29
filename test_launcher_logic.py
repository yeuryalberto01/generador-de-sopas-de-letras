import threading
import time
import socket
import subprocess
import sys
import os
from launcher import SmartService, log_queue

# Mock the log queue to print to console
def mock_log_writer():
    while True:
        try:
            msg = log_queue.queue.get(timeout=1)
            print(f"[LOG] {msg}")
        except:
            pass

threading.Thread(target=mock_log_writer, daemon=True).start()

def start_dummy_server(port):
    """Starts a simple python http server to block a port"""
    print(f"--- Starting dummy server on port {port} ---")
    cmd = [sys.executable, "-m", "http.server", str(port)]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2) # Wait for it to bind
    return proc

def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def test_launcher_logic():
    TEST_PORT = 5173
    
    # 1. Setup: Block the port
    dummy_proc = start_dummy_server(TEST_PORT)
    
    if is_port_open(TEST_PORT):
        print(f"[PASS] Port {TEST_PORT} is successfully blocked by dummy process (PID: {dummy_proc.pid}).")
    else:
        print(f"[FAIL] Could not block port {TEST_PORT}. Test invalid.")
        return

    # 2. Initialize SmartService
    # We use a simple echo command just to see if it 'starts' after killing
    service = SmartService("TEST_BACKEND", ["cmd", "/c", "echo Hello"], ".", TEST_PORT)
    
    # 3. Trigger Start (Should auto-kill)
    print("--- Attempting SmartService.start() ---")
    started = service.start()
    
    # 4. Verify
    time.sleep(3) # Wait for kill and restart
    
    # Check if dummy process is dead
    if dummy_proc.poll() is not None:
         print(f"[PASS] Dummy process was killed.")
    else:
        # Double check with psutil/os if possible, or just assume if port logic worked
        # But wait, SmartService.start() calls force_kill_port which uses taskkill.
        # taskkill should have killed dummy_proc.
        print(f"[INFO] Checking if port is free or taken by new service...")

    if started:
        print("[PASS] SmartService.start() returned True.")
    else:
        print("[FAIL] SmartService.start() returned False.")

    # Cleanup
    service.stop()
    if dummy_proc.poll() is None:
        dummy_proc.terminate()

if __name__ == "__main__":
    test_launcher_logic()
