import { randomUUID } from "crypto";
import { getKieModel, isKieReal } from "./config";
import {
  callbackUrlKie,
  consultarTareaKie,
  crearTareaKie,
  isoFromKieTime,
  puedeLlamarKieConUrls,
} from "./kie";
import {
  ESTILO_QR_DEFAULT,
  SEED_STORE,
  buildInputsFor,
  emptyFencing,
  emptyKie,
  emptyResultados,
} from "./seed";
import { guardarEntradaAssets } from "./entrada-assets";
import { parsePegatinaZip } from "./zip-import";
import type {
  AppStore,
  Capacidades,
  CapacidadesCompletas,
  DegradacionStep,
  EscalaCatalogEntry,
  EstiloQr,
  EstiloQrCreatePayload,
  EstiloQrUpdatePayload,
  FaseCatalogEntry,
  FaseQr,
  Generacion,
  GeneracionDetalle,
  GeneracionDto,
  GenerarPayload,
  ImportPreviewItem,
  QrAjusteAplicado,
  QrModo,
  QrZonaFinal,
} from "./types";

const FORMATOS = [
  "circulo",
  "auto",
  "9:21",
  "1:3",
  "1:2",
  "9:16",
  "2:3",
  "3:4",
  "4:5",
  "1:1",
  "5:4",
  "4:3",
  "3:2",
  "16:9",
  "2:1",
  "21:9",
  "3:1",
];

const FASES_INMUTABLE: FaseQr[] = [
  "esperando_resultado",
  "analizando",
  "insertando",
  "validando",
  "localizando_qr_final",
  "corrigiendo_qr_final",
  "validando_qr_final",
];

const FASES_ARTISTICO: FaseQr[] = [
  "generando_qr_artistico",
  "creando_qr_artistico",
  "validando_qr_artistico",
  "integrando_diseno",
  "validando_resultado",
  "localizando_qr_final",
  "corrigiendo_qr_final",
  "validando_qr_final",
];

const FASES_NINGUNO: FaseQr[] = ["esperando_resultado", "validando_resultado"];

const FASE_LABELS: Record<Exclude<FaseQr, null>, string> = {
  esperando_resultado: "Esperando resultado",
  analizando: "Analizando QR",
  insertando: "Insertando QR",
  validando: "Validando",
  generando_qr_artistico: "Generando QR artístico",
  creando_qr_artistico: "Creando QR artístico",
  validando_qr_artistico: "Validando QR artístico",
  integrando_diseno: "Integrando diseño",
  validando_resultado: "Validando resultado",
  localizando_qr_final: "Localizando QR final",
  corrigiendo_qr_final: "Corrigiendo QR final",
  validando_qr_final: "Validando QR final",
};

const DEGRADACION_STEPS: DegradacionStep[] = [
  { orden: 1, ajuste: "base", descripcion: "Estilo QR sin cambios" },
  {
    orden: 2,
    ajuste: "sin_logo_central",
    descripcion: "Quita logo del centro del QR",
  },
  {
    orden: 3,
    ajuste: "sin_degradados",
    descripcion: "Colores planos en módulos y ojos",
  },
  {
    orden: 4,
    ajuste: "modulos_redondeados",
    descripcion: "Fuerza módulos redondeados",
  },
  {
    orden: 5,
    ajuste: "ojos_normalizados",
    descripcion: "Ojos a forma cuadrada estándar",
  },
  {
    orden: 6,
    ajuste: "modulos_cuadrados",
    descripcion: "Máxima legibilidad: módulos cuadrados",
  },
];

const ESCALAS: EscalaCatalogEntry[] = [
  { valor: 0.75, uso: "Corrección agresiva de zona" },
  { valor: 0.85, uso: "Reintento tras fallo de lectura" },
  { valor: 0.92, uso: "Ajuste fino habitual" },
  { valor: 1.0, uso: "Escala nominal" },
  { valor: 1.08, uso: "Ampliar zona si margen lo permite" },
];

const ARTISTICO_MAX_QR = 3;
const ARTISTICO_MAX_INTEGRACION = 3;

declare global {
  // eslint-disable-next-line no-var
  var __pegatinasStore: AppStore | undefined;
  // eslint-disable-next-line no-var
  var __pegatinasLastTick: number | undefined;
}

function cloneSeed(): AppStore {
  return structuredClone(SEED_STORE);
}

export function getStore(): AppStore {
  if (!globalThis.__pegatinasStore) {
    globalThis.__pegatinasStore = cloneSeed();
  }
  return globalThis.__pegatinasStore;
}

export function resetStore(): AppStore {
  globalThis.__pegatinasStore = cloneSeed();
  globalThis.__pegatinasLastTick = Date.now();
  return globalThis.__pegatinasStore;
}

export function getCapacidades(): Capacidades {
  const store = getStore();
  return {
    formatos: FORMATOS,
    resoluciones: ["1K", "2K"],
    qr_modos: ["ninguno", "inmutable", "artistico_ia"],
    cola_max_en_vuelo: store.cola_max_en_vuelo,
    modelo_kie: store.modelo_kie,
  };
}

function catalogFases(): FaseCatalogEntry[] {
  const seen = new Map<Exclude<FaseQr, null>, QrModo[]>();
  const add = (fases: FaseQr[], modo: QrModo) => {
    for (const f of fases) {
      if (!f) continue;
      const list = seen.get(f) ?? [];
      if (!list.includes(modo)) list.push(modo);
      seen.set(f, list);
    }
  };
  add(FASES_NINGUNO, "ninguno");
  add(FASES_INMUTABLE, "inmutable");
  add(FASES_ARTISTICO, "artistico_ia");
  return [...seen.entries()].map(([id, modos]) => ({
    id,
    modos,
    etiqueta: FASE_LABELS[id],
  }));
}

export function getCapacidadCompleta(): CapacidadesCompletas {
  const base = getCapacidades();
  return {
    ...base,
    kie_modo: isKieReal() ? "real" : "mock",
    modelo_kie: getKieModel(),
    limites: {
      negocio_chars: 60,
      agencia_chars: 60,
      estilo_texto_chars: 600,
      prompt_chars: 8000,
      cola_max_en_vuelo: base.cola_max_en_vuelo,
    },
    fases: catalogFases(),
    degradacion: DEGRADACION_STEPS,
    escalas: ESCALAS,
    artistico: {
      max_intentos_qr: ARTISTICO_MAX_QR,
      max_intentos_integracion: ARTISTICO_MAX_INTEGRACION,
    },
    futuro: {
      prompt_sets: [],
    },
  };
}

/** List/gallery DTO — hides prompt, callback URL, kie.input_enviado. */
export function toDto(g: Generacion): GeneracionDto {
  return {
    id: g.id,
    creado_en: g.creado_en,
    iniciado_en: g.iniciado_en,
    estado: g.estado,
    fase_qr: g.fase_qr,
    intentos_inicio: g.intentos_inicio,
    error_msg: g.error_msg,
    coste_ms: g.coste_ms,
    qr_modo: g.qr_modo,
    qr_artistico_intento: g.qr_artistico_intento,
    integracion_intento: g.integracion_intento,
    nombre_negocio: g.nombre_negocio,
    nombre_agencia: g.nombre_agencia,
    aspect_ratio: g.aspect_ratio,
    resolucion: g.resolucion,
    estilo_texto: g.estilo_texto,
    url_qr: g.url_qr,
    qr_estilo_snapshot: g.qr_estilo_snapshot,
    logo: g.tiene_logo ? { proxy: `/api/entrada/${g.id}/logo` } : null,
    estilo: g.tiene_estilo ? { proxy: `/api/entrada/${g.id}/estilo` } : null,
    logo_qr: g.tiene_logo_qr ? { proxy: `/api/entrada/${g.id}/logo-qr` } : null,
    resultado: g.tiene_resultado ? { proxy: `/api/imagen/${g.id}` } : null,
    qr_artistico: g.tiene_qr_artistico
      ? { proxy: `/api/generacion/${g.id}/qr-artistico` }
      : null,
    qr_ajustes_aplicados: g.qr_ajustes_aplicados,
    qr_zona_final: g.qr_zona_final,
    familia_composicion: g.familia_composicion,
    input_urls: g.input_urls,
    resultados: g.resultados,
    kie_task_id: g.kie.task_id,
    lease_id: g.fencing.lease_id,
    lease_hasta: g.fencing.lease_hasta,
    reintentos_qr: g.fencing.reintentos_qr,
    origen: g.origen,
    regenerado_desde: g.regenerado_desde,
    archivo_origen: g.archivo_origen,
  };
}

/** Full generation for GET /api/generacion/:id (mock internals visible). */
export function toDetalle(g: Generacion): GeneracionDetalle {
  return structuredClone(g);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function fasesPara(modo: QrModo): FaseQr[] {
  if (modo === "artistico_ia") return FASES_ARTISTICO;
  if (modo === "inmutable") return FASES_INMUTABLE;
  return FASES_NINGUNO;
}

function familiaPara(g: Pick<Generacion, "tiene_logo" | "tiene_estilo" | "tiene_logo_qr" | "qr_modo">): string {
  const parts: string[] = [];
  if (g.tiene_logo) parts.push("logo");
  if (g.tiene_estilo) parts.push("estilo");
  parts.push("nfc");
  if (g.qr_modo === "inmutable") parts.push("qr_inmutable");
  if (g.qr_modo === "artistico_ia") parts.push("qr_artistico_ia");
  if (g.tiene_logo_qr) parts.push("logo_qr");
  return parts.join("+") || "basica";
}

function inputUrlsPara(g: Generacion): string[] {
  const urls: string[] = [];
  if (g.inputs.logo.hay && g.inputs.logo.proxy) urls.push(g.inputs.logo.proxy);
  if (g.inputs.estilo.hay && g.inputs.estilo.proxy)
    urls.push(g.inputs.estilo.proxy);
  if (g.inputs.nfc.hay && g.inputs.nfc.proxy) urls.push(g.inputs.nfc.proxy);
  if (g.inputs.logo_qr.hay && g.inputs.logo_qr.proxy)
    urls.push(g.inputs.logo_qr.proxy);
  if (g.inputs.qr_funcional.hay && g.inputs.qr_funcional.proxy)
    urls.push(g.inputs.qr_funcional.proxy);
  if (g.tiene_qr_artistico) {
    urls.push(`/api/generacion/${g.id}/qr-artistico`);
  }
  return urls;
}

function mockZona(seed: string): QrZonaFinal {
  const n = seed.charCodeAt(0) % 10;
  const base = 0.55 + n * 0.01;
  return {
    cuadrilatero: [
      { x: base, y: 0.65 },
      { x: base + 0.28, y: 0.65 },
      { x: base + 0.28, y: 0.93 },
      { x: base, y: 0.93 },
    ],
    escala_usada: ESCALAS[2]?.valor ?? 0.92,
  };
}

function enVuelo(store: AppStore): Generacion[] {
  return store.generaciones.filter((g) => g.estado === "generando");
}

function asignarLeaseMock(g: Generacion): void {
  const now = Date.now();
  g.fencing.lease_id = `lease_${g.slug_negocio}_${g.intentos_inicio}`;
  g.fencing.lease_hasta = new Date(now + 10 * 60 * 1000).toISOString();
  g.kie.model = getKieModel();
  g.kie.reserva_inicio = new Date(now).toISOString();
  g.kie.task_id = `kie_task_${g.slug_negocio}_${String(g.intentos_inicio).padStart(2, "0")}`;
  g.kie.callBackUrl = callbackUrlKie() ?? "https://mock.local/api/aviso-kie";
  g.kie.createTime = new Date(now).toISOString();
  g.kie.completeTime = null;
  g.kie.costTime_segundos_backup = null;
  g.kie.input_enviado = {
    model: g.kie.model,
    prompt: g.prompt_enviado,
    aspect_ratio: g.aspect_ratio === "circulo" ? "1:1" : g.aspect_ratio,
    resolution: g.resolucion,
    mode: g.qr_modo,
    input_urls: g.input_urls,
    kie_modo: "mock",
  };
}

function prepararInicioGeneracion(g: Generacion): void {
  g.estado = "generando";
  g.iniciado_en = new Date().toISOString();
  g.intentos_inicio += 1;
  const fases = fasesPara(g.qr_modo);
  g.fase_qr = fases[0] ?? "esperando_resultado";
  if (!g.prompt_enviado) {
    g.prompt_enviado = [
      `Pegatina NFC reseñas para ${g.nombre_negocio}.`,
      `Agencia: ${g.nombre_agencia}.`,
      `Formato ${g.aspect_ratio} · ${g.resolucion}.`,
      g.estilo_texto ? `Notas: ${g.estilo_texto}` : "",
      g.qr_modo === "ninguno"
        ? "Incluye QR ilustrativo (no funcional)."
        : `Integra QR funcional apuntando a ${g.url_qr}.`,
      "Icono NFC visible. Jerarquía clara, CTA de reseña, crédito de agencia.",
    ]
      .filter(Boolean)
      .join(" ");
  }
  if (g.qr_modo === "artistico_ia") {
    g.qr_artistico_intento = g.qr_artistico_intento ?? 1;
    g.integracion_intento = g.integracion_intento ?? 0;
  }
  if (g.qr_modo !== "ninguno" && !g.inputs.qr_funcional.hay) {
    g.inputs.qr_funcional = {
      hay: true,
      origen: "generado",
      mime: "image/png",
      proxy: `/api/entrada/${g.id}/qr-funcional`,
      nota: "QR funcional base",
    };
  }
  g.familia_composicion = familiaPara(g);
  g.input_urls = inputUrlsPara(g);
  g.fencing.lease_id = `lease_${g.slug_negocio}_${g.intentos_inicio}`;
  g.fencing.lease_hasta = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  g.kie.model = getKieModel();
  g.kie.reserva_inicio = new Date().toISOString();
}

/** Arranca createTask real; si falla o no hay config usable, cae a mock. */
async function iniciarKieReal(g: Generacion): Promise<void> {
  const check = puedeLlamarKieConUrls(g.input_urls);
  if (!check.ok) {
    g.error_msg = check.reason ?? "Kie no disponible; usando mock";
    asignarLeaseMock(g);
    return;
  }

  const cb = callbackUrlKie();
  try {
    const created = await crearTareaKie({
      prompt: g.prompt_enviado || `Pegatina ${g.nombre_negocio}`,
      input_urls: g.input_urls,
      aspect_ratio: g.aspect_ratio,
      resolution: g.resolucion,
      callBackUrl: cb,
    });
    g.kie.task_id = created.taskId;
    g.kie.callBackUrl = cb;
    g.kie.createTime = new Date().toISOString();
    g.kie.completeTime = null;
    g.kie.costTime_segundos_backup = null;
    g.kie.input_enviado = {
      model: getKieModel(),
      prompt: g.prompt_enviado,
      aspect_ratio: g.aspect_ratio === "circulo" ? "1:1" : g.aspect_ratio,
      resolution: g.resolucion,
      input_urls: check.urls,
      callBackUrl: cb,
      kie_modo: "real",
      createTask: created.raw,
    };
    g.fase_qr = "esperando_resultado";
    g.error_msg = null;
  } catch (error) {
    g.estado = "error";
    g.fase_qr = null;
    g.error_msg =
      error instanceof Error
        ? `Kie createTask: ${error.message}`
        : "Kie createTask falló";
  }
}

function aplicarResultadoKieExitoso(
  g: Generacion,
  info: {
    resultUrls: string[];
    createTime: number | string | null;
    completeTime: number | string | null;
    costTime: number | null;
    raw: unknown;
  },
): void {
  const createIso = isoFromKieTime(info.createTime);
  const completeIso = isoFromKieTime(info.completeTime);
  if (createIso) g.kie.createTime = createIso;
  if (completeIso) g.kie.completeTime = completeIso;

  if (
    info.createTime != null &&
    info.completeTime != null &&
    typeof info.createTime === "number" &&
    typeof info.completeTime === "number"
  ) {
    const a = info.createTime > 1e12 ? info.createTime : info.createTime * 1000;
    const b =
      info.completeTime > 1e12 ? info.completeTime : info.completeTime * 1000;
    g.coste_ms = Math.max(0, b - a);
  } else if (info.costTime != null) {
    // costTime backup = segundos
    g.coste_ms = Math.round(info.costTime * 1000);
    g.kie.costTime_segundos_backup = info.costTime;
  }

  const resultUrl = info.resultUrls[0] ?? null;
  g.kie.input_enviado = {
    ...(g.kie.input_enviado && typeof g.kie.input_enviado === "object"
      ? g.kie.input_enviado
      : {}),
    resultUrls: info.resultUrls,
    recordInfo: info.raw,
  };

  g.resultados = {
    original: {
      hay: Boolean(resultUrl),
      es_original: true,
      es_final: false,
      proxy: resultUrl,
    },
    final: {
      hay: Boolean(resultUrl),
      es_original: false,
      es_final: g.qr_modo === "ninguno",
      proxy: resultUrl,
    },
  };
  g.tiene_resultado = Boolean(resultUrl);

  // Tras Kie: sin QR funcional → listo; con QR → seguir fases mock de corrección
  if (g.qr_modo === "ninguno") {
    g.estado = "listo";
    g.fase_qr = null;
    return;
  }

  const fases = fasesPara(g.qr_modo);
  // Saltar esperando_resultado; entrar en pipeline QR local (mock hasta sharp real)
  const next =
    fases.find((f) => f && f !== "esperando_resultado") ??
    fases[1] ??
    "analizando";
  g.fase_qr = next;
  g.estado = "generando";
}

export async function aplicarAvisoKie(taskId: string): Promise<GeneracionDto | null> {
  const store = getStore();
  const g = store.generaciones.find((item) => item.kie.task_id === taskId);
  if (!g) return null;
  if (!isKieReal()) {
    // En mock el taskId es sintético; no consultar API
    return toDto(g);
  }
  try {
    const info = await consultarTareaKie(taskId);
    if (info.state === "success") {
      aplicarResultadoKieExitoso(g, info);
    } else if (info.state === "fail") {
      g.estado = "error";
      g.fase_qr = null;
      g.error_msg = info.failMsg || info.failCode || "Kie task fail";
      g.kie.completeTime = isoFromKieTime(info.completeTime) ?? new Date().toISOString();
    }
    // waiting/queuing/generating → no-op; vigilancia reconsulta
  } catch (error) {
    g.error_msg =
      error instanceof Error
        ? `Kie recordInfo: ${error.message}`
        : "Error consultando Kie";
  }
  return toDto(g);
}

function reclamarCola(store: AppStore): void {
  const huecos = store.cola_max_en_vuelo - enVuelo(store).length;
  if (huecos <= 0) return;

  const pendientes = store.generaciones
    .filter((g) => g.estado === "pendiente")
    .sort((a, b) => a.creado_en.localeCompare(b.creado_en))
    .slice(0, huecos);

  for (const g of pendientes) {
    prepararInicioGeneracion(g);
    if (isKieReal()) {
      // No avanzar fases locales hasta tener task; fire-and-forget
      void iniciarKieReal(g);
    } else {
      asignarLeaseMock(g);
    }
  }
}

function avanzarGeneracion(g: Generacion): void {
  if (g.estado !== "generando") return;

  // Con Kie real: no avanzar mientras esperamos resultado de imagen
  if (
    isKieReal() &&
    g.kie.task_id &&
    !g.kie.task_id.startsWith("kie_task_") &&
    g.fase_qr === "esperando_resultado" &&
    !g.tiene_resultado
  ) {
    return;
  }

  const fases = fasesPara(g.qr_modo);
  const idx = fases.findIndex((f) => f === g.fase_qr);

  if (idx < 0) {
    g.fase_qr = fases[0] ?? null;
    return;
  }

  if (g.qr_modo === "artistico_ia" && g.fase_qr === "validando_qr_artistico") {
    g.tiene_qr_artistico = true;
    g.input_urls = inputUrlsPara(g);
  }

  if (g.fase_qr === "localizando_qr_final" && !g.qr_zona_final) {
    g.qr_zona_final = mockZona(g.id);
  }

  if (g.fase_qr === "corrigiendo_qr_final") {
    g.fencing.reintentos_qr += 1;
    const step =
      DEGRADACION_STEPS[
        Math.min(g.fencing.reintentos_qr - 1, DEGRADACION_STEPS.length - 1)
      ];
    if (step && !g.qr_ajustes_aplicados.some((a) => a.ajuste === step.ajuste)) {
      g.qr_ajustes_aplicados.push({
        ajuste: step.ajuste,
        resultado: "reintento",
      });
    }
  }

  if (idx < fases.length - 1) {
    g.fase_qr = fases[idx + 1] ?? null;
    if (g.qr_modo === "artistico_ia" && g.fase_qr === "integrando_diseno") {
      g.integracion_intento = Math.min(
        (g.integracion_intento ?? 0) + 1,
        ARTISTICO_MAX_INTEGRACION,
      );
    }
    return;
  }

  // Última fase: decidir resultado mock (post-Kie o mock puro)
  const doneAt = new Date().toISOString();
  if (!g.kie.completeTime) g.kie.completeTime = doneAt;

  if (g.nombre_negocio.toLowerCase().includes("falla")) {
    g.estado = "error";
    g.error_msg = "Fallo técnico simulado de Kie (gpt-image-2)";
    g.fase_qr = null;
    return;
  }

  if (g.nombre_negocio.toLowerCase().includes("revision")) {
    g.estado = "revision_necesaria";
    g.error_msg = "No se pudo garantizar la URL exacta del QR";
    g.tiene_resultado = true;
    g.coste_ms = g.coste_ms ?? 32000 + Math.floor(Math.random() * 8000);
    g.kie.costTime_segundos_backup = Math.round((g.coste_ms ?? 0) / 1000);
    const ajustes: QrAjusteAplicado[] = DEGRADACION_STEPS.map((s, i) => ({
      ajuste: s.ajuste,
      resultado:
        i === DEGRADACION_STEPS.length - 1 ? "fallo_final" : "url_incorrecta",
    }));
    g.qr_ajustes_aplicados = ajustes;
    g.fencing.reintentos_qr = Math.max(g.fencing.reintentos_qr, ajustes.length);
    g.qr_zona_final = g.qr_zona_final ?? mockZona(g.id);
    if (!g.resultados.final.hay) {
      g.resultados = {
        original: {
          hay: true,
          es_original: true,
          es_final: false,
          proxy: `/api/imagen/${g.id}?variant=original`,
        },
        final: {
          hay: true,
          es_original: false,
          es_final: false,
          proxy: `/api/imagen/${g.id}`,
        },
      };
    }
    return;
  }

  g.estado = "listo";
  g.fase_qr = null;
  g.tiene_resultado = true;
  g.coste_ms = g.coste_ms ?? 28000 + Math.floor(Math.random() * 12000);
  g.kie.costTime_segundos_backup = Math.round((g.coste_ms ?? 0) / 1000);
  if (g.qr_modo === "inmutable" || g.qr_modo === "artistico_ia") {
    g.qr_ajustes_aplicados = g.qr_ajustes_aplicados.length
      ? g.qr_ajustes_aplicados.map((a) =>
          a.resultado === "reintento" ? { ...a, resultado: "ok" } : a,
        )
      : [{ ajuste: "base", resultado: "ok" }];
    g.qr_zona_final = g.qr_zona_final ?? mockZona(g.id);
  }
  if (!g.resultados.final.hay) {
    g.resultados = {
      original: {
        hay: true,
        es_original: true,
        es_final: false,
        proxy: `/api/imagen/${g.id}?variant=original`,
      },
      final: {
        hay: true,
        es_original: false,
        es_final: true,
        proxy: `/api/imagen/${g.id}`,
      },
    };
  } else {
    g.resultados.final.es_final = true;
  }
}

async function consultarKiePendientes(store: AppStore): Promise<void> {
  if (!isKieReal()) return;
  for (const g of enVuelo(store)) {
    if (
      !g.kie.task_id ||
      g.kie.task_id.startsWith("kie_task_") ||
      g.fase_qr !== "esperando_resultado" ||
      g.tiene_resultado
    ) {
      continue;
    }
    try {
      const info = await consultarTareaKie(g.kie.task_id);
      if (info.state === "success") {
        aplicarResultadoKieExitoso(g, info);
      } else if (info.state === "fail") {
        g.estado = "error";
        g.fase_qr = null;
        g.error_msg = info.failMsg || info.failCode || "Kie task fail";
        g.kie.completeTime =
          isoFromKieTime(info.completeTime) ?? new Date().toISOString();
      }
    } catch (error) {
      // No tumbar la generación por un poll fallido puntual
      g.error_msg =
        error instanceof Error
          ? `Kie poll: ${error.message}`
          : "Kie poll error";
    }
  }
}

export function vigilar(): AppStore {
  const store = getStore();
  const now = Date.now();
  const last = globalThis.__pegatinasLastTick ?? now;

  // Fire-and-forget poll Kie (no bloquea respuesta HTTP)
  void consultarKiePendientes(store);

  if (now - last >= 2500) {
    for (const g of enVuelo(store)) {
      avanzarGeneracion(g);
    }
    globalThis.__pegatinasLastTick = now;
  }
  reclamarCola(store);
  return store;
}

export function listGeneraciones(): GeneracionDto[] {
  const store = vigilar();
  return [...store.generaciones]
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
    .slice(0, 60)
    .map(toDto);
}

export function getGeneracion(id: string): GeneracionDto | null {
  const store = vigilar();
  const g = store.generaciones.find((item) => item.id === id);
  return g ? toDto(g) : null;
}

export function getGeneracionDetalle(id: string): GeneracionDetalle | null {
  const store = vigilar();
  const g = store.generaciones.find((item) => item.id === id);
  return g ? toDetalle(g) : null;
}

export function crearGeneracion(payload: GenerarPayload): GeneracionDto {
  const store = getStore();
  const negocio = payload.negocio.trim().slice(0, 60);
  const agencia = payload.agencia.trim().slice(0, 60);
  if (!negocio) throw new Error("El nombre del negocio es obligatorio");
  if (!agencia) throw new Error("El nombre de la agencia es obligatorio");

  const qrModo: QrModo = payload.qrModo ?? "ninguno";
  if (qrModo !== "ninguno" && !payload.urlQr?.trim()) {
    throw new Error("La URL del QR es obligatoria en este modo");
  }
  if (qrModo === "artistico_ia") {
    if (!payload.urlQr?.startsWith("https://")) {
      throw new Error("El modo artístico exige una URL HTTPS");
    }
    if (!payload.confirmarGastoArtistico) {
      throw new Error("Debes confirmar el gasto del modo artístico");
    }
  }

  let estiloSnapshot =
    qrModo === "ninguno" ? null : structuredClone(ESTILO_QR_DEFAULT);
  if (payload.estiloQrId && qrModo !== "ninguno") {
    const estilo = store.estilos_qr.find(
      (e) => e.id === payload.estiloQrId && !e.archivado_en,
    );
    if (estilo) estiloSnapshot = structuredClone(estilo.config);
  }
  if (payload.qrEstilo && qrModo !== "ninguno") {
    estiloSnapshot = structuredClone(payload.qrEstilo);
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const assets = payload.assets ?? {};
  const tieneLogo = Boolean(assets.logo) || !payload.archivoOrigen;
  // En alta manual seguimos marcando logo como esperado (flujo UI).
  // En import ZIP solo si viene el archivo.
  const tieneEstilo = Boolean(assets.estilo);
  const tieneLogoQr = Boolean(assets.logo_qr) || Boolean(payload.estiloQrId);
  const tieneNfc = Boolean(assets.nfc) || true;
  const inputs = buildInputsFor(id, {
    logo: tieneLogo,
    estilo: tieneEstilo,
    logo_qr: tieneLogoQr,
    nfc: tieneNfc,
    qr_funcional: qrModo !== "ninguno",
    logoOrigen: assets.logo ? "zip" : "upload",
    estiloOrigen: assets.estilo ? "zip" : undefined,
    logoQrOrigen: assets.logo_qr
      ? "zip"
      : payload.estiloQrId
        ? `catalogo:${payload.estiloQrId}`
        : undefined,
  });

  if (assets.logo || assets.estilo || assets.logo_qr || assets.nfc) {
    guardarEntradaAssets(id, {
      ...(assets.logo ? { logo: assets.logo } : {}),
      ...(assets.estilo ? { estilo: assets.estilo } : {}),
      ...(assets.logo_qr ? { logo_qr: assets.logo_qr } : {}),
      ...(assets.nfc ? { nfc: assets.nfc } : {}),
    });
  }

  const generacion: Generacion = {
    id,
    creado_en: now,
    iniciado_en: null,
    estado: "pendiente",
    fase_qr: null,
    intentos_inicio: 0,
    error_msg: null,
    nombre_negocio: negocio,
    nombre_agencia: agencia,
    slug_negocio: slugify(negocio) || id.slice(0, 8),
    aspect_ratio: payload.aspecto || "1:1",
    resolucion: payload.resolucion || "1K",
    estilo_texto: (payload.estiloTexto ?? "").slice(0, 4000),
    qr_modo: qrModo,
    url_qr: payload.urlQr?.trim() || null,
    qr_estilo_snapshot: estiloSnapshot,
    qr_artistico_intento: null,
    integracion_intento: null,
    qr_ajustes_aplicados: [],
    qr_zona_final: null,
    coste_ms: null,
    tiene_logo: tieneLogo,
    tiene_estilo: tieneEstilo,
    tiene_logo_qr: tieneLogoQr,
    tiene_resultado: false,
    tiene_qr_artistico: false,
    inputs,
    kie: emptyKie(store.modelo_kie),
    fencing: emptyFencing(),
    familia_composicion: null,
    input_urls: [],
    resultados: emptyResultados(),
    origen: payload.archivoOrigen ? "importacion" : "manual",
    regenerado_desde: null,
    archivo_origen: payload.archivoOrigen ?? null,
    prompt_enviado: null,
  };
  generacion.familia_composicion = familiaPara(generacion);
  generacion.input_urls = inputUrlsPara(generacion);

  store.generaciones.unshift(generacion);
  reclamarCola(store);
  return toDto(generacion);
}

export function regenerar(id: string, confirmarGasto: boolean): GeneracionDto {
  if (!confirmarGasto) throw new Error("Debes confirmar el gasto de regeneración");
  const store = getStore();
  const fuente = store.generaciones.find((g) => g.id === id);
  if (!fuente) throw new Error("Generación no encontrada");
  if (fuente.estado !== "revision_necesaria") {
    throw new Error("Solo se regenera desde revision_necesaria");
  }
  if (!fuente.url_qr) throw new Error("La generación no conserva URL QR");

  // UUID determinista simple a partir del id fuente (idempotencia de UI)
  const childId = `regen-${fuente.id.slice(0, 13)}`;
  const existente = store.generaciones.find((g) => g.id === childId);
  if (existente) return toDto(existente);

  const now = new Date().toISOString();
  const hijo: Generacion = {
    ...structuredClone(fuente),
    id: childId,
    creado_en: now,
    iniciado_en: null,
    estado: "pendiente",
    fase_qr: null,
    intentos_inicio: 0,
    error_msg: null,
    coste_ms: null,
    tiene_resultado: false,
    qr_ajustes_aplicados: [],
    qr_zona_final: null,
    origen: "regeneracion",
    regenerado_desde: fuente.id,
    prompt_enviado:
      fuente.qr_modo === "inmutable" ? fuente.prompt_enviado : null,
    qr_artistico_intento: null,
    integracion_intento: null,
    tiene_qr_artistico: false,
    kie: emptyKie(store.modelo_kie),
    fencing: emptyFencing(),
    resultados: emptyResultados(),
  };
  hijo.inputs = buildInputsFor(childId, {
    logo: hijo.tiene_logo,
    estilo: hijo.tiene_estilo,
    logo_qr: hijo.tiene_logo_qr,
    nfc: true,
    qr_funcional: hijo.qr_modo !== "ninguno",
  });
  hijo.familia_composicion = familiaPara(hijo);
  hijo.input_urls = inputUrlsPara(hijo);

  store.generaciones.unshift(hijo);
  reclamarCola(store);
  return toDto(hijo);
}

export type ImportFileInput = {
  name: string;
  text?: string;
  bytes?: ArrayBuffer;
};

export async function parseImportFiles(
  files: ImportFileInput[],
  options: { encolar?: boolean } = {},
): Promise<{
  items: ImportPreviewItem[];
  creadas: GeneracionDto[];
}> {
  const store = getStore();
  const encolar = options.encolar !== false;
  const creadas: GeneracionDto[] = [];
  const operacionId = randomUUID();
  const ttlHasta = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const collected: ImportPreviewItem[] = [];

  for (const file of files) {
    const id = randomUUID();
    const lower = file.name.toLowerCase();

    if (lower.endsWith(".json")) {
      try {
        const raw = JSON.parse(file.text || "{}");
        const gen = raw.generacion ?? raw;
        const negocio = String(gen.negocio ?? gen.nombre_negocio ?? "").trim();
        const agencia = String(gen.agencia ?? gen.nombre_agencia ?? "").trim();
        const qrModo = (gen.qr_modo ?? gen.qrModo ?? "ninguno") as QrModo;
        if (!negocio || !agencia) throw new Error("Faltan negocio/agencia");

        const item: ImportPreviewItem = {
          id,
          nombre_archivo: file.name,
          negocio,
          agencia,
          aspecto: String(gen.aspecto ?? gen.aspect_ratio ?? "1:1"),
          resolucion: (gen.resolucion ?? "1K") as "1K" | "2K",
          qr_modo: qrModo,
          url_qr: gen.url_qr ?? gen.urlQr ?? null,
          ok: true,
          error: null,
          manifest_version: Number(raw.version ?? 3),
          operacion_id: operacionId,
          ttl_hasta: ttlHasta,
        };
        collected.push(item);

        if (encolar) {
          const creada = crearGeneracion({
            negocio: item.negocio,
            agencia: item.agencia,
            aspecto: item.aspecto,
            resolucion: item.resolucion,
            estiloTexto: gen.estilo_texto ?? gen.estiloTexto ?? "",
            urlQr: item.url_qr ?? undefined,
            qrModo: item.qr_modo,
            confirmarGastoArtistico: item.qr_modo === "artistico_ia",
            archivoOrigen: file.name,
          });
          creadas.push(creada);
        }
      } catch (error) {
        collected.push({
          id,
          nombre_archivo: file.name,
          negocio: "—",
          agencia: "—",
          aspecto: "1:1",
          resolucion: "1K",
          qr_modo: "ninguno",
          url_qr: null,
          ok: false,
          error: error instanceof Error ? error.message : "JSON inválido",
          manifest_version: 0,
          operacion_id: operacionId,
          ttl_hasta: ttlHasta,
        });
      }
      continue;
    }

    if (lower.endsWith(".zip")) {
      try {
        if (!file.bytes) {
          throw new Error("ZIP vacío o no leído");
        }
        const parsed = await parsePegatinaZip(file.bytes);
        const { manifest, assets } = parsed;
        const item: ImportPreviewItem = {
          id,
          nombre_archivo: file.name,
          negocio: manifest.negocio,
          agencia: manifest.agencia,
          aspecto: manifest.aspecto,
          resolucion: manifest.resolucion,
          qr_modo: manifest.qr_modo,
          url_qr: manifest.url_qr,
          ok: true,
          error: null,
          manifest_version: manifest.version,
          operacion_id: operacionId,
          ttl_hasta: ttlHasta,
        };
        collected.push(item);

        if (encolar) {
          creadas.push(
            crearGeneracion({
              negocio: manifest.negocio,
              agencia: manifest.agencia,
              aspecto: manifest.aspecto,
              resolucion: manifest.resolucion,
              estiloTexto: manifest.estilo_texto,
              urlQr: manifest.url_qr ?? undefined,
              qrModo: manifest.qr_modo,
              confirmarGastoArtistico: manifest.qr_modo === "artistico_ia",
              archivoOrigen: file.name,
              qrEstilo: manifest.qr_estilo ?? undefined,
              assets: {
                ...(assets.logo ? { logo: assets.logo } : {}),
                ...(assets.estilo ? { estilo: assets.estilo } : {}),
                ...(assets.logo_qr ? { logo_qr: assets.logo_qr } : {}),
                ...(assets.nfc ? { nfc: assets.nfc } : {}),
              },
            }),
          );
        }
      } catch (error) {
        collected.push({
          id,
          nombre_archivo: file.name,
          negocio: "—",
          agencia: "—",
          aspecto: "1:1",
          resolucion: "1K",
          qr_modo: "ninguno",
          url_qr: null,
          ok: false,
          error: error instanceof Error ? error.message : "ZIP inválido",
          manifest_version: 0,
          operacion_id: operacionId,
          ttl_hasta: ttlHasta,
        });
      }
      continue;
    }

    collected.push({
      id,
      nombre_archivo: file.name,
      negocio: "—",
      agencia: "—",
      aspecto: "1:1",
      resolucion: "1K",
      qr_modo: "ninguno",
      url_qr: null,
      ok: false,
      error: "Solo se admiten .json o .zip",
      manifest_version: 0,
      operacion_id: operacionId,
      ttl_hasta: ttlHasta,
    });
  }

  store.importaciones = [...collected, ...store.importaciones].slice(0, 40);
  return { items: collected, creadas };
}

export function colaResumen() {
  const store = vigilar();
  return {
    max_en_vuelo: store.cola_max_en_vuelo,
    en_vuelo: store.generaciones
      .filter((g) => g.estado === "generando")
      .map((g) => g.id),
    pendientes: store.generaciones
      .filter((g) => g.estado === "pendiente")
      .sort((a, b) => a.creado_en.localeCompare(b.creado_en))
      .map((g) => g.id),
    lock: enVuelo(store).map((g) => ({
      generacion_id: g.id,
      lease_id: g.fencing.lease_id,
      lease_hasta: g.fencing.lease_hasta,
      task_id: g.kie.task_id,
    })),
    modelo: store.modelo_kie,
  };
}

/* ── Estilos QR CRUD ─────────────────────────────────────────── */

export function listEstilosQr(options: { incluirArchivados?: boolean } = {}): EstiloQr[] {
  const store = getStore();
  const rows = store.estilos_qr.filter(
    (e) => options.incluirArchivados || !e.archivado_en,
  );
  return [...rows].sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en));
}

