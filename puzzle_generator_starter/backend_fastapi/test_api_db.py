#!/usr/bin/env python3
"""
Script de prueba para las nuevas APIs de base de datos
"""

import requests
import subprocess
import time
import signal
import os

BASE_URL = "http://localhost:8001"

def start_server():
    """Iniciar el servidor en background"""
    print("🚀 Iniciando servidor...")
    # Usar run_server.py que es más estable
    server_process = subprocess.Popen(
        ["python", "run_server.py"],
        cwd=os.path.dirname(__file__),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    time.sleep(3)  # Esperar que el servidor inicie
    return server_process

def stop_server(server_process):
    """Detener el servidor"""
    try:
        server_process.terminate()
        server_process.wait(timeout=5)
    except:
        server_process.kill()

def test_temas_api():
    """Probar las APIs de temas con base de datos"""
    print("🔬 Probando APIs de Temas (Base de Datos)...")

    # 1. Crear un tema
    tema_data = {
        "nombre": "Frutas Tropicales",
        "descripcion": "Tema con frutas exóticas",
        "palabras": [
            {"texto": "piña"},
            {"texto": "mango"},
            {"texto": "papaya"},
            {"texto": "guayaba"}
        ],
        "categoria": "frutas",
        "etiquetas": ["tropical", "exotico", "facil"],
        "dificultad": "facil"
    }

    print("1. Creando tema...")
    response = requests.post(f"{BASE_URL}/api/db/temas", json=tema_data, timeout=10)
    if response.status_code == 200:
        tema = response.json()
        tema_id = tema["id"]
        print(f"   ✅ Tema creado: {tema['nombre']} (ID: {tema_id})")
    else:
        print(f"   ❌ Error creando tema: {response.status_code} - {response.text}")
        return None

    # 2. Obtener el tema
    print("2. Obteniendo tema...")
    response = requests.get(f"{BASE_URL}/api/db/temas/{tema_id}", timeout=10)
    if response.status_code == 200:
        tema_obtenido = response.json()
        print(f"   ✅ Tema obtenido: {tema_obtenido['nombre']}")
    else:
        print(f"   ❌ Error obteniendo tema: {response.status_code} - {response.text}")

    # 3. Listar todos los temas
    print("3. Listando temas...")
    response = requests.get(f"{BASE_URL}/api/db/temas", timeout=10)
    if response.status_code == 200:
        temas = response.json()
        print(f"   📊 Total temas: {len(temas)}")
    else:
        print(f"   ❌ Error listando temas: {response.status_code} - {response.text}")

    return tema_id

def test_libros_api():
    """Probar las APIs de libros con base de datos"""
    print("🔬 Probando APIs de Libros (Base de Datos)...")

    # 1. Crear un libro
    libro_data = {
        "nombre": "Mi Libro de Frutas",
        "descripcion": "Un libro educativo sobre frutas",
        "plantilla": "infantil"
    }

    print("1. Creando libro...")
    response = requests.post(f"{BASE_URL}/api/db/libros", json=libro_data, timeout=10)
    if response.status_code == 200:
        libro = response.json()
        libro_id = libro["id"]
        print(f"   ✅ Libro creado: {libro['nombre']} (ID: {libro_id})")
    else:
        print(f"   ❌ Error creando libro: {response.status_code} - {response.text}")
        return None

    # 2. Obtener el libro
    print("2. Obteniendo libro...")
    response = requests.get(f"{BASE_URL}/api/db/libros/{libro_id}", timeout=10)
    if response.status_code == 200:
        libro_obtenido = response.json()
        print(f"   ✅ Libro obtenido: {libro_obtenido['nombre']}")
    else:
        print(f"   ❌ Error obteniendo libro: {response.status_code} - {response.text}")

    # 3. Crear una página
    pagina_data = {
        "numero_pagina": 1,
        "titulo": "Página de Frutas",
        "tema_id": None,  # Por ahora sin tema
        "contenido_json": {
            "layout": "grid",
            "elementos": [
                {"tipo": "titulo", "texto": "Frutas Deliciosas", "x": 100, "y": 50},
                {"tipo": "imagen", "src": "fruta.jpg", "x": 50, "y": 100, "width": 200, "height": 150}
            ]
        }
    }

    print("3. Creando página...")
    response = requests.post(f"{BASE_URL}/api/db/libros/{libro_id}/paginas", json=pagina_data, timeout=10)
    if response.status_code == 200:
        pagina = response.json()
        print(f"   ✅ Página creada: {pagina['titulo']} (ID: {pagina['id']})")
    else:
        print(f"   ❌ Error creando página: {response.status_code} - {response.text}")

    # 4. Obtener páginas del libro
    print("4. Obteniendo páginas del libro...")
    response = requests.get(f"{BASE_URL}/api/db/libros/{libro_id}/paginas", timeout=10)
    if response.status_code == 200:
        data = response.json()
        print(f"   📄 Total páginas: {data['total_paginas']}")
    else:
        print(f"   ❌ Error obteniendo páginas: {response.status_code} - {response.text}")

    # 5. Listar todos los libros
    print("5. Listando libros...")
    response = requests.get(f"{BASE_URL}/api/db/libros", timeout=10)
    if response.status_code == 200:
        libros = response.json()
        print(f"   📚 Total libros: {len(libros)}")
    else:
        print(f"   ❌ Error listando libros: {response.status_code} - {response.text}")

    return libro_id

def main():
    """Función principal de pruebas"""
    print("🚀 Iniciando pruebas de APIs con Base de Datos")
    print("=" * 50)

    server = None
    try:
        # Iniciar servidor
        server = start_server()

        # Verificar que el servidor esté corriendo
        try:
            response = requests.get(f"{BASE_URL}/api/health", timeout=5)
            if response.status_code != 200:
                print("❌ Servidor no responde correctamente")
                return
        except:
            print("❌ No se pudo conectar al servidor")
            return

        print("✅ Servidor iniciado correctamente")
        print()

        # Probar temas
        tema_id = test_temas_api()
        print()

        # Probar libros
        libro_id = test_libros_api()
        print()

        print("✅ ¡Todas las pruebas completadas!")
        print(f"📊 Resumen: Tema ID: {tema_id}, Libro ID: {libro_id}")

    except requests.RequestException as e:
        print(f"❌ Error en pruebas: {e}")
    finally:
        if server:
            print("🛑 Deteniendo servidor...")
            stop_server(server)

if __name__ == "__main__":
    main()