import type {
  AppStore,
  EstiloQrConfig,
  GeneracionInputs,
  KieState,
  FencingState,
  GeneracionResultados,
} from "./types";

/** Plantilla de estilo QR (no es un estilo guardado del catálogo). */
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

/** Store inicial vacío: sin generaciones, estilos ni limpiezas de demo. */
export const SEED_STORE: AppStore = {
  app: "pegatinas-nfc-studio",
  version: 1,
  modelo_kie: "gpt-image-2-image-to-image",
  cola_max_en_vuelo: 3,
  estilos_qr: [],
  estilos_qr_operaciones: [],
  limpiezas: [],
  generaciones: [],
  importaciones: [],
};
