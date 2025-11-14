#!/usr/bin/env python3
"""
Script de prueba para la aplicación mínima
"""

import requests

def main():
    print("Testing minimal FastAPI app...")
    try:
        response = requests.post('http://localhost:8001/test', json={'test': 'data'}, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()