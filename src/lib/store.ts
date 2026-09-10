import { randomUUID } from "crypto";
import { ESTILO_QR_DEFAULT, SEED_STORE } from "./seed";
import type {
  AppStore,
  Capacidades,
  FaseQr,
  Generacion,
  GeneracionDto,
  GenerarPayload,
  ImportPreviewItem,
  QrModo,
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

export function toDto(g: Generacion): GeneracionDto {
  return {
    id: g.id,
    creado_en: g.creado_en,
    iniciado_en: g.iniciado_en,
    estado: g.estado,
    fase_qr: g.fase_qr,
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
    origen: g.origen,
    regenerado_desde: g.regenerado_desde,
    archivo_origen: g.archivo_origen,
  };
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

function enVuelo(store: AppStore): Generacion[] {
  return store.generaciones.filter((g) => g.estado === "generando");
}

function reclamarCola(store: AppStore): void {
  const huecos = store.cola_max_en_vuelo - enVuelo(store).length;
  if (huecos <= 0) return;

  const pendientes = store.generaciones
    .filter((g) => g.estado === "pendiente")
    .sort((a, b) => a.creado_en.localeCompare(b.creado_en))
    .slice(0, huecos);

  for (const g of pendientes) {
    g.estado = "generando";
    g.iniciado_en = new Date().toISOString();
    g.intentos_inicio += 1;
    const fases = fasesPara(g.qr_modo);
    g.fase_qr = fases[0] ?? "esperando_resultado";
    if (!g.prompt_enviado) {
      g.prompt_enviado = `PROMPT_MOCK_${g.slug_negocio}_${g.aspect_ratio}`;
    }
    if (g.qr_modo === "artistico_ia") {
      g.qr_artistico_intento = 1;
      g.integracion_intento = 0;
    }
  }
}

function avanzarGeneracion(g: Generacion): void {
  if (g.estado !== "generando") return;

  const fases = fasesPara(g.qr_modo);
  const idx = fases.findIndex((f) => f === g.fase_qr);

  if (idx < 0) {
    g.fase_qr = fases[0] ?? null;
    return;
  }

  if (g.qr_modo === "artistico_ia" && g.fase_qr === "validando_qr_artistico") {
    g.tiene_qr_artistico = true;
  }

  if (idx < fases.length - 1) {
    g.fase_qr = fases[idx + 1] ?? null;
    if (g.qr_modo === "artistico_ia" && g.fase_qr === "integrando_diseno") {
      g.integracion_intento = (g.integracion_intento ?? 0) + 1;
    }
    return;
  }

  // Última fase: decidir resultado mock
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
    g.coste_ms = 32000 + Math.floor(Math.random() * 8000);
    g.qr_ajustes_aplicados = [
      "base",
      "sin_logo_central",
      "sin_degradados",
      "modulos_cuadrados",
    ];
    return;
  }

  g.estado = "listo";
  g.fase_qr = null;
  g.tiene_resultado = true;
  g.coste_ms = 28000 + Math.floor(Math.random() * 12000);
  if (g.qr_modo === "inmutable" || g.qr_modo === "artistico_ia") {
    g.qr_ajustes_aplicados = g.qr_ajustes_aplicados.length
      ? g.qr_ajustes_aplicados
      : ["base"];
  }
}

export function vigilar(): AppStore {
  const store = getStore();
  const now = Date.now();
  const last = globalThis.__pegatinasLastTick ?? now;
  // Avanzar como máximo una fase cada ~2.5s por tick de vigilancia
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

  const id = randomUUID();
  const now = new Date().toISOString();
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
    estilo_texto: (payload.estiloTexto ?? "").slice(0, 600),
    qr_modo: qrModo,
    url_qr: payload.urlQr?.trim() || null,
    qr_estilo_snapshot: qrModo === "ninguno" ? null : ESTILO_QR_DEFAULT,
    qr_artistico_intento: null,
    integracion_intento: null,
    qr_ajustes_aplicados: [],
    coste_ms: null,
    tiene_logo: true,
    tiene_estilo: false,
    tiene_logo_qr: false,
    tiene_resultado: false,
    tiene_qr_artistico: false,
    origen: payload.archivoOrigen ? "importacion" : "manual",
    regenerado_desde: null,
    archivo_origen: payload.archivoOrigen ?? null,
    prompt_enviado: null,
  };

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
    origen: "regeneracion",
    regenerado_desde: fuente.id,
    // inmutable conserva prompt; artístico reinicia
    prompt_enviado:
      fuente.qr_modo === "inmutable" ? fuente.prompt_enviado : null,
    qr_artistico_intento: null,
    integracion_intento: null,
    tiene_qr_artistico: false,
  };

  store.generaciones.unshift(hijo);
  reclamarCola(store);
  return toDto(hijo);
}

export function parseImportFiles(
  files: { name: string; text?: string }[],
  options: { encolar?: boolean } = {},
): {
  items: ImportPreviewItem[];
  creadas: GeneracionDto[];
} {
  const store = getStore();
  const encolar = options.encolar !== false;
  const items: ImportPreviewItem[] = [];
  const creadas: GeneracionDto[] = [];

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
        };
        items.push(item);

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
        items.push({
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
        });
      }
      continue;
    }

    if (lower.endsWith(".zip")) {
      // Mock: un ZIP válido crea una generación pendiente
      const base = file.name.replace(/\.zip$/i, "").replace(/[-_]/g, " ");
      const negocio = base.slice(0, 60) || "Import ZIP";
      const item: ImportPreviewItem = {
        id,
        nombre_archivo: file.name,
        negocio,
        agencia: "Importación",
        aspecto: "1:1",
        resolucion: "1K",
        qr_modo: "inmutable",
        url_qr: "https://example.com/resenas/import",
        ok: true,
        error: null,
        manifest_version: 3,
      };
      items.push(item);
      if (encolar) {
        creadas.push(
          crearGeneracion({
            negocio: item.negocio,
            agencia: item.agencia,
            aspecto: item.aspecto,
            resolucion: item.resolucion,
            urlQr: item.url_qr ?? undefined,
            qrModo: "inmutable",
            archivoOrigen: file.name,
          }),
        );
      }
      continue;
    }

    items.push({
      id,
      nombre_archivo: file.name,
      negocio: "—",
      agencia: "—",
      aspecto: "1:1",
      resolucion: "1K",
      qr_modo: "ninguno",
      url_qr: null,
      ok: false,
      error: "Solo se admiten .json o .zip en este mock",
      manifest_version: 0,
    });
  }

  store.importaciones = [...items, ...store.importaciones].slice(0, 40);
  return { items, creadas };
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
  };
}
