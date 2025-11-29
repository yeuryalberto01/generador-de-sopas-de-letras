# Sopa de Letras IA - Panel de Control

Este proyecto cuenta con un **Lanzador Inteligente ("Launcher on Steroids")** que gestiona todos los servicios automáticamente.

## 🚀 Cómo Iniciar
Simplemente ejecuta el archivo:
`iniciar_sistema.bat`

Esto abrirá el **Smart Launcher v2.0**, que incluye:
- **Dashboard**: Estado en tiempo real de CPU/RAM.
- **Smart Start**: Botón único para iniciar Backend y Frontend.
- **Terminal**: Logs en vivo de ambos servicios.
- **Gestión de Puertos**: Libera automáticamente los puertos 8000 y 5173 si están ocupados.

## Archivos Importantes
- `launcher.py`: El código fuente del lanzador avanzado (Python + CustomTkinter).
- `backend/`: Código del servidor API (FastAPI).
- `Creador-de-sopas-de-letras-Ultra-IA/`: Código del Frontend (React + Vite).

## Notas
- El lanzador antiguo (`launcher_gui.py`) ha sido eliminado para evitar confusiones.
- El sistema usa el puerto **8000** para el Backend y **5173** para el Frontend.
