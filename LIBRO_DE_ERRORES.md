# 📕 Libro de Errores y Mejoras

Registro único para documentar errores conocidos, acciones correctivas y mejoras entregadas. **Leer este documento antes de iniciar cualquier mejora** y **actualizarlo al cerrar un incidente o completar una mejora**.

---

## ✅ Cómo usar este libro

1. **Previo a cualquier cambio** revisa la tabla de errores para entender incidentes abiertos o patrones que ya se resolvieron.
2. **Al detectar un error** agrega una entrada con el identificador, contexto y pasos de reproducción.
3. **Cuando entregues una mejora o fix** actualiza la entrada con la resolución y la fecha. Si es un caso nuevo, crea una fila completamente nueva.
4. Incluye enlaces o rutas de archivos relevantes para acelerar futuros diagnósticos.

> _Si una mejora no queda documentada aquí se considera incompleta._

---

## 📋 Registro de errores y mejoras

| ID | Fecha detección | Módulo / Área | Descripción del error | Impacto | Estado | Resolución / Fecha |
|----|-----------------|---------------|-----------------------|---------|--------|--------------------|
| ERR-001 | 2025-11-14 | API / Frontend | Requests iban a `/api/api/db/*` provocando 500. | Bloqueante | ✅ Resuelto | Ajustar `apiEndpoints.ts` y `BookContext` para usar `/api/db/*`. (2025-11-14) |
| ERR-002 | 2025-11-14 | Frontend / Config | Vite apuntaba a backend en `8001` mientras el server corría en `8000`. | Bloqueante | ✅ Resuelto | `vite.config.js` ahora lee `VITE_BACKEND_HOST/PORT`. (2025-11-14) |
| ERR-003 | 2025-11-14 | React Components | Componentes `.jsx` sin `import React` lanzaban “React is not defined”. | Alto | ✅ Resuelto | Se añadió la importación en todos los `.jsx` afectados. Ver commit del 14/11. |
| ERR-004 | 2025-11-14 | Libros UI | Command Palette ejecutaba comandos aunque estuviera cerrada (Enter enviaba a Home). | Medio | ✅ Resuelto | Listener ignora eventos si la paleta está cerrada. (2025-11-14) |
| ERR-005 | 2025-11-14 | Backend Availability | 404/HTML al llamar `/api/db/*` cuando el backend no está activo. | Bloqueante | 🔄 Abierto | Documentar: siempre iniciar `uvicorn main:app --port 8000` o `launcher.ps1` antes de usar la app. |
| ERR-006 | 2025-11-14 | Backend / DB | Modelos de BD guardaban layouts y recursos como cadenas/bytes, dificultando el editor. | Alto | ✅ Resuelto | `database.py` usa JSON/JSONB y rutas para recursos; `main.py` y esquemas actualizados. (2025-11-14) |

> **Formato recomendado para nuevos registros:** `ERR-00X`, fecha en ISO (AAAA-MM-DD) y descripción corta orientada al síntoma.

---

## 🛠︎ Plantilla para agregar errores

Copiar y pegar la tabla siguiente en la sección de registro, rellenando los campos:

```
| ERR-00X | AAAA-MM-DD | Área | Descripción breve | Impacto (Bajo/Medio/Alto/Bloqueante) | Estado (🔄/✅) | Acción tomada + fecha |
```

---

## 📌 Reglas obligatorias

1. **Lectura obligatoria**: antes de tocar código, revisar este documento para conocer errores abiertos.
2. **Actualización obligatoria**: cualquier fix o mejora debe reflejarse aquí (nueva fila o actualización de estado).
3. **Sin registro ≙ sin entrega**: si un cambio no aparece en el libro, se considerará pendiente.

Mantener este libro al día ahorra tiempo de diagnóstico y asegura trazabilidad completa de fallos y mejoras.
