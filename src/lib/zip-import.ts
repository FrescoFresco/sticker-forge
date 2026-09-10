import JSZip from "jszip";
import { mimeFromName, type EntradaAsset } from "./entrada-assets";
import type { InputRol, QrModo } from "./types";

export type ZipManifest = {
  negocio: string;
  agencia: string;
  aspecto: string;
  resolucion: "1K" | "2K";
  estilo_texto: string;
  qr_modo: QrModo;
  url_qr: string | null;
  version: number;
};

export type ZipImportParsed = {
  manifest: ZipManifest;
  assets: Partial<Record<InputRol, EntradaAsset>>;
};

const IMAGE_ROLES: { rol: InputRol; names: string[] }[] = [
  { rol: "logo", names: ["logo"] },
  { rol: "estilo", names: ["estilo", "moodboard", "style"] },
  { rol: "logo_qr", names: ["logo_qr", "logo-qr", "logoqr"] },
  { rol: "nfc", names: ["nfc", "icono_nfc", "icono-nfc"] },
];

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i;

function basename(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

function stem(filename: string): string {
  return filename.replace(IMAGE_EXT, "").toLowerCase();
}

function parseManifestJson(raw: unknown): ZipManifest {
  const root = (raw ?? {}) as Record<string, unknown>;
  const gen = (root.generacion ?? root) as Record<string, unknown>;
  const negocio = String(gen.negocio ?? gen.nombre_negocio ?? "").trim();
  const agencia = String(gen.agencia ?? gen.nombre_agencia ?? "").trim();
  if (!negocio) throw new Error("El ZIP: falta negocio en generacion.json");
  if (!agencia) throw new Error("El ZIP: falta agencia en generacion.json");

  const qrModo = String(gen.qr_modo ?? gen.qrModo ?? "ninguno") as QrModo;
  if (!["ninguno", "inmutable", "artistico_ia"].includes(qrModo)) {
    throw new Error(`El ZIP: qr_modo inválido (${qrModo})`);
  }

  const urlQrRaw = gen.url_qr ?? gen.urlQr ?? null;
  const urlQr =
    urlQrRaw === null || urlQrRaw === undefined || urlQrRaw === ""
      ? null
      : String(urlQrRaw).trim();

  if (qrModo !== "ninguno") {
    if (!urlQr || !/^https:\/\//i.test(urlQr)) {
      throw new Error(
        "El ZIP: url_qr debe ser https:// cuando qr_modo no es ninguno",
      );
    }
  }

  const resolucion = String(gen.resolucion ?? "1K");
  if (resolucion !== "1K" && resolucion !== "2K") {
    throw new Error('El ZIP: resolucion debe ser "1K" o "2K"');
  }

  return {
    negocio,
    agencia,
    aspecto: String(gen.aspecto ?? gen.aspect_ratio ?? "1:1"),
    resolucion,
    estilo_texto: String(gen.estilo_texto ?? gen.estiloTexto ?? "").slice(
      0,
      600,
    ),
    qr_modo: qrModo,
    url_qr: urlQr,
    version: Number(root.version ?? gen.version ?? 3),
  };
}

function matchRole(path: string): InputRol | null {
  const file = basename(path);
  if (!IMAGE_EXT.test(file)) return null;
  const s = stem(file);
  for (const { rol, names } of IMAGE_ROLES) {
    if (names.includes(s)) return rol;
  }
  return null;
}

/**
 * Parsea un ZIP de pegatina completo:
 * - generacion.json (o manifest.json) obligatorio
 * - logo.(png|jpg|webp…) obligatorio para generación real con marca
 * - estilo / moodboard opcional
 * - logo_qr / nfc opcionales
 */
export async function parsePegatinaZip(
  bytes: ArrayBuffer,
): Promise<ZipImportParsed> {
  const zip = await JSZip.loadAsync(bytes);
  const paths = Object.keys(zip.files).filter((p) => !zip.files[p]?.dir);

  const manifestPath = paths.find((p) => {
    const b = basename(p).toLowerCase();
    return (
      b === "generacion.json" ||
      b === "manifest.json" ||
      b === "pegatina.json"
    );
  });

  if (!manifestPath) {
    throw new Error(
      "El ZIP debe incluir generacion.json (o manifest.json) en la raíz o en una carpeta",
    );
  }

  const manifestText = await zip.files[manifestPath]!.async("string");
  let raw: unknown;
  try {
    raw = JSON.parse(manifestText);
  } catch {
    throw new Error("generacion.json no es JSON válido");
  }
  const manifest = parseManifestJson(raw);

  const assets: Partial<Record<InputRol, EntradaAsset>> = {};
  for (const path of paths) {
    const rol = matchRole(path);
    if (!rol || assets[rol]) continue;
    const fileBytes = await zip.files[path]!.async("uint8array");
    assets[rol] = {
      bytes: fileBytes,
      mime: mimeFromName(basename(path)),
    };
  }

  if (!assets.logo) {
    throw new Error(
      "El ZIP debe incluir logo.png (o .jpg/.webp) — obligatorio para generar la imagen completa",
    );
  }

  return { manifest, assets };
}
