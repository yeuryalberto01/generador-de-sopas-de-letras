#!/usr/bin/env python3
"""
Script para probar la funcionalidad de libros con items
"""

import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_libro_items():
    """Probar los endpoints de libros con items."""
    print("🧪 PRUEBA DE LIBROS CON ITEMS")
    print("=" * 50)

    try:
        # 1. Crear un libro de prueba
        print("\n1. Creando libro de prueba...")
        libro_data = {
            "nombre": "Mi Cuadernillo de Prueba",
            "descripcion": "Libro para testing de items",
            "plantilla": "basico"
        }

        response = requests.post(f"{BASE_URL}/api/db/libros", json=libro_data)
        if response.status_code == 200:
            libro = response.json()
            libro_id = libro["id"]
            print(f"   ✅ Libro creado: {libro['nombre']} (ID: {libro_id})")
        else:
            print(f"   ❌ Error creando libro: {response.status_code} - {response.text}")
            return

        # 2. Obtener temas disponibles
        print("\n2. Obteniendo temas disponibles...")
        response = requests.get(f"{BASE_URL}/api/db/temas")
        if response.status_code == 200:
            temas = response.json()
            if len(temas) > 0:
                tema_id = temas[0]["id"]
                tema_nombre = temas[0]["nombre"]
                print(f"   ✅ Tema encontrado: {tema_nombre} (ID: {tema_id})")
            else:
                print("   ❌ No hay temas disponibles")
                return
        else:
            print(f"   ❌ Error obteniendo temas: {response.status_code}")
            return

        # 3. Añadir tema al libro
        print("\n3. Añadiendo tema al libro...")
        item_data = {
            "tema_id": tema_id,
            "orden": 0,
            "configuracion": {
                "grid_size": "15x15",
                "dificultad": "medio"
            }
        }

        response = requests.post(f"{BASE_URL}/api/db/libros/{libro_id}/items", json=item_data)
        if response.status_code == 200:
            item = response.json()
            item_id = item["id"]
            print(f"   ✅ Item añadido: {item['tema_nombre']} (orden: {item['orden']})")
        else:
            print(f"   ❌ Error añadiendo item: {response.status_code} - {response.text}")
            return

        # 4. Obtener items del libro
        print("\n4. Obteniendo items del libro...")
        response = requests.get(f"{BASE_URL}/api/db/libros/{libro_id}/items")
        if response.status_code == 200:
            items = response.json()
            print(f"   ✅ Items obtenidos: {len(items)} item(s)")
            for item in items:
                print(f"      - {item['tema_nombre']} (orden: {item['orden']})")
        else:
            print(f"   ❌ Error obteniendo items: {response.status_code}")

        # 5. Obtener libro completo
        print("\n5. Obteniendo libro completo...")
        response = requests.get(f"{BASE_URL}/api/db/libros/{libro_id}/completo")
        if response.status_code == 200:
            libro_completo = response.json()
            print(f"   ✅ Libro completo: {libro_completo['nombre']}")
            print(f"      Items: {len(libro_completo['items'])}")
        else:
            print(f"   ❌ Error obteniendo libro completo: {response.status_code}")

        # 6. Limpiar: eliminar item y libro
        print("\n6. Limpiando datos de prueba...")
        response = requests.delete(f"{BASE_URL}/api/db/libros/items/{item_id}")
        if response.status_code == 200:
            print("   ✅ Item eliminado")
        else:
            print(f"   ⚠️  Error eliminando item: {response.status_code}")

        response = requests.delete(f"{BASE_URL}/api/db/libros/{libro_id}")
        if response.status_code == 200:
            print("   ✅ Libro eliminado")
        else:
            print(f"   ⚠️  Error eliminando libro: {response.status_code}")

        print("\n🎉 PRUEBA COMPLETADA EXITOSAMENTE")
        print("Los libros con items funcionan correctamente!")

    except requests.exceptions.ConnectionError:
        print("❌ ERROR: No se puede conectar al servidor")
        print("   Asegúrate de que el servidor esté ejecutándose: python main.py")
    except Exception as e:
        print(f"❌ ERROR inesperado: {e}")

if __name__ == "__main__":
    test_libro_items()