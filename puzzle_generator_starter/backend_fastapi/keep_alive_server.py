#!/usr/bin/env python3
"""
Servidor que se mantiene vivo para testing
"""

from main import app
from fastapi.testclient import TestClient
import threading
import time
import uvicorn

def keep_alive():
    """Función que mantiene el servidor vivo"""
    while True:
        time.sleep(1)

if __name__ == "__main__":
    print("🚀 Starting Keep-Alive Server...")

    # Probar que la aplicación funciona
    client = TestClient(app)
    response = client.get('/api/db/temas')
    print(f"✅ API Test: Status {response.status_code}")

    # Iniciar thread keep-alive
    keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
    keep_alive_thread.start()

    # Iniciar servidor
    try:
        uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")
    except Exception as e:
        print(f"❌ Server error: {e}")
        import traceback
        traceback.print_exc()