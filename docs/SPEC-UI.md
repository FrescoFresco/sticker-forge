# Spec — Pegatinas NFC Studio (UI + dominio JSON-first)

Documento de planning para reconstruir la aplicación **bien**, alineada al dominio real (gpt-image-2 en Kie), con **todo el JSON visible en UI** y sin copiar la metáfora de otras apps.

Estado actual del repo: mock Next.js funcional pero UI prestada / incompleta. Este spec autoriza **tirar la UI actual** y reconstruir sobre el store/API si encajan; si no, rehacer también dominio mock.

---

## 0. Objetivo

Construir una app React (Next.js + TypeScript + Tailwind + shadcn) que:

1. Represente el software **Pegatinas NFC**, no otra herramienta.
2. Exponga **todo el JSON del dominio** en alguna superficie de UI.
3. Use **tablas** donde el escaneo importa; **visuales/bloques** donde la tabla se ve mal.
4. Mantenga contratos listos para sustituir el mock por Supabase + Kie reales.
5. Sea adaptable desktop/móvil.

No-goals de esta fase:

- Integración real Kie/Supabase.
- Auth multiusuario.
- Catálogo de prompts (solo placeholder visible “no implementado”).

---

## 1. Principios de producto

| # | Principio |
|---|---|
| P1 | Home = meter trabajo (soltar/subir). Formulario manual = flujo aparte. |
| P2 | Procesando ≠ Resultados. Cola viva separada de galería/histórico. |
| P3 | Nada “solo en servidor”: si existe en JSON, tiene sitio en UI. |
| P4 | Tablas para conjuntos homogéneos; cards/preview para imagen; `<pre>`/bloque para textos largos. |
| P5 | Detalle de generación = ficha completa (toda la fila JSON). |
| P6 | Estilos QR y Capacidad son secundarios, no ensucian Entrada. |
| P7 | Lenguaje del dominio: pegatina, generación, cola, fase QR, revisión — nunca “descubrir sitio”. |
| P8 | Mock JSON-first; mismos DTO/rutas que el sistema real documentado. |

---

## 2. Arquitectura de información

```
App shell
├── Entrada              (home)
│   ├── Dropzone
│   ├── Revisión lote (tabla)
│   └── CTA → Nueva pegatina
├── Procesando           (tabla cola)
├── Resultados           (toggle Grid | Tabla)
├── Detalle /:id         (7 pestañas; no es tab global)
├── Nueva /nueva         (composición)
├── Estilos QR           (catálogo tabla + editor)
└── Capacidad            (reglas/tablas del sistema)
```

Navegación:

- Desktop: top tabs Entrada | Procesando | Resultados + links Estilos / Capacidad.
- Móvil: bottom nav Entrada | Proc. | Result. ; Estilos/Capacidad en menú.

Badge de cola global siempre visible: `en_vuelo / max`.

---

## 3. Qué va en tabla vs no

### Tablas (obligatorio)

| Superficie | Columnas mínimas |
|---|---|
| Revisión importación | #, archivo, negocio, agencia, qr_modo, manifest, estado, error |
| Procesando · en vuelo | negocio, estado, fase, %, intentos, task/lease, formato, modo |
| Procesando · en cola | negocio, estado, origen, archivo, creado_en |
| Resultados (vista tabla) | negocio, estado, modo, formato, coste, motivo, acciones |
| Estilos catálogo | nombre, version, logo, actualizado, archivado, acciones |
| Ops estilos | id, tipo, estado, version_esperada, TTL |
| Limpiezas | id, target, path, estado |
| Detalle · Entradas | rol, hay, origen, proxy/nota |
| Detalle · Kie | clave / valor |
| Detalle · ajustes QR | #, ajuste, resultado |
| Detalle · zona_final | #, x, y |
| Capacidad | fases, degradación, escalas (3 tablas) |

### No tabla

| Pieza | Presentación |
|---|---|
| Dropzone | zona dashed |
| Preview logo/moodboard/resultado/QR | imagen |
| prompt_enviado | bloque scroll |
| Request JSON / JSON completo | `<pre>` colapsable |
| Editor estilo QR | form + preview live |
| Confirmar gasto | checkbox + modal |
| Zona QR sobre imagen | canvas/overlay + tabla de puntos al lado |

---

## 4. Cobertura JSON → UI

| Bloque JSON | Dónde se ve |
|---|---|
| `config` / límites / formatos / fases / escalas | Capacidad |
| `cola.*` | header + Procesando |
| `generaciones[]` resumen | Procesando / Resultados |
| `generaciones[]` completo | Detalle (7 tabs) |
| `prompt_enviado`, familia, input_urls | Detalle → Prompt |
| `kie.*`, reserva, timings | Detalle → Kie + fila Procesando |
| `qr_*`, snapshot, zona, ajustes, intentos | Detalle → QR + Procesando |
| `resultados` original/final | Detalle → Resultado + Resultados grid |
| `estilos_qr[]` | Estilos |
| `estilos_qr_operaciones[]` / limpiezas | Estilos (sección inferior) |
| `importaciones` / ops / tokens TTL | Entrada revisión |
| `requests.generar` | Nueva (preview request) |
| `regenerar {confirmarGasto}` | Modal desde Resultados/Detalle |
| `futuro.prompt_sets` | Capacidad → “No implementado” |
| secretos reales (API keys) | **nunca** en UI |

En mock, campos internos (task_id, lease, prompt) **sí se muestran**. En producción real se podrá gating por modo debug; el layout ya reserva el sitio.

---

## 5. Spec por pantalla

### 5.1 Entrada (`/`)

- Dropzone JSON/ZIP/lote.
- CTA secundario: `+ Nueva pegatina`.
- Tras archivos: tabla revisión + meta de operación (id, estado, TTL, uploads).
- Acciones: Cancelar op | Encolar N válidas.
- Errores por fila; no tumbar el lote.

### 5.2 Nueva pegatina (`/nueva`)

Formulario de composición:

- negocio, agencia, aspecto, resolución, estilo_texto
- logo / estilo (nuevo | heredarDe)
- qr_modo + url_qr + validación
- estilo QR (select catálogo + editar) + logo QR
- confirmar gasto si artístico
- preview request JSON colapsable
- submit → 202 → navegar a Procesando

### 5.3 Procesando (`/?tab=procesando` o `/procesando`)

- Resumen cola (max, en_vuelo, pendientes, lock, modelo).
- Tabla EN VUELO + tabla EN COLA.
- Poll ~2.5s (mock tick).
- Click fila → `/generacion/[id]`.

### 5.4 Resultados

- Toggle Grid | Tabla.
- Grid: preview + estado + acciones.
- Tabla: columnas densas + motivo.
- Acciones: Abrir, Exportar, Regenerar (solo revision_necesaria).

### 5.5 Detalle (`/generacion/[id]`)

Tabs:

1. **Resumen** — identidad, estado, fechas, origen, chips de artefactos  
2. **Entradas** — tabla de roles + thumbs  
3. **Prompt** — familia, orden urls, bloque prompt_enviado  
4. **Kie** — tabla clave/valor + input_enviado  
5. **QR** — snapshot, intentos, ajustes tabla, zona visual + puntos  
6. **Resultado** — original/final, descargar, exportar, regenerar  
7. **JSON** — objeto completo lectura  

### 5.6 Estilos QR (`/estilos`)

- Tabla catálogo | panel editor (form+preview).
- Sección Operaciones (tabla).
- Sección Limpiezas (tabla).
- Acciones: crear, guardar, duplicar, archivar.

### 5.7 Capacidad (`/capacidad`)

- Modelo, cola_max, formatos, resoluciones, modos QR, límites.
- Tablas: fases, degradación, escalas.
- Límites artístico 3+3.
- Bloque futuro prompts vacío.

---

## 6. Dominio / API mock (contratos)

Mantener o completar:

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/estado` | capacidades + cola |
| GET | `/api/generaciones` | listado + vigilancia |
| GET | `/api/generacion/:id` | detalle (DTO + internos mock) |
| POST | `/api/generar` | alta manual |
| POST | `/api/generaciones/:id/regenerar` | `{confirmarGasto:true}` |
| POST | `/api/importar` | preparar/encolar mock |
| GET/POST | `/api/store` | inspeccionar/reset seed |
| GET/POST/PATCH/DELETE | `/api/estilos-qr*` | catálogo (ampliar si falta) |

Ampliar el store seed hasta cubrir el JSON completo del doc (ops, limpiezas, zona_final, kie, etc.), no solo el subset actual.

Invariantes mock:

- max 3 en vuelo
- fases por modo QR
- nunca `listo` con QR inválido en escenarios de revisión
- regeneración idempotente por id hijo determinista
- DTO público documentado; en Detalle/JSON se puede ver el objeto interno mock

---

## 7. Stack y UI kit

- Next.js App Router + TypeScript
- Tailwind + shadcn/ui (Button, Table, Tabs, Card, Input, Badge, Sheet, Dialog, Checkbox, Progress…)
- Estética: dashboard neutro tipo Vercel/shadcn (sidebar o top rail sobrio), **sin** copiar copy de otras apps
- Tipografía: Geist (ya en scaffold) OK para tool UI
- Responsive: tablas con scroll horizontal en móvil o card-row equivalente a la misma fila de datos

---

## 8. Plan de ejecución por agentes

Trabajo en **4 tracks paralelos** + integración. Un agente = un track. No mezclar responsabilidades.

```
                    ┌─────────────────────┐
                    │ 0. Lead / Spec lock │
                    │  (este documento)   │
                    └──────────┬──────────┘
           ┌─────────┬─────────┼─────────┬─────────┐
           ▼         ▼         ▼         ▼         ▼
        A Dominio  B Shell   C Flujos  D Detalle  E Estilos
        store/API  nav/layout Entrada/  + Capacid. + ops
                              Proc/Res
           └─────────┴─────────┴─────────┴─────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ F. Integración QA   │
                    │ visual + contratos  │
                    └─────────────────────┘
