"""Debug script for testing word update functionality."""

import requests  # pylint: disable=import-error

BASE_URL = 'http://127.0.0.1:8000'

print('=== DEBUG TEST PARA ACTUALIZACIÓN DE PALABRAS ===')

# 1. Crear tema simple
print('1. Creando tema...')
tema_data = {'nombre': 'Test Debug', 'words': ['leon', 'tigre']}
resp = requests.post(f'{BASE_URL}/api/temas', json=tema_data, timeout=5)

if resp.status_code != 200:
    print(f'   ERROR al crear tema: {resp.status_code} - {resp.text}')
    exit()

tema = resp.json()
tema_id = tema['id']
print(f'   Tema creado: {tema_id}')
print(f'   Palabras iniciales: {tema["words"]}')

# 2. Intentar actualizar 'leon' a 'leopardo'
print('\n2. Actualizando leon -> leopardo...')
update_data = {'palabra': 'leopardo'}
resp = requests.put(f'{BASE_URL}/api/temas/{tema_id}/palabras/0', json=update_data, timeout=5)

print(f'   Status: {resp.status_code}')
print(f'   Response: {resp.text}')

# 3. Si hay error, verificar qué palabras hay
if resp.status_code != 200:
    print('\n3. Verificando estado actual del tema...')
    resp_check = requests.get(f'{BASE_URL}/api/temas/{tema_id}/palabras', timeout=5)
    if resp_check.status_code == 200:
        palabras = resp_check.json()
        print(f'   Palabras actuales: {palabras}')

# 4. Limpiar
print('\n4. Limpiando...')
resp = requests.delete(f'{BASE_URL}/api/temas/{tema_id}', timeout=5)
print(f'   Status: {resp.status_code}')

print('\n=== DEBUG COMPLETADO ===')
