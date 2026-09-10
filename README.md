# Pegatinas NFC Studio (mock JSON)

App React (Next.js + TypeScript + Tailwind + shadcn/ui) que recrea el flujo de **Pegatinas NFC Studio** contra un **store JSON en memoria**. No llama a Kie ni a Supabase todavía; el modelo objetivo sigue siendo `gpt-image-2-image-to-image` dentro de Kie.

## Qué incluye

- UI adaptable (sidebar en desktop, sheet en móvil)
- Pestañas **Crear / Procesando / Listas**
- Dropzone para `.json` / `.zip`
- Alta manual de generaciones
- Cola mock (máx. 3 en vuelo) con fases QR
- Regeneración desde `revision_necesaria`
- Catálogo de estilos QR (lectura)
- Panel **Sistema** para inspeccionar/resetear el store

## Arranque

```bash
npm install
npm run dev -- --port 4322 --hostname 127.0.0.1
```

Abre [http://127.0.0.1:4322](http://127.0.0.1:4322).

## API mock

| Ruta | Uso |
|---|---|
| `GET /api/estado` | Capacidades + cola |
| `GET /api/generaciones` | Listado + vigilancia |
| `GET /api/generacion/:id` | Detalle DTO |
| `POST /api/generar` | Crear generación |
| `POST /api/generaciones/:id/regenerar` | Regenerar revisión |
| `POST /api/importar` | Importar JSON/ZIP |
| `GET/POST /api/store` | Ver / resetear store |

Ejemplo de importación: `public/ejemplos/generacion-ejemplo.json`.

## Notas

- Persistencia actual: memoria del proceso Node (se pierde al reiniciar el server).
- El DTO público no expone `prompt_enviado` ni task IDs.
- Cuando se conecte lo real, se sustituyen los adapters del store; la UI y los contratos pueden quedarse.