export function getEstiloQr(id: string): EstiloQr | null {
  const store = getStore();
  return store.estilos_qr.find((e) => e.id === id) ?? null;
}

export function createEstiloQr(payload: EstiloQrCreatePayload): EstiloQr {
  const store = getStore();
  const nombre = payload.nombre?.trim();
  if (!nombre) throw new Error("El nombre del estilo es obligatorio");

  const now = new Date().toISOString();
  const estilo: EstiloQr = {
    id: randomUUID(),
    nombre: nombre.slice(0, 80),
    config: structuredClone(payload.config ?? ESTILO_QR_DEFAULT),
    tiene_logo: Boolean(payload.tiene_logo),
    creado_en: now,
    actualizado_en: now,
    archivado_en: null,
    version: 1,
  };
  store.estilos_qr.unshift(estilo);
  store.estilos_qr_operaciones.unshift({
    id: randomUUID(),
    tipo: "crear",
    estado: "ok",
    estilo_id: estilo.id,
    version_esperada: 1,
    ttl_hasta: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    creado_en: now,
    error: null,
  });
  return estilo;
}

export function updateEstiloQr(
  id: string,
  payload: EstiloQrUpdatePayload,
): EstiloQr {
  const store = getStore();
  const estilo = store.estilos_qr.find((e) => e.id === id);
  if (!estilo) throw new Error("Estilo no encontrado");
  if (estilo.archivado_en) throw new Error("El estilo está archivado");

  if (payload.nombre !== undefined) {
    const nombre = payload.nombre.trim();
    if (!nombre) throw new Error("El nombre del estilo es obligatorio");
    estilo.nombre = nombre.slice(0, 80);
  }
  if (payload.config !== undefined) {
    estilo.config = structuredClone(payload.config);
  }
  if (payload.tiene_logo !== undefined) {
    estilo.tiene_logo = payload.tiene_logo;
  }
  estilo.version += 1;
  estilo.actualizado_en = new Date().toISOString();

  store.estilos_qr_operaciones.unshift({
    id: randomUUID(),
    tipo: "actualizar",
    estado: "ok",
    estilo_id: estilo.id,
    version_esperada: estilo.version,
    ttl_hasta: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    creado_en: estilo.actualizado_en,
    error: null,
  });
  return estilo;
}

export function archiveEstiloQr(id: string): EstiloQr {
  const store = getStore();
  const estilo = store.estilos_qr.find((e) => e.id === id);
  if (!estilo) throw new Error("Estilo no encontrado");
  if (estilo.archivado_en) return estilo;

  const now = new Date().toISOString();
  estilo.archivado_en = now;
  estilo.actualizado_en = now;
  estilo.version += 1;

  store.estilos_qr_operaciones.unshift({
    id: randomUUID(),
    tipo: "archivar",
    estado: "ok",
    estilo_id: estilo.id,
    version_esperada: estilo.version,
    ttl_hasta: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    creado_en: now,
    error: null,
  });
  return estilo;
}

export function listEstilosOperaciones() {
  return [...getStore().estilos_qr_operaciones].sort((a, b) =>
    b.creado_en.localeCompare(a.creado_en),
  );
}

export function listLimpiezas() {
  return [...getStore().limpiezas].sort((a, b) =>
    b.creado_en.localeCompare(a.creado_en),
  );
}
