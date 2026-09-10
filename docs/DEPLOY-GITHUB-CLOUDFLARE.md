# Deploy: GitHub → Cloudflare Pages

## 1. Crear el repositorio GitHub

Este proyecto empezó sin repo GitHub vinculado.
En Cursor, usa **Create repo** para crear/conectar el repositorio real en GitHub.
A partir de ahí trabajamos sobre ese remoto.

## 2. Icono NFC

1. Pon el PNG en `public/nfc.png`
2. Commit y push a `main`
3. Tras el deploy, la URL será:

```bash
ICONO_NFC_URL=https://<tu-proyecto>.pages.dev/nfc.png
```

## 3. Cloudflare Pages

1. Cloudflare Dashboard → Workers & Pages → Create → Pages
2. Conectar el repo de GitHub
3. Build settings (Next.js):
   - Framework preset: Next.js
   - Build command: `npx @cloudflare/next-on-pages` **o** el preset oficial Next de Pages
   - Output: según el adapter que elijamos en el siguiente paso
4. Variables de entorno (Production):

```bash
KIE_API_KEY=...
URL_PUBLICA=https://<tu-proyecto>.pages.dev
ICONO_NFC_URL=https://<tu-proyecto>.pages.dev/nfc.png
```

> Nota: el adapter exacto de Next en Cloudflare lo dejamos listo en el siguiente paso
> (OpenNext / @cloudflare/next-on-pages). Primero: repo GitHub + icono en `public/`.

## 4. Orden de trabajo recomendado

```
Create repo (GitHub)
    → subir public/nfc.png
    → configurar Cloudflare Pages
    → env Kie + URL_PUBLICA + ICONO_NFC_URL
    → prueba de generación real
```