```

### Track 0 — Lead (humano/agente coordinador)

- Congelar este spec.
- Decidir wipe UI vs refactor (recomendado: **wipe `src/components/*` de producto**, conservar `src/lib` si se amplía).
- Definir branch `cursor/ui-rebuild-f7ae` si se quiere aislar; por defecto cloud: seguir `main`.
- Definition of Done global (sección 10).

### Track A — Dominio JSON completo

**Owner:** agente backend/mock  
**Entrega:**

- Ampliar `types.ts`, `seed.ts`, `store.ts` al JSON completo.
- Endpoints faltantes (estilos CRUD, detalle con internos, export).
- Tests unitarios ligeros de cola, import lote, regenerar, degradación→revisión.

**No toca:** componentes UI.

### Track B — App shell + design tokens

**Owner:** agente UI foundation  
**Entrega:**

- Layout responsive, nav, badge cola, tipografía, tabla base, empty states.
- Componentes: `DataTable`, `PageHeader`, `QueueBadge`, `StatusBadge`.
- Sin páginas de negocio aún (stubs).

### Track C — Entrada + Procesando + Resultados

**Owner:** agente UI flujos principales  
**Depende de:** A (contratos), B (primitives)  
**Entrega:**

- `/` Entrada + revisión tabla + import.
- `/nueva` composición + request preview.
- Procesando tablas en vuelo/cola + poll.
- Resultados grid/tabla toggle + regenerar modal.

### Track D — Detalle generación + Capacidad

**Owner:** agente UI profundidad  
**Depende de:** A, B  
**Entrega:**

- `/generacion/[id]` con 7 tabs y cobertura JSON total.
- `/capacidad` con tablas de reglas + futuro vacío.

### Track E — Estilos QR

**Owner:** agente UI catálogo  
**Depende de:** A, B  
**Entrega:**

- `/estilos` tabla + editor + ops + limpiezas.
- Preview QR mock (canvas o SVG simple; no hace falta decodificar real en mock).

### Track F — Integración / QA

**Owner:** agente QA + computerUse  
**Depende de:** C, D, E  
**Entrega:**

- Checklist sección 10 pasado.
- Screenshots desktop+móvil de las 7 superficies.
- Lista de gaps JSON (debe ser vacía).
- Commit final + README actualizado.

---

## 9. Orden temporal recomendado

| Fase | Qué | Paralelo |
|---|---|---|
| F0 | Lock spec + wipe UI producto | — |
| F1 | Track A + Track B | sí |
| F2 | Track C + D + E | sí, tras F1 |
| F3 | Track F QA + polish | — |
| F4 | (Futuro) adapters Kie/Supabase | fuera de este spec |

Estimación de complejidad (no calendario):  

- F1 invasivo en tipos/store + foundation.  
- F2 mayor superficie UI.  
- F3 riesgo de gaps de cobertura JSON.

---

## 10. Definition of Done

- [ ] Navegación Entrada / Procesando / Resultados / Estilos / Capacidad
- [ ] Dropzone + revisión tabular de lote con errores aislados
- [ ] Nueva pegatina completa + preview request
- [ ] Procesando 100% tabular con fase/intentos/task/lease visibles
- [ ] Resultados con toggle Grid|Tabla
- [ ] Detalle con 7 tabs; ningún campo del JSON de generación sin sitio
- [ ] Estilos: catálogo tabla + editor + ops + limpiezas
- [ ] Capacidad: límites + 3 tablas de reglas + futuro prompts
- [ ] Cola máx 3 respetada en mock
- [ ] Regeneración solo desde revision_necesaria con confirmarGasto
- [ ] Responsive usable en móvil (nav inferior + tablas scrolleables)
- [ ] README: cómo correr, mapa de pantallas, qué es mock
- [ ] Sin copy/metáforas de otras apps (“Descubrir sitio”, etc.)
- [ ] QA computerUse con evidencia visual

---

## 11. Wipe / migración del código actual

**Recomendación:**

1. Conservar: `package.json` deps útiles, shadcn ui primitives, `src/lib/utils.ts`.
2. Ampliar fuerte: `types`, `seed`, `store`, API routes.
3. Reemplazar: `operacion-client`, `app-shell` actual, pages de producto.
4. No reutilizar copy ni layout “Descubrir / Operación prestada”.

Si el store actual queda corto frente al JSON completo, Track A lo reescribe sin miedo; la UI nueva no debe acoplarse a campos a medias.

---

## 12. Prompts listos para lanzar agentes

### Agente A — Dominio

> Amplía el dominio mock de Pegatinas NFC Studio según `docs/SPEC-UI.md` §§4–6. Completa types/seed/store/API para el JSON completo (cola, kie, qr zona, ops import/estilos, limpiezas). Añade tests de invariantes. No construyas UI.

### Agente B — Shell

> Implementa app shell + primitives (`DataTable`, badges, layout responsive) según `docs/SPEC-UI.md` §§2,5,7. Stubs de rutas vacías. Estética shadcn/Vercel neutra. Sin copy de otras apps.

### Agente C — Flujos

> Implementa Entrada, Nueva, Procesando, Resultados según §§3,5.1–5.4. Tablas obligatorias en import y procesando. Toggle grid/tabla en resultados. Usa APIs del Track A.

### Agente D — Detalle + Capacidad

> Implementa `/generacion/[id]` (7 tabs) y `/capacidad` según §§5.5,5.7 y cobertura §4. Todo campo de una generación debe verse.

### Agente E — Estilos

> Implementa `/estilos` con tabla catálogo, editor, ops y limpiezas (§5.6).

### Agente F — QA

> Ejecuta DoD §10. computerUse desktop+móvil. Reporta gaps. No añadas features.

---

## 13. Riesgos

| Riesgo | Mitigación |
|---|---|
| UI otra vez genérica/copiada | Checklist P7 + QA copy |
| JSON incompleto en seed | Track A primero; Detalle bloqueado hasta seed rico |
| Tablas ilegibles en móvil | patrón card-row = mismas columnas |
| Scope creep Kie real | fuera de DoD |
| Doble fuente de verdad UI/store | solo APIs; nada de estado inventado en cliente |

---

## 14. Decisión pendiente (mínima)

Antes de F0, confirmar una sola cosa:

> ¿Wipe de UI de producto y rebuild según este spec? **Sí (recomendado).**

Con ese sí, se lanzan A∥B y después C∥D∥E.
