import type {
  AppStore,
  EstiloQrConfig,
  Generacion,
  GeneracionInputs,
  KieState,
  FencingState,
  GeneracionResultados,
  QrZonaFinal,
} from "./types";

export const ESTILO_QR_DEFAULT: EstiloQrConfig = {
  modulos: { forma: "redondeado", color: "#251911", degradado: null },
  ojos: {
    marco: { forma: "cuadrado", color: "#251911", degradado: null },
    centro: { forma: "cuadrado", color: "#251911", degradado: null },
  },
  fondo: { color: "#FFFFFF" },
  margen: 4,
  correccion: "H",
  logo: { tamano: 0.2, margen: 0, ocultarModulos: true },
};

export function emptyInputs(): GeneracionInputs {
  return {
    logo: { hay: false, origen: null, mime: null, proxy: null, nota: null },
    estilo: { hay: false, origen: null, mime: null, proxy: null, nota: null },
    logo_qr: { hay: false, origen: null, mime: null, proxy: null, nota: null },
    nfc: { hay: false, origen: null, mime: null, proxy: null, nota: null },
    qr_funcional: {
      hay: false,
      origen: null,
      mime: null,
      proxy: null,
      nota: null,
    },
  };
}

export function emptyKie(model = "gpt-image-2-image-to-image"): KieState {
  return {
    model,
    task_id: null,
    callBackUrl: null,
    input_enviado: null,
    createTime: null,
    completeTime: null,
    costTime_segundos_backup: null,
    reserva_inicio: null,
  };
}

export function emptyFencing(): FencingState {
  return {
    lease_id: null,
    lease_hasta: null,
    reintentos_qr: 0,
  };
}

export function emptyResultados(): GeneracionResultados {
  return {
    original: {
      hay: false,
      es_original: true,
      es_final: false,
      proxy: null,
    },
    final: {
      hay: false,
      es_original: false,
      es_final: true,
      proxy: null,
    },
  };
}

export function buildInputsFor(
  id: string,
  flags: {
    logo?: boolean;
    estilo?: boolean;
    logo_qr?: boolean;
    nfc?: boolean;
    qr_funcional?: boolean;
    logoOrigen?: string;
    estiloOrigen?: string;
    logoQrOrigen?: string;
  },
): GeneracionInputs {
  const inputs = emptyInputs();
  if (flags.logo) {
    inputs.logo = {
      hay: true,
      origen: flags.logoOrigen ?? "upload",
      mime: "image/png",
      proxy: `/api/entrada/${id}/logo`,
      nota: null,
    };
  }
  if (flags.estilo) {
    inputs.estilo = {
      hay: true,
      origen: flags.estiloOrigen ?? "upload",
      mime: "image/jpeg",
      proxy: `/api/entrada/${id}/estilo`,
      nota: "moodboard",
    };
  }
  if (flags.logo_qr) {
    inputs.logo_qr = {
      hay: true,
      origen: flags.logoQrOrigen ?? "catalogo",
      mime: "image/png",
      proxy: `/api/entrada/${id}/logo-qr`,
      nota: null,
    };
  }
  if (flags.nfc) {
    inputs.nfc = {
      hay: true,
      origen: "plantilla",
      mime: "image/svg+xml",
      proxy: `/api/entrada/${id}/nfc`,
      nota: "chip NFC decorativo",
    };
  }
  if (flags.qr_funcional) {
    inputs.qr_funcional = {
      hay: true,
      origen: "generado",
      mime: "image/png",
      proxy: `/api/entrada/${id}/qr-funcional`,
      nota: "QR inmutable base",
    };
  }
  return inputs;
}

const ZONA_CAFE: QrZonaFinal = {
  cuadrilatero: [
    { x: 0.62, y: 0.68 },
    { x: 0.88, y: 0.68 },
    { x: 0.88, y: 0.92 },
    { x: 0.62, y: 0.92 },
  ],
  escala_usada: 0.92,
};

const ZONA_TIENDA: QrZonaFinal = {
  cuadrilatero: [
    { x: 0.55, y: 0.58 },
    { x: 0.9, y: 0.55 },
    { x: 0.92, y: 0.9 },
    { x: 0.57, y: 0.93 },
  ],
  escala_usada: 0.85,
};

function genListo(): Generacion {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  return {
    id,
    creado_en: "2026-09-10T10:00:00.000Z",
    iniciado_en: "2026-09-10T10:00:05.000Z",
    estado: "listo",
    fase_qr: null,
    intentos_inicio: 1,
    error_msg: null,
    nombre_negocio: "Café Luna",
    nombre_agencia: "Estudio Norte",
    slug_negocio: "cafe-luna",
    aspect_ratio: "1:1",
    resolucion: "1K",
    estilo_texto: "Paleta cálida, tipografía serif suave",
    qr_modo: "inmutable",
    url_qr: "https://example.com/resenas/cafe-luna",
    qr_estilo_snapshot: ESTILO_QR_DEFAULT,
    qr_artistico_intento: null,
    integracion_intento: null,
    qr_ajustes_aplicados: [
      { ajuste: "base", resultado: "ok" },
      { ajuste: "sin_logo_central", resultado: "ok_tras_reintento" },
    ],
    qr_zona_final: ZONA_CAFE,
    coste_ms: 36000,
    tiene_logo: true,
    tiene_estilo: true,
    tiene_logo_qr: true,
    tiene_resultado: true,
    tiene_qr_artistico: false,
    inputs: buildInputsFor(id, {
      logo: true,
      estilo: true,
      logo_qr: true,
      nfc: true,
      qr_funcional: true,
      logoOrigen: "upload",
      estiloOrigen: "upload",
      logoQrOrigen: "catalogo:11111111-1111-4111-8111-111111111111",
    }),
    kie: {
      model: "gpt-image-2-image-to-image",
      task_id: "kie_task_cafe_luna_001",
      callBackUrl: "https://mock.local/api/kie/callback",
      input_enviado: {
        model: "gpt-image-2-image-to-image",
        aspect_ratio: "1:1",
        resolution: "1K",
        input_urls: [
          `/api/entrada/${id}/logo`,
          `/api/entrada/${id}/estilo`,
          `/api/entrada/${id}/nfc`,
        ],
      },
      createTime: "2026-09-10T10:00:06.000Z",
      completeTime: "2026-09-10T10:00:41.000Z",
      costTime_segundos_backup: 35,
      reserva_inicio: "2026-09-10T10:00:05.000Z",
    },
    fencing: {
      lease_id: "lease_cafe_luna_done",
      lease_hasta: "2026-09-10T10:05:05.000Z",
      reintentos_qr: 1,
    },
    familia_composicion: "logo+estilo+nfc+qr_inmutable",
    input_urls: [
      `/api/entrada/${id}/logo`,
      `/api/entrada/${id}/estilo`,
      `/api/entrada/${id}/nfc`,
      `/api/entrada/${id}/qr-funcional`,
    ],
    resultados: {
      original: {
        hay: true,
        es_original: true,
        es_final: false,
        proxy: `/api/imagen/${id}?variant=original`,
      },
      final: {
        hay: true,
        es_original: false,
        es_final: true,
        proxy: `/api/imagen/${id}`,
      },
    },
    origen: "manual",
    regenerado_desde: null,
    archivo_origen: null,
    prompt_enviado:
      "PROMPT_FINAL_SNAPSHOT: Café Luna, paleta cálida, tipografía serif suave, QR inmutable esquina inferior derecha.",
  };
}

function genGenerandoArtistico(): Generacion {
  const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  return {
    id,
    creado_en: "2026-09-10T11:00:00.000Z",
    iniciado_en: "2026-09-10T11:00:04.000Z",
    estado: "generando",
    fase_qr: "integrando_diseno",
    intentos_inicio: 1,
    error_msg: null,
    nombre_negocio: "Bar Sol",
    nombre_agencia: "Pixel & Co",
    slug_negocio: "bar-sol",
    aspect_ratio: "9:16",
    resolucion: "2K",
    estilo_texto: "",
    qr_modo: "artistico_ia",
    url_qr: "https://maps.example/bar-sol/reviews",
    qr_estilo_snapshot: {
      ...ESTILO_QR_DEFAULT,
      modulos: { forma: "cuadrado", color: "#111111", degradado: null },
      logo: { tamano: 0, margen: 0, ocultarModulos: true },
    },
    qr_artistico_intento: 2,
    integracion_intento: 1,
    qr_ajustes_aplicados: [],
    qr_zona_final: null,
    coste_ms: null,
    tiene_logo: true,
    tiene_estilo: false,
    tiene_logo_qr: false,
    tiene_resultado: false,
    tiene_qr_artistico: true,
    inputs: buildInputsFor(id, {
      logo: true,
      nfc: true,
      qr_funcional: true,
      logoOrigen: "upload",
    }),
    kie: {
      model: "gpt-image-2-image-to-image",
      task_id: "kie_task_bar_sol_artistico_02",
      callBackUrl: "https://mock.local/api/kie/callback",
      input_enviado: {
        model: "gpt-image-2-image-to-image",
        aspect_ratio: "9:16",
        resolution: "2K",
        mode: "artistico_ia",
        intento: 2,
      },
      createTime: "2026-09-10T11:00:10.000Z",
      completeTime: null,
      costTime_segundos_backup: null,
      reserva_inicio: "2026-09-10T11:00:04.000Z",
    },
    fencing: {
      lease_id: "lease_bar_sol_active",
      lease_hasta: "2026-09-10T11:10:04.000Z",
      reintentos_qr: 0,
    },
    familia_composicion: "logo+nfc+qr_artistico_ia",
    input_urls: [
      `/api/entrada/${id}/logo`,
      `/api/entrada/${id}/nfc`,
      `/api/generacion/${id}/qr-artistico`,
    ],
    resultados: emptyResultados(),
    origen: "manual",
    regenerado_desde: null,
    archivo_origen: null,
    prompt_enviado:
      "PROMPT_INTEGRACION_SNAPSHOT: Bar Sol 9:16, integrar QR artístico intento 2.",
  };
}

function genRevision(): Generacion {
  const id = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  return {
    id,
    creado_en: "2026-09-10T11:30:00.000Z",
    iniciado_en: "2026-09-10T11:30:03.000Z",
    estado: "revision_necesaria",
    fase_qr: "validando_qr_final",
    intentos_inicio: 1,
    error_msg: "No se pudo garantizar la URL exacta del QR tras degradación",
    nombre_negocio: "Tienda Mar",
    nombre_agencia: "Agencia Sur",
    slug_negocio: "tienda-mar",
    aspect_ratio: "circulo",
    resolucion: "1K",
    estilo_texto: "Minimal, mucho blanco",
    qr_modo: "inmutable",
    url_qr: "https://example.com/r/tienda-mar",
    qr_estilo_snapshot: ESTILO_QR_DEFAULT,
    qr_artistico_intento: null,
    integracion_intento: null,
    qr_ajustes_aplicados: [
      { ajuste: "base", resultado: "url_incorrecta" },
      { ajuste: "sin_logo_central", resultado: "url_incorrecta" },
      { ajuste: "sin_degradados", resultado: "url_incorrecta" },
      { ajuste: "modulos_redondeados", resultado: "url_incorrecta" },
      { ajuste: "ojos_normalizados", resultado: "url_incorrecta" },
      { ajuste: "modulos_cuadrados", resultado: "fallo_final" },
    ],
    qr_zona_final: ZONA_TIENDA,
    coste_ms: 36000,
    tiene_logo: true,
    tiene_estilo: false,
    tiene_logo_qr: false,
    tiene_resultado: true,
    tiene_qr_artistico: false,
    inputs: buildInputsFor(id, {
      logo: true,
      nfc: true,
      qr_funcional: true,
      logoOrigen: "upload",
    }),
    kie: {
      model: "gpt-image-2-image-to-image",
      task_id: "kie_task_tienda_mar_001",
      callBackUrl: "https://mock.local/api/kie/callback",
      input_enviado: {
        model: "gpt-image-2-image-to-image",
        aspect_ratio: "circulo",
        resolution: "1K",
      },
      createTime: "2026-09-10T11:30:04.000Z",
      completeTime: "2026-09-10T11:30:40.000Z",
      costTime_segundos_backup: 36,
      reserva_inicio: "2026-09-10T11:30:03.000Z",
    },
    fencing: {
      lease_id: "lease_tienda_mar_done",
      lease_hasta: "2026-09-10T11:35:03.000Z",
      reintentos_qr: 6,
    },
    familia_composicion: "logo+nfc+qr_inmutable",
    input_urls: [
      `/api/entrada/${id}/logo`,
      `/api/entrada/${id}/nfc`,
      `/api/entrada/${id}/qr-funcional`,
    ],
    resultados: {
      original: {
        hay: true,
        es_original: true,
        es_final: false,
        proxy: `/api/imagen/${id}?variant=original`,
      },
      final: {
        hay: true,
        es_original: false,
        es_final: false,
        proxy: `/api/imagen/${id}`,
      },
    },
    origen: "manual",
    regenerado_desde: null,
    archivo_origen: null,
    prompt_enviado:
      "PROMPT_CIRCULAR_SNAPSHOT: Tienda Mar circular, minimal blanco, QR inmutable.",
  };
}

function genPendiente(): Generacion {
  const id = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  return {
    id,
    creado_en: "2026-09-10T12:00:00.000Z",
    iniciado_en: null,
    estado: "pendiente",
    fase_qr: null,
    intentos_inicio: 0,
    error_msg: null,
    nombre_negocio: "Boutique Verde",
    nombre_agencia: "Casa Studio",
    slug_negocio: "boutique-verde",
    aspect_ratio: "4:5",
    resolucion: "1K",
    estilo_texto: "Verde oliva y crema",
    qr_modo: "ninguno",
    url_qr: null,
    qr_estilo_snapshot: null,
    qr_artistico_intento: null,
    integracion_intento: null,
    qr_ajustes_aplicados: [],
    qr_zona_final: null,
    coste_ms: null,
    tiene_logo: true,
    tiene_estilo: true,
    tiene_logo_qr: false,
    tiene_resultado: false,
    tiene_qr_artistico: false,
    inputs: buildInputsFor(id, {
      logo: true,
      estilo: true,
      nfc: true,
      logoOrigen: "zip:boutique-verde.zip/logo.png",
      estiloOrigen: "zip:boutique-verde.zip/moodboard.jpg",
    }),
    kie: emptyKie(),
    fencing: emptyFencing(),
    familia_composicion: "logo+estilo+nfc",
    input_urls: [
      `/api/entrada/${id}/logo`,
      `/api/entrada/${id}/estilo`,
      `/api/entrada/${id}/nfc`,
    ],
    resultados: emptyResultados(),
    origen: "importacion",
    regenerado_desde: null,
    archivo_origen: "boutique-verde.zip",
    prompt_enviado: null,
  };
}

export const SEED_STORE: AppStore = {
  app: "pegatinas-nfc-studio",
  version: 1,
  modelo_kie: "gpt-image-2-image-to-image",
  cola_max_en_vuelo: 3,
  estilos_qr: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      nombre: "Clásico oscuro",
      config: ESTILO_QR_DEFAULT,
      tiene_logo: true,
      creado_en: "2026-09-01T10:00:00.000Z",
      actualizado_en: "2026-09-05T12:00:00.000Z",
      archivado_en: null,
      version: 3,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      nombre: "Minimal B/N",
      config: {
        ...ESTILO_QR_DEFAULT,
        modulos: { forma: "cuadrado", color: "#111111", degradado: null },
        logo: { tamano: 0, margen: 0, ocultarModulos: true },
      },
      tiene_logo: false,
      creado_en: "2026-09-02T10:00:00.000Z",
      actualizado_en: "2026-09-02T10:00:00.000Z",
      archivado_en: null,
      version: 1,
    },
  ],
  estilos_qr_operaciones: [
    {
      id: "op-estilo-001",
      tipo: "actualizar",
      estado: "ok",
      estilo_id: "11111111-1111-4111-8111-111111111111",
      version_esperada: 3,
      ttl_hasta: "2026-09-10T13:00:00.000Z",
      creado_en: "2026-09-05T12:00:00.000Z",
      error: null,
    },
    {
      id: "op-estilo-002",
      tipo: "preview",
      estado: "pendiente",
      estilo_id: "22222222-2222-4222-8222-222222222222",
      version_esperada: 1,
      ttl_hasta: "2026-09-10T14:30:00.000Z",
      creado_en: "2026-09-10T12:30:00.000Z",
      error: null,
    },
  ],
  limpiezas: [
    {
      id: "limp-001",
      target: "tmp",
      path: "/tmp/mock/kie/cafe-luna-scratch",
      estado: "ok",
      creado_en: "2026-09-10T10:01:00.000Z",
      error: null,
    },
    {
      id: "limp-002",
      target: "entrada",
      path: "/mock/uploads/import-orphan.png",
      estado: "pendiente",
      creado_en: "2026-09-10T12:15:00.000Z",
      error: null,
    },
  ],
  generaciones: [
    genListo(),
    genGenerandoArtistico(),
    genRevision(),
    genPendiente(),
  ],
  importaciones: [],
};
