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

export type InputRol =
  | "logo"
  | "estilo"
  | "logo_qr"
  | "nfc"
  | "qr_funcional";

export interface InputDetalle {
  hay: boolean;
  origen: string | null;
  mime: string | null;
  proxy: string | null;
  nota: string | null;
}

export type GeneracionInputs = Record<InputRol, InputDetalle>;

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

export interface QrAjusteAplicado {
  ajuste: string;
  resultado: string;
}

export interface Punto2D {
  x: number;
  y: number;
}

export interface QrZonaFinal {
  cuadrilatero: [Punto2D, Punto2D, Punto2D, Punto2D];
  escala_usada: number;
}

export interface KieState {
  model: string;
  task_id: string | null;
  callBackUrl: string | null;
  input_enviado: Record<string, unknown> | null;
  createTime: string | null;
  completeTime: string | null;
  costTime_segundos_backup: number | null;
  reserva_inicio: string | null;
}

export interface FencingState {
  lease_id: string | null;
  lease_hasta: string | null;
  reintentos_qr: number;
}

export interface ResultadoRef {
  hay: boolean;
  es_original: boolean;
  es_final: boolean;
  proxy: string | null;
}

export interface GeneracionResultados {
  original: ResultadoRef;
  final: ResultadoRef;
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
  /** Snapshot del estilo QR aplicado (alias de qr.estilo_snapshot). */
  qr_estilo_snapshot: EstiloQrConfig | null;
  qr_artistico_intento: number | null;
  integracion_intento: number | null;
  /** Ajustes de degradación QR con resultado por paso. */
  qr_ajustes_aplicados: QrAjusteAplicado[];
  qr_zona_final: QrZonaFinal | null;
  coste_ms: number | null;
  tiene_logo: boolean;
  tiene_estilo: boolean;
  tiene_logo_qr: boolean;
  tiene_resultado: boolean;
  tiene_qr_artistico: boolean;
  inputs: GeneracionInputs;
  kie: KieState;
  fencing: FencingState;
  familia_composicion: string | null;
  input_urls: string[];
  resultados: GeneracionResultados;
  origen: "manual" | "importacion" | "regeneracion";
  regenerado_desde: string | null;
  archivo_origen: string | null;
  prompt_enviado: string | null;
}

/** List/gallery DTO — hides secrets (prompt, callback, input_enviado). */
export interface GeneracionDto {
  id: string;
  creado_en: string;
  iniciado_en: string | null;
  estado: EstadoGeneracion;
  fase_qr: FaseQr;
  intentos_inicio: number;
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
  qr_ajustes_aplicados: QrAjusteAplicado[];
  qr_zona_final: QrZonaFinal | null;
  familia_composicion: string | null;
  input_urls: string[];
  resultados: GeneracionResultados;
  /** Operativos visibles en Procesando (no secretos). */
  kie_task_id: string | null;
  lease_id: string | null;
  lease_hasta: string | null;
  reintentos_qr: number;
  origen: Generacion["origen"];
  regenerado_desde: string | null;
  archivo_origen: string | null;
}

/** Detalle completo — objeto interno mock (sin API keys reales). */
export type GeneracionDetalle = Generacion;

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

export type EstiloQrOperacionTipo =
  | "crear"
  | "actualizar"
  | "archivar"
  | "duplicar"
  | "preview";

export type EstiloQrOperacionEstado =
  | "pendiente"
  | "en_curso"
  | "ok"
  | "error"
  | "expirada";

export interface EstiloQrOperacion {
  id: string;
  tipo: EstiloQrOperacionTipo;
  estado: EstiloQrOperacionEstado;
  estilo_id: string | null;
  version_esperada: number | null;
  ttl_hasta: string;
  creado_en: string;
  error: string | null;
}

export type LimpiezaEstado = "pendiente" | "ok" | "error";

export interface Limpieza {
  id: string;
  target: "entrada" | "resultado" | "qr_artistico" | "tmp" | "estilo_logo";
  path: string;
  estado: LimpiezaEstado;
  creado_en: string;
  error: string | null;
}

export interface AppStore {
  app: string;
  version: number;
  modelo_kie: string;
  cola_max_en_vuelo: number;
  generaciones: Generacion[];
  estilos_qr: EstiloQr[];
  estilos_qr_operaciones: EstiloQrOperacion[];
  limpiezas: Limpieza[];
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
  operacion_id?: string;
  ttl_hasta?: string;
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
  estiloQrId?: string;
}

export interface Capacidades {
  formatos: string[];
  resoluciones: string[];
  qr_modos: QrModo[];
  cola_max_en_vuelo: number;
  modelo_kie: string;
}

export interface FaseCatalogEntry {
  id: Exclude<FaseQr, null>;
  modos: QrModo[];
  etiqueta: string;
}

export interface DegradacionStep {
  orden: number;
  ajuste: string;
  descripcion: string;
}

export interface EscalaCatalogEntry {
  valor: number;
  uso: string;
}

export interface CapacidadesCompletas extends Capacidades {
  limites: {
    negocio_chars: number;
    agencia_chars: number;
    estilo_texto_chars: number;
    prompt_chars: number;
    cola_max_en_vuelo: number;
  };
  fases: FaseCatalogEntry[];
  degradacion: DegradacionStep[];
  escalas: EscalaCatalogEntry[];
  artistico: {
    max_intentos_qr: number;
    max_intentos_integracion: number;
  };
  futuro: {
    prompt_sets: [];
  };
}

export interface EstiloQrCreatePayload {
  nombre: string;
  config?: EstiloQrConfig;
  tiene_logo?: boolean;
}

export interface EstiloQrUpdatePayload {
  nombre?: string;
  config?: EstiloQrConfig;
  tiene_logo?: boolean;
}
