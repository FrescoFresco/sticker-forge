import { ESTILO_QR_DEFAULT } from "./seed";
import type { EstiloQrConfig } from "./types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asString(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function parseDegradado(
  raw: unknown,
): EstiloQrConfig["modulos"]["degradado"] {
  const d = asRecord(raw);
  if (!d) return null;
  const tipo = d.tipo === "radial" ? "radial" : "lineal";
  const colores = Array.isArray(d.colores)
    ? d.colores.filter((c): c is string => typeof c === "string")
    : [];
  if (colores.length < 2) {
    const segundo = typeof d.segundo_color === "string" ? d.segundo_color : null;
    const primero = typeof d.color === "string" ? d.color : null;
    if (primero && segundo) colores.push(primero, segundo);
    else return null;
  }
  return {
    tipo,
    rotacion: asNumber(d.rotacion, 0),
    colores: colores.slice(0, 4),
  };
}

/**
 * Fusiona un bloque qr_estilo parcial del ZIP/JSON sobre el default.
 * Tolera aliases de la app antigua (forma_modulos, marco, centro, etc.).
 */
export function mergeQrEstilo(raw: unknown): EstiloQrConfig {
  const base = structuredClone(ESTILO_QR_DEFAULT);
  const src = asRecord(raw);
  if (!src) return base;

  const modulos = asRecord(src.modulos) ?? {};
  const ojos = asRecord(src.ojos) ?? {};
  const marco =
    asRecord(ojos.marco) ??
    asRecord(src.marco) ??
    asRecord(src.patron_marco) ??
    {};
  const centro =
    asRecord(ojos.centro) ??
    asRecord(src.centro) ??
    asRecord(src.patron_centro) ??
    {};
  const fondo = asRecord(src.fondo) ?? {};
  const logo = asRecord(src.logo) ?? asRecord(src.logo_central) ?? {};

  const formaModulo = asString(
    modulos.forma ?? src.forma_modulos ?? src.forma_modulos_qr,
    base.modulos.forma,
  );
  const colorModulo = asString(
    modulos.color ?? src.color_modulos,
    base.modulos.color,
  );

  const degradado =
    parseDegradado(modulos.degradado) ??
    parseDegradado(src.degradado) ??
    (asBool(src.degradado_en_modulos, false)
      ? parseDegradado({
          tipo: src.degradado_tipo ?? "lineal",
          rotacion: src.degradado_rotacion ?? 0,
          color: colorModulo,
          segundo_color: src.degradado_segundo_color ?? "#888888",
        })
      : null);

  const correccionRaw = asString(
    src.correccion ?? src.correccion_errores,
    base.correccion,
  ).toUpperCase();
  const correccion = (["L", "M", "Q", "H"].includes(correccionRaw)
    ? correccionRaw
    : base.correccion) as EstiloQrConfig["correccion"];

  return {
    modulos: {
      forma: formaModulo,
      color: colorModulo,
      degradado,
    },
    ojos: {
      marco: {
        forma: asString(marco.forma, base.ojos.marco.forma),
        color: asString(marco.color, base.ojos.marco.color),
        degradado: null,
      },
      centro: {
        forma: asString(centro.forma, base.ojos.centro.forma),
        color: asString(centro.color, base.ojos.centro.color),
        degradado: null,
      },
    },
    fondo: {
      color: asString(fondo.color ?? src.color_fondo, base.fondo.color),
      transparente: asBool(
        fondo.transparente ?? src.fondo_transparente,
        Boolean(base.fondo.transparente),
      ),
    },
    margen: asNumber(src.margen ?? fondo.margen, base.margen),
    correccion,
    logo: {
      tamano: asNumber(logo.tamano ?? logo.tamaño, base.logo.tamano),
      margen: asNumber(logo.margen, base.logo.margen),
      ocultarModulos: asBool(
        logo.ocultarModulos ??
          logo.ocultar_modulos ??
          src.ocultar_modulos_bajo_logo,
        base.logo.ocultarModulos,
      ),
    },
  };
}
