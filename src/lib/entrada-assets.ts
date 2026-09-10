import type { InputRol } from "./types";

export type EntradaAsset = {
  bytes: Uint8Array;
  mime: string;
};

type AssetsByRol = Partial<Record<InputRol, EntradaAsset>>;

declare global {
  // eslint-disable-next-line no-var
  var __pegatinasEntradaAssets: Map<string, AssetsByRol> | undefined;
}

function bucket(): Map<string, AssetsByRol> {
  if (!globalThis.__pegatinasEntradaAssets) {
    globalThis.__pegatinasEntradaAssets = new Map();
  }
  return globalThis.__pegatinasEntradaAssets;
}

export function guardarEntradaAssets(
  generacionId: string,
  assets: AssetsByRol,
): void {
  const current = bucket().get(generacionId) ?? {};
  bucket().set(generacionId, { ...current, ...assets });
}

export function getEntradaAsset(
  generacionId: string,
  rol: InputRol,
): EntradaAsset | null {
  return bucket().get(generacionId)?.[rol] ?? null;
}

export function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}
