#!/usr/bin/env python3
"""
Script para ejecutar el servidor FastAPI del Puzzle Generator
"""

import traceback
import uvicorn
from main import app

if __name__ == "__main__":
    print("Starting Puzzle API server...")
    print("Loading application...")
    try:
        print("Application loaded successfully")
        print("Starting uvicorn server...")
        uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")
    except KeyboardInterrupt:
        print("Server stopped by user")
    except (OSError, ImportError, RuntimeError) as e:
        print(f"Server error: {e}")
        traceback.print_exc()
