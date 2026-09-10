/**
 * Configuración de runtime para Pegatinas NFC Studio.
 * Sin KIE_API_KEY la app sigue en mock (timers locales).
 */

export function getKieApiKey(): string | null {
  const key = process.env.KIE_API_KEY?.trim();
  return key || null;
}

export function isKieReal(): boolean {
  return Boolean(getKieApiKey());
}

export function getKieBaseUrl(): string {
  return (
    process.env.KIE_API_BASE?.replace(/\/$/, "") ||
    "https://api.kie.ai/api/v1/jobs"
  );
}

export function getUrlPublica(): string | null {
  const url = process.env.URL_PUBLICA?.trim().replace(/\/$/, "");
  return url || null;
}

export function getIconoNfcUrl(): string | null {
  const url = process.env.ICONO_NFC_URL?.trim();
  return url || null;
}

export function getKieModel(): string {
  return process.env.KIE_MODEL?.trim() || "gpt-image-2-image-to-image";
}

/** Aspecto enviado a Kie: circulo → 1:1 */
export function aspectoParaKie(aspecto: string): string {
  if (aspecto === "circulo") return "1:1";
  return aspecto || "1:1";
}
