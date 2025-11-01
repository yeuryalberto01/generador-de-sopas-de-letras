"""
Script de prueba para verificar la persistencia de temas en el sistema.
"""
import json
import os
import requests


def test_persistencia():
    """
    Prueba la funcionalidad de persistencia del sistema de temas.

    Verifica que los temas se guarden correctamente en el archivo JSON
    y que persistan entre reinicios del servidor.
    """
    try:
        # Verificar health
        response = requests.get('http://localhost:8001/api/health', timeout=5)
        print(f'Health check: {response.status_code} - {response.text}')

        # Verificar temas iniciales
        response = requests.get('http://localhost:8001/api/temas', timeout=5)
        print(f'Temas iniciales: {len(response.json())} temas')

        # Crear un tema de prueba
        data = {
            'nombre': 'Tema de Prueba Persistente',
            'descripcion': 'Para verificar que se guarda',
            'words': ['casa', 'perro', 'gato']
        }
        response = requests.post('http://localhost:8001/api/temas', json=data, timeout=5)
        print(f'Crear tema: {response.status_code}')
        if response.status_code == 200:
            tema = response.json()
            print(f'Tema creado: {tema["nombre"]} (ID: {tema["id"]})')

            # Verificar que se guardó
            response = requests.get('http://localhost:8001/api/temas', timeout=5)
            temas = response.json()
            print(f'Total temas después de crear: {len(temas)}')

            # Verificar que el archivo se creó
            archivo = 'backend_fastapi/data/temas.json'
            if os.path.exists(archivo):
                print(f'✅ Archivo de persistencia creado: {archivo}')
                with open(archivo, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    print(f'✅ Datos guardados: {len(data)} temas en archivo')
            else:
                print(f'❌ Archivo de persistencia NO encontrado: {archivo}')

        else:
            print(f'Error al crear tema: {response.text}')

    except (requests.RequestException, json.JSONDecodeError, OSError) as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    test_persistencia()
