"""Script de prueba completo para el backend de FastAPI
Este script prueba todas las funcionalidades del módulo de temas
"""

# Third party imports
import requests  # pylint: disable=import-error

# Configuración
BASE_URL = 'http://127.0.0.1:8000'


def test_health():
    """Prueba el endpoint de salud"""
    print("1. Probando endpoint de salud...")
    try:
        response = requests.get(f'{BASE_URL}/api/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   [OK] Salud OK: {data}")
            return True
        print(f"   [ERROR] Error en salud: {response.status_code}")
        return False
    except requests.exceptions.ConnectionError:
        print("   [ERROR] No se puede conectar al servidor. ¿Está ejecutándose?")
        return False
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return False


def test_list_temas():
    """Prueba listar temas"""
    print("\n2. Probando listar temas...")
    try:
        response = requests.get(f'{BASE_URL}/api/temas', timeout=5)
        if response.status_code == 200:
            temas = response.json()
            print(f"   [OK] Temas encontrados: {len(temas)}")
            return temas
        print(f"   [ERROR] Error al listar temas: {response.status_code}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_create_tema():
    """Prueba crear un nuevo tema"""
    print("\n3. Probando crear tema...")
    nuevo_tema = {
        'nombre': 'Animales Salvajes',
        'descripcion': 'Tema sobre animales del safari',
        'words': ['leon', 'tigre', 'elefante', 'jirafa']
    }
    try:
        response = requests.post(f'{BASE_URL}/api/temas',
                                json=nuevo_tema, timeout=5)
        if response.status_code == 200:
            tema_creado = response.json()
            print(f"   [OK] Tema creado: {tema_creado['nombre']}")
            print(f"   ID asignado: {tema_creado['id']}")
            return tema_creado
        print(f"   [ERROR] Error al crear tema: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_get_tema(tema_id):
    """Prueba obtener un tema específico"""
    print(f"\n4. Probando obtener tema {tema_id}...")
    try:
        # Verificar que el tema está en la lista
        response = requests.get(f'{BASE_URL}/api/temas', timeout=5)
        if response.status_code == 200:
            temas = response.json()
            tema_encontrado = next(
                (t for t in temas if t.get('id') == tema_id), None)
            if tema_encontrado:
                print(f"   [OK] Tema encontrado en lista: "
                      f"{tema_encontrado['nombre']}")
                return tema_encontrado
            print("   [ERROR] Tema NO encontrado en lista")
            return None
        print(f"   [ERROR] Error al obtener lista: {response.status_code}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_get_palabras(tema_id):
    """Prueba obtener palabras de un tema"""
    print(f"\n5. Probando obtener palabras del tema {tema_id}...")
    try:
        response = requests.get(
            f'{BASE_URL}/api/temas/{tema_id}/palabras', timeout=5)
        if response.status_code == 200:
            palabras_data = response.json()
            print(f"   [OK] Palabras obtenidas: "
                  f"{palabras_data.get('palabras', [])}")
            print(f"   Total: {palabras_data.get('total', 0)}")
            return palabras_data
        print(f"   [ERROR] Error al obtener palabras: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_add_palabra(tema_id):
    """Prueba agregar una palabra al tema"""
    print(f"\n6. Probando agregar palabra al tema {tema_id}...")
    nueva_palabra = {'palabra': 'cebra'}
    try:
        response = requests.post(
            f'{BASE_URL}/api/temas/{tema_id}/palabras',
            json=nueva_palabra, timeout=5)
        if response.status_code == 200:
            resultado = response.json()
            print(f"   [OK] Palabra agregada: {resultado['palabra']}")
            print(f"   Total palabras: {resultado['total_palabras']}")
            return resultado
        print(f"   [ERROR] Error al agregar palabra: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_update_palabra(tema_id, index):
    """Prueba actualizar una palabra"""
    print(f"\n7. Probando actualizar palabra en índice {index}...")
    palabra_actualizada = {'palabra': 'LEOPARDO'}
    try:
        response = requests.put(
            f'{BASE_URL}/api/temas/{tema_id}/palabras/{index}',
            json=palabra_actualizada, timeout=5)
        if response.status_code == 200:
            resultado = response.json()
            print(f"   [OK] Palabra actualizada: "
                  f"{resultado['old_palabra']} -> {resultado['new_palabra']}")
            return resultado
        print(f"   [ERROR] Error al actualizar palabra: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_update_tema(tema_id):
    """Prueba actualizar un tema"""
    print(f"\n8. Probando actualizar tema {tema_id}...")
    tema_actualizado = {
        'nombre': 'Animales Africanos',
        'descripcion': 'Tema actualizado sobre fauna africana',
        'words': []  # No actualizar palabras aquí
    }
    try:
        response = requests.put(
            f'{BASE_URL}/api/temas/{tema_id}',
            json=tema_actualizado, timeout=5)
        if response.status_code == 200:
            tema_actual = response.json()
            print(f"   [OK] Tema actualizado: {tema_actual['nombre']}")
            print(f"   Descripción: {tema_actual['descripcion']}")
            return tema_actual
        print(f"   [ERROR] Error al actualizar tema: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_replace_palabras(tema_id):
    """Prueba reemplazar todas las palabras"""
    print(f"\n9. Probando reemplazar palabras del tema {tema_id}...")
    nuevas_palabras = {'palabras': [
        'LEON', 'TIGRE', 'ELEFANTE', 'JIRAFA', 'CEBRA', 'RINOCERONTE']}
    try:
        response = requests.put(
            f'{BASE_URL}/api/temas/{tema_id}/palabras',
            json=nuevas_palabras, timeout=5)
        if response.status_code == 200:
            resultado = response.json()
            print(f"   [OK] Palabras reemplazadas: "
                  f"{resultado['old_count']} -> {resultado['new_count']}")
            print(f"   Nuevas palabras: {resultado['palabras']}")
            return resultado
        print(f"   [ERROR] Error al reemplazar palabras: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_delete_palabra(tema_id, index):
    """Prueba eliminar una palabra"""
    print(f"\n10. Probando eliminar palabra en índice {index}...")
    try:
        response = requests.delete(
            f'{BASE_URL}/api/temas/{tema_id}/palabras/{index}', timeout=5)
        if response.status_code == 200:
            resultado = response.json()
            print(f"   [OK] Palabra eliminada: {resultado['deleted_palabra']}")
            print(f"   Palabras restantes: {resultado['remaining_palabras']}")
            return resultado
        print(f"   [ERROR] Error al eliminar palabra: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_delete_tema(tema_id):
    """Prueba eliminar un tema"""
    print(f"\n11. Probando eliminar tema {tema_id}...")
    try:
        response = requests.delete(
            f'{BASE_URL}/api/temas/{tema_id}', timeout=5)
        if response.status_code == 200:
            resultado = response.json()
            print(f"   [OK] Tema eliminado: "
                  f"{resultado.get('message', 'Éxito')}")
            return resultado
        print(f"   [ERROR] Error al eliminar tema: {response.status_code}")
        print(f"   Detalles: {response.text}")
        return None
    except Exception as e:  # pylint: disable=broad-except
        print(f"   [ERROR] Error inesperado: {e}")
        return None


def test_error_cases():
    """Prueba casos de error"""
    print("\n12. Probando casos de error...")

    # Tema con nombre muy corto
    print("   a. Tema con nombre corto...")
    tema_corto = {'nombre': 'A', 'descripcion': 'Test'}
    response = requests.post(
        f'{BASE_URL}/api/temas', json=tema_corto, timeout=5)
    if response.status_code == 422:
        print("     [OK] Correctamente rechazado (nombre corto)")
    else:
        print(f"     [ERROR] Error: debería rechazar nombre corto, "
              f"pero devolvió {response.status_code}")

    # Tema inexistente
    print("   b. Tema inexistente...")
    response = requests.get(
        f'{BASE_URL}/api/temas/inexistente/palabras', timeout=5)
    if response.status_code == 404:
        print("     [OK] Correctamente no encontrado")
    else:
        print(f"     [ERROR] Error: debería devolver 404, "
              f"pero devolvió {response.status_code}")


def main():
    """Función principal de pruebas"""
    print("=== TEST COMPLETO DEL BACKEND - MÓDULO TEMAS ===")
    print("Nota: Asegúrate de que el servidor esté ejecutándose "
          "en http://127.0.0.1:8001")

    # Test de salud
    if not test_health():
        print("\n[ERROR CRITICO] No se puede continuar con las pruebas. "
              "El servidor no está disponible.")
        return

    # Listar temas iniciales
    temas_iniciales = test_list_temas()

    # Crear tema
    tema_creado = test_create_tema()
    if not tema_creado:
        print("\n[ERROR CRITICO] No se pudo crear el tema. "
              "Deteniendo pruebas.")
        return

    tema_id = tema_creado['id']

    # Obtener tema
    test_get_tema(tema_id)

    # Obtener palabras iniciales
    test_get_palabras(tema_id)

    # Agregar palabra
    test_add_palabra(tema_id)

    # Actualizar palabra (índice 0 = 'leon')
    test_update_palabra(tema_id, 0)

    # Actualizar tema
    test_update_tema(tema_id)

    # Reemplazar todas las palabras
    test_replace_palabras(tema_id)

    # Eliminar palabra (índice 0)
    test_delete_palabra(tema_id, 0)

    # Casos de error
    test_error_cases()

    # Eliminar tema
    test_delete_tema(tema_id)

    # Verificación final
    print("\n13. Verificación final...")
    temas_finales = test_list_temas()
    initial_count = len(temas_iniciales) if temas_iniciales else 0
    if temas_finales is not None and len(temas_finales) == initial_count:
        print("   [OK] Estado final correcto - tema eliminado correctamente")
    else:
        print("   [ERROR] Estado final incorrecto")
        print(f"   Debug: temas_finales={temas_finales}, initial_count={initial_count}")

    print("\n=== TEST COMPLETADO ===")
    print("Resumen: Revisa los resultados anteriores para "
          "identificar problemas específicos.")


if __name__ == "__main__":
    main()
