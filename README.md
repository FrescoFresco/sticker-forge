# Pegatinas NFC Studio (mock JSON)

App React (Next.js + TypeScript + Tailwind + shadcn/ui) que recrea **Pegatinas NFC Studio** contra un **store JSON en memoria**. Modelo objetivo: `gpt-image-2-image-to-image` (Kie). Sin Kie/Supabase reales todavía.

Spec de UI: [`docs/SPEC-UI.md`](docs/SPEC-UI.md).

## Pantallas

| Ruta | Función |
|---|---|
| `/` | Entrada — dropzone JSON/ZIP + revisión tabular |
| `/nueva` | Composición manual de pegatina |
| `/procesando` | Cola en vuelo / en cola (tablas) |
| `/resultados` | Listas / revisión / error (grid o tabla) |
| `/generacion/[id]` | Detalle completo (7 pestañas: todo el JSON de la fila) |
| `/estilos` | Catálogo QR + editor + ops + limpiezas |
| `/capacidad` | Reglas del sistema, fases, degradación, escalas |

## Arranque

```bash
npm install
npm run dev
```

Abre [http://127.0.0.1:4322](http://127.0.0.1:4322).

## API mock

| Ruta | Uso |
|---|---|
| `GET /api/estado` | Capacidad completa + cola |
| `GET /api/generaciones` | Listado DTO + vigilancia |
| `GET /api/generacion/:id` | Detalle completo |
| `POST /api/generar` | Alta manual |
| `POST /api/generaciones/:id/regenerar` | Regenerar revisión |
| `POST /api/importar` | Importar JSON/ZIP |
| `GET/POST /api/estilos-qr` | Catálogo |
| `PATCH/DELETE /api/estilos-qr/:id` | Actualizar / archivar |
| `GET/POST /api/store` | Inspeccionar / reset seed |

Ejemplo: `public/ejemplos/generacion-ejemplo.json`.

## Notas

- Persistencia: memoria del proceso (se pierde al reiniciar).
- Cola global máx. 3 en vuelo.
- En mock, Detalle muestra internos (prompt, task_id, leases).
- Claves reales de API nunca van a la UI.
