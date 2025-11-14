#!/usr/bin/env python3
"""
Servidor HTTP básico para desarrollo del frontend
"""

import json
import http.server
import socketserver
from urllib.parse import urlparse
from datetime import datetime
import uuid

PORT = 8001

# Datos de ejemplo
TEMAS = [
    {
        "id": "tema-1",
        "nombre": "Frutas Tropicales",
        "descripcion": "Tema con frutas exóticas",
        "palabras": [{"texto": "piña"}, {"texto": "mango"}, {"texto": "papaya"}],
        "categoria": "frutas",
        "etiquetas": ["tropical", "exotico"],
        "dificultad": "facil",
        "created_at": "2025-11-13T00:00:00Z",
        "updated_at": "2025-11-13T00:00:00Z"
    },
    {
        "id": "tema-2",
        "nombre": "Animales de la Selva",
        "descripcion": "Animales que viven en la selva",
        "palabras": [{"texto": "tigre"}, {"texto": "mono"}, {"texto": "jaguar"}],
        "categoria": "animales",
        "etiquetas": ["selva", "salvaje"],
        "dificultad": "medio",
        "created_at": "2025-11-13T00:00:00Z",
        "updated_at": "2025-11-13T00:00:00Z"
    }
]

LIBROS = [
    {
        "id": "libro-1",
        "nombre": "Mi Libro de Frutas",
        "descripcion": "Un libro educativo sobre frutas",
        "plantilla": "infantil",
        "created_at": "2025-11-13T00:00:00Z",
        "updated_at": "2025-11-13T00:00:00Z"
    }
]

class RequestHandler(http.server.BaseHTTPRequestHandler):
    """Manejador de solicitudes HTTP para el servidor básico de desarrollo."""

    def send_cors_headers(self):
        """Envía los headers de CORS para permitir solicitudes desde el frontend."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_GET(self):
        """Maneja solicitudes GET para endpoints de la API."""
        parsed_path = urlparse(self.path)

        # CORS headers
        self.send_cors_headers()

        # Routing logic
        if parsed_path.path == '/api/health':
            self.send_json_response(200, {"status": "ok", "message": "Basic API Server Running"})
        elif parsed_path.path == '/api/db/temas':
            self.send_json_response(200, TEMAS)
        elif parsed_path.path == '/api/db/libros':
            self.send_json_response(200, LIBROS)
        elif parsed_path.path.startswith('/api/db/temas/'):
            self._handle_tema_get(parsed_path)
        elif parsed_path.path.startswith('/api/db/libros/'):
            self._handle_libro_get(parsed_path)
        else:
            self.send_json_response(404, {"error": "Endpoint no encontrado"})

    def _handle_tema_get(self, parsed_path):
        """Maneja solicitudes GET para temas individuales."""
        tema_id = parsed_path.path.split('/')[-1]
        tema = next((t for t in TEMAS if t["id"] == tema_id), None)
        if tema:
            self.send_json_response(200, tema)
        else:
            self.send_json_response(404, {"error": "Tema no encontrado"})

    def _handle_libro_get(self, parsed_path):
        """Maneja solicitudes GET para libros."""
        parts = parsed_path.path.strip('/').split('/')
        if len(parts) >= 3:
            libro_id = parts[2]
            if len(parts) == 4 and parts[3] == 'paginas':
                self.send_json_response(200, {"paginas": [], "total_paginas": 0})
            else:
                libro = next((l for l in LIBROS if l["id"] == libro_id), None)
                if libro:
                    self.send_json_response(200, libro)
                else:
                    self.send_json_response(404, {"error": "Libro no encontrado"})
        else:
            self.send_json_response(404, {"error": "Ruta no encontrada"})

    def do_POST(self):
        """Maneja solicitudes POST para crear nuevos recursos."""
        parsed_path = urlparse(self.path)

        # CORS headers
        self.send_cors_headers()

        # Leer el body
        content_length_header = self.headers.get('Content-Length')
        content_length = int(content_length_header) if content_length_header else 0
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'

        try:
            data = json.loads(post_data.decode('utf-8')) if post_data else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            data = {}

        if parsed_path.path == '/api/db/temas':
            new_tema = {
                "id": str(uuid.uuid4()),
                "nombre": data.get("nombre", ""),
                "descripcion": data.get("descripcion"),
                "palabras": data.get("palabras", []),
                "categoria": data.get("categoria"),
                "etiquetas": data.get("etiquetas", []),
                "dificultad": data.get("dificultad", "medio"),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "updated_at": datetime.utcnow().isoformat() + "Z"
            }
            TEMAS.append(new_tema)
            self.send_json_response(201, new_tema)

        elif parsed_path.path == '/api/db/libros':
            new_libro = {
                "id": str(uuid.uuid4()),
                "nombre": data.get("nombre", ""),
                "descripcion": data.get("descripcion"),
                "plantilla": data.get("plantilla", "basico"),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "updated_at": datetime.utcnow().isoformat() + "Z"
            }
            LIBROS.append(new_libro)
            self.send_json_response(201, new_libro)

        else:
            self.send_json_response(404, {"error": "Endpoint no encontrado"})

    def do_OPTIONS(self):
        """Maneja solicitudes OPTIONS para CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json_response(self, status_code, data):
        """Envía una respuesta JSON con el código de estado especificado."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        response_data = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_data.encode('utf-8'))

    def log_message(self, format, *args):  # pylint: disable=redefined-builtin
        """Silencia los logs del servidor para reducir ruido en desarrollo."""
        return

def run_server():
    """Ejecuta el servidor HTTP básico en el puerto especificado."""
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        print("🚀 Starting Basic HTTP Development Server...")
        print(f"📡 API available at: http://127.0.0.1:{PORT}")
        print("📚 Sample data loaded:")
        print(f"   - {len(TEMAS)} temas")
        print(f"   - {len(LIBROS)} libros")
        print("   Press Ctrl+C to stop")
        print()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Server stopped by user")
        except (OSError, socketserver.socket.error) as e:
            print(f"Server error: {e}")

if __name__ == '__main__':
    run_server()
