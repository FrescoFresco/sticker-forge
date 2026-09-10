export type EstadoGeneracion =
  | "pendiente"
  | "generando"
  | "revision_necesaria"
  | "listo"
  | "error";

export type QrModo = "ninguno" | "inmutable" | "artistico_ia";

export type FaseQr =
  | "esperando_resultado"
  | "analizando"
  | "insertando"
  | "validando"
  | "generando_qr_artistico"
  | "creando_qr_artistico"
  | "validando_qr_artistico"
  | "integrando_diseno"
  | "validando_resultado"
  | "localizando_qr_final"
  | "corrigiendo_qr_final"
  | "validando_qr_final"
  | null;

export type ImagenRef =
  | { nuevo: string }
  | { heredarDe: string }
  | { catalogoDe: string };

export interface EstiloQrConfig {
  modulos: {
    forma: string;
    color: string;
    degradado: null | {
      tipo: "lineal" | "radial";
      rotacion: number;
      colores: string[];
    };
  };
  ojos: {
    marco: { forma: string; color: string; degradado: null };
    centro: { forma: string; color: string; degradado: null };
  };
  fondo: { color: string };
  margen: number;
  correccion: "L" | "M" | "Q" | "H";
  logo: { tamano: number; margen: number; ocultarModulos: boolean };
}

export interface Generacion {
  id: string;
  creado_en: string;
  iniciado_en: string | null;
  estado: EstadoGeneracion;
  fase_qr: FaseQr;
  intentos_inicio: number;
  error_msg: string | null;
  nombre_negocio: string;
  nombre_agencia: string;
  slug_negocio: string;
  aspect_ratio: string;
  resolucion: "1K" | "2K";
  estilo_texto: string;
  qr_modo: QrModo;
  url_qr: string | null;
  qr_estilo_snapshot: EstiloQrConfig | null;
  qr_artistico_intento: number | null;
  integracion_intento: number | null;
  qr_ajustes_aplicados: string[];
  coste_ms: number | null;
  tiene_logo: boolean;
  tiene_estilo: boolean;
  tiene_logo_qr: boolean;
  tiene_resultado: boolean;
  tiene_qr_artistico: boolean;
  origen: "manual" | "importacion" | "regeneracion";
  regenerado_desde: string | null;
  archivo_origen: string | null;
  prompt_enviado: string | null;
}

export interface GeneracionDto {
  id: string;
  creado_en: string;
  iniciado_en: string | null;
  estado: EstadoGeneracion;
  fase_qr: FaseQr;
  error_msg: string | null;
  coste_ms: number | null;
  qr_modo: QrModo;
  qr_artistico_intento: number | null;
  integracion_intento: number | null;
  nombre_negocio: string;
  nombre_agencia: string;
  aspect_ratio: string;
  resolucion: "1K" | "2K";
  estilo_texto: string;
  url_qr: string | null;
  qr_estilo_snapshot: EstiloQrConfig | null;
  logo: { proxy: string } | null;
  estilo: { proxy: string } | null;
  logo_qr: { proxy: string } | null;
  resultado: { proxy: string } | null;
  qr_artistico: { proxy: string } | null;
  qr_ajustes_aplicados: string[];
  origen: Generacion["origen"];
  regenerado_desde: string | null;
  archivo_origen: string | null;
}

export interface EstiloQr {
  id: string;
  nombre: string;
  config: EstiloQrConfig;
  tiene_logo: boolean;
  creado_en: string;
  actualizado_en: string;
  archivado_en: string | null;
  version: number;
}

export interface AppStore {
  app: string;
  version: number;
  modelo_kie: string;
  cola_max_en_vuelo: number;
  generaciones: Generacion[];
  estilos_qr: EstiloQr[];
  importaciones: ImportPreviewItem[];
}

export interface ImportPreviewItem {
  id: string;
  nombre_archivo: string;
  negocio: string;
  agencia: string;
  aspecto: string;
  resolucion: "1K" | "2K";
  qr_modo: QrModo;
  url_qr: string | null;
  ok: boolean;
  error: string | null;
  manifest_version: number;
}

export interface GenerarPayload {
  negocio: string;
  agencia: string;
  aspecto: string;
  resolucion: "1K" | "2K";
  estiloTexto?: string;
  urlQr?: string;
  qrModo?: QrModo;
  confirmarGastoArtistico?: boolean;
  archivoOrigen?: string;
}

export interface Capacidades {
  formatos: string[];
  resoluciones: string[];
  qr_modos: QrModo[];
  cola_max_en_vuelo: number;
  modelo_kie: string;
}
