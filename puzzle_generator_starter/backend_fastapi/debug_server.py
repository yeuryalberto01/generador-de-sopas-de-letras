#!/usr/bin/env python3
"""
Script de debug para el servidor FastAPI
"""

import traceback
import uvicorn
from main import app

if __name__ == "__main__":
    print("Starting debug server...")
    try:
        print("Loading application...")
        print(f"App has {len(app.routes)} routes")

        # Print some routes for debugging
        for i, route in enumerate(app.routes[:10]):
            print(f"Route {i}: {getattr(route, 'path', 'unknown')} - {getattr(route, 'methods', 'unknown')}")

        print("Starting uvicorn server...")
        uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")

    except Exception as e:
        print(f"Server error: {e}")
        traceback.print_exc()