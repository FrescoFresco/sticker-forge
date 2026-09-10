import type {
  FaseQr,
  Generacion,
  GeneracionDto,
  InputRol,
  QrAjusteAplicado,
} from "./types";

export function labelEstado(estado: GeneracionDto["estado"]): string {
  switch (estado) {
    case "pendiente":
      return "En cola";
    case "generando":
      return "En curso";
    case "revision_necesaria":
      return "Revisión";
    case "listo":
      return "Lista";
    case "error":
      return "Error";
  }
}

export function labelFase(fase: FaseQr): string {
  if (!fase) return "—";
  const map: Record<Exclude<FaseQr, null>, string> = {
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
  return map[fase];
}

export function labelQrModo(modo: GeneracionDto["qr_modo"]): string {
  switch (modo) {
    case "ninguno":
      return "Sin QR funcional";
    case "inmutable":
      return "QR inmutable";
    case "artistico_ia":
      return "QR artístico IA";
  }
}

export function labelAjuste(ajuste: string): string {
  const map: Record<string, string> = {
    base: "Base",
    sin_logo_central: "Sin logo central",
    sin_degradados: "Sin degradados",
    modulos_redondeados: "Módulos redondeados",
    ojos_normalizados: "Ojos normalizados",
    modulos_cuadrados: "Módulos cuadrados",
  };
  return map[ajuste] ?? ajuste;
}

export function labelAjusteResultado(resultado: string): string {
  const map: Record<string, string> = {
    ok: "OK",
    ok_tras_reintento: "OK tras reintento",
    reintento: "Reintento",
    url_incorrecta: "URL incorrecta",
    fallo_final: "Fallo final",
  };
  return map[resultado] ?? resultado;
}

export function formatAjustesResumen(
  ajustes: QrAjusteAplicado[] | string[],
): string {
  if (!ajustes.length) return "—";
  return ajustes
    .map((a) => (typeof a === "string" ? a : `${a.ajuste}:${a.resultado}`))
    .join(", ");
}

export function progresoFase(g: GeneracionDto): number {
  if (g.estado === "listo") return 100;
  if (g.estado === "pendiente") return 5;
  if (g.estado === "error") return 100;
  if (g.estado === "revision_necesaria") return 90;

  const artistico = [
    "generando_qr_artistico",
    "creando_qr_artistico",
    "validando_qr_artistico",
    "integrando_diseno",
    "validando_resultado",
    "localizando_qr_final",
    "corrigiendo_qr_final",
    "validando_qr_final",
  ];
  const inmutable = [
    "esperando_resultado",
    "analizando",
    "insertando",
    "validando",
    "localizando_qr_final",
    "corrigiendo_qr_final",
    "validando_qr_final",
  ];
  const ninguno = ["esperando_resultado", "validando_resultado"];
  const fases =
    g.qr_modo === "artistico_ia"
      ? artistico
      : g.qr_modo === "inmutable"
        ? inmutable
        : ninguno;
  const idx = fases.findIndex((f) => f === g.fase_qr);
  if (idx < 0) return 15;
  return Math.round(((idx + 1) / (fases.length + 1)) * 100);
}

export function formatCoste(ms: number | null): string {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function labelOrigen(origen: Generacion["origen"]): string {
  switch (origen) {
    case "manual":
      return "Manual";
    case "importacion":
      return "Importación";
    case "regeneracion":
      return "Regeneración";
  }
}

export function labelInputRol(rol: InputRol): string {
  const map: Record<InputRol, string> = {
    logo: "Logo",
    estilo: "Estilo / moodboard",
    logo_qr: "Logo QR",
    nfc: "NFC",
    qr_funcional: "QR funcional",
  };
  return map[rol];
}

export const INPUT_ROLES: InputRol[] = [
  "logo",
  "estilo",
  "logo_qr",
  "nfc",
  "qr_funcional",
];

/** Dónde volver desde el detalle según el estado de la generación. */
export function backHrefForEstado(
  estado: GeneracionDto["estado"],
): { href: string; label: string } {
  if (estado === "pendiente" || estado === "generando") {
    return { href: "/procesando", label: "Volver a Procesando" };
  }
  return { href: "/resultados", label: "Volver a Resultados" };
}
