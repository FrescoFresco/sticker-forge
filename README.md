# Pegatinas NFC Studio / sticker-forge

App React (Next.js) para pegatinas NFC. Repo: **sticker-forge**.

- Local / mock: store JSON en memoria
- Con `KIE_API_KEY`: Kie `gpt-image-2-image-to-image`
- Deploy: **GitHub → Cloudflare Workers** (OpenNext)

Spec UI: [`docs/SPEC-UI.md`](docs/SPEC-UI.md).  
Deploy: [`docs/DEPLOY-GITHUB-CLOUDFLARE.md`](docs/DEPLOY-GITHUB-CLOUDFLARE.md).

## Pantallas

| Ruta | Función |
|---|---|
| `/` | Entrada — dropzone JSON/ZIP + revisión tabular |
| `/nueva` | Composición manual |
| `/procesando` | Cola en vuelo / en cola |
| `/resultados` | Listas / revisión / error |
| `/generacion/[id]` | Detalle completo (7 pestañas) |
| `/estilos` | Catálogo QR |
| `/capacidad` | Reglas + `kie_modo` real/mock |

## Arranque

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev
```

Abre [http://127.0.0.1:4322](http://127.0.0.1:4322).

## Kie real (`gpt-image-2-image-to-image`)

En `.env.local`:

```bash
KIE_API_KEY=sk-...
URL_PUBLICA=https://tu-dominio-publico   # callbacks + absolutizar proxies
ICONO_NFC_URL=https://.../nfc.png        # URL https absoluta
```

Flujo:

1. Al reclamar cola → `POST /api/v1/jobs/createTask`
2. Vigilancia / `POST /api/aviso-kie` → `GET recordInfo?taskId=`
3. Si `success` → guarda `resultUrls`; modo `ninguno` → `listo`; con QR → sigue fases de corrección (aún mock local)

Sin `KIE_API_KEY` todo sigue en mock. Capacidad muestra `kie_modo: mock|real`.

## API

| Ruta | Uso |
|---|---|
| `GET /api/estado` | Capacidad + cola + `kie_modo` |
| `GET /api/generaciones` | Listado + vigilancia |
| `GET /api/generacion/:id` | Detalle completo |
| `POST /api/generar` | Alta manual |
| `POST /api/generaciones/:id/regenerar` | Regenerar |
| `POST /api/importar` | Importar |
| `POST /api/aviso-kie` | Callback Kie (señal → reconsulta) |
| `GET/POST /api/estilos-qr` | Catálogo |
| `PATCH/DELETE /api/estilos-qr/:id` | Actualizar / archivar |
| `GET/POST /api/store` | Store / reset |

## Notas

- Persistencia mock: memoria del proceso.
- Cola máx. 3 en vuelo.
- Pipeline QR (detección/proyección real) aún no; post-Kie usa fases mock.
- Nunca exponer `KIE_API_KEY` al navegador.
