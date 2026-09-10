# Deploy: GitHub (sticker-forge) → Cloudflare Workers

La app Next.js usa **OpenNext** (`@opennextjs/cloudflare`).
GitHub guarda el código; Cloudflare **ejecuta** la app.

```
push a main (GitHub)
        │
        ▼
Cloudflare Workers Builds
        │
        ▼
Worker: sticker-forge
URL pública → Kie callbacks + ICONO_NFC_URL
```

## 1. Repo

- Codebase: https://cursor.com/codebase/francescofabbri/sticker-forge
- Icono NFC: coloca `public/nfc.png` y haz push.

## 2. Conectar en Cloudflare (dashboard)

1. Entra en [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages**
2. **Create** → **Workers** → **Import a repository** / conecta GitHub (o Origin según tu cuenta)
3. Elige el repo **sticker-forge**
4. Build settings:

| Campo | Valor |
|---|---|
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Si el asistente de Cloudflare detecta Next + OpenNext, acepta el preset.

5. **Variables y secretos** (Production + Build):

```bash
KIE_API_KEY=***          # secreto
URL_PUBLICA=https://sticker-forge.<tu-subdominio>.workers.dev
ICONO_NFC_URL=https://sticker-forge.<tu-subdominio>.workers.dev/nfc.png
```

> Ajusta `URL_PUBLICA` / `ICONO_NFC_URL` a la URL real que te dé Cloudflare tras el primer deploy.

6. Deploy / Save → espera el build verde.

## 3. Alternativa local (CLI)

Si prefieres desplegar desde tu máquina (con Wrangler logueado):

```bash
origin repo clone francescofabbri/sticker-forge
cd sticker-forge
cp .env.example .dev.vars   # o crea .dev.vars
# edita .dev.vars con KIE_API_KEY, URL_PUBLICA, ICONO_NFC_URL
npm install
npm run deploy
```

## 4. Comprobar

- Abre la URL del Worker
- Capacidad → debe mostrar `kie_modo: real` si hay `KIE_API_KEY`
- `https://TU_URL/nfc.png` debe servir el icono

## Archivos de este repo

- `wrangler.jsonc` — Worker `sticker-forge`
- `open-next.config.ts` — adapter OpenNext
- `public/_headers` — cache de estáticos
- scripts: `preview`, `deploy`, `upload`
