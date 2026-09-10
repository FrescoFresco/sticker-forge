import {
  aspectoParaKie,
  getIconoNfcUrl,
  getKieApiKey,
  getKieBaseUrl,
  getKieModel,
  getUrlPublica,
  isKieReal,
} from "./config";

export type KieTaskState =
  | "waiting"
  | "queuing"
  | "generating"
  | "success"
  | "fail"
  | string;

export interface KieCreateTaskInput {
  prompt: string;
  input_urls: string[];
  aspect_ratio: string;
  resolution: "1K" | "2K" | "4K";
}

export interface KieCreateTaskResult {
  taskId: string;
  raw: unknown;
}

export interface KieRecordInfo {
  taskId: string;
  state: KieTaskState;
  resultUrls: string[];
  resultJson: string | null;
  failCode: string | null;
  failMsg: string | null;
  createTime: number | string | null;
  completeTime: number | string | null;
  costTime: number | null;
  raw: unknown;
}

function authHeaders(): HeadersInit {
  const key = getKieApiKey();
  if (!key) throw new Error("KIE_API_KEY no configurada");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/**
 * Convierte proxies relativos en URLs absolutas si hay URL_PUBLICA.
 * Añade ICONO_NFC_URL si existe y no está ya.
 */
export function resolverInputUrls(proxies: string[]): string[] {
  const base = getUrlPublica();
  const out: string[] = [];

  for (const p of proxies) {
    if (!p) continue;
    if (/^https?:\/\//i.test(p)) {
      out.push(p);
      continue;
    }
    if (base && p.startsWith("/")) {
      out.push(`${base}${p}`);
    }
  }

  const nfc = getIconoNfcUrl();
  if (nfc && !out.includes(nfc)) {
    // NFC global suele ir tras logo/estilo; lo añadimos si falta
    out.push(nfc);
  }

  return out;
}

export function puedeLlamarKieConUrls(inputUrls: string[]): {
  ok: boolean;
  reason?: string;
  urls: string[];
} {
  if (!isKieReal()) {
    return { ok: false, reason: "KIE_API_KEY ausente (modo mock)", urls: [] };
  }
  const urls = resolverInputUrls(inputUrls);
  if (urls.length === 0) {
    return {
      ok: false,
      reason:
        "No hay input_urls absolutas. Configura URL_PUBLICA y/o ICONO_NFC_URL.",
      urls: [],
    };
  }
  return { ok: true, urls };
}

export async function crearTareaKie(params: {
  prompt: string;
  input_urls: string[];
  aspect_ratio: string;
  resolution: "1K" | "2K";
  callBackUrl?: string | null;
}): Promise<KieCreateTaskResult> {
  const check = puedeLlamarKieConUrls(params.input_urls);
  if (!check.ok) {
    throw new Error(check.reason || "No se puede crear tarea Kie");
  }

  const body: Record<string, unknown> = {
    model: getKieModel(),
    input: {
      prompt: params.prompt.slice(0, 20000),
      input_urls: check.urls,
      aspect_ratio: aspectoParaKie(params.aspect_ratio),
      resolution: params.resolution,
    } satisfies KieCreateTaskInput,
  };

  if (params.callBackUrl) {
    body.callBackUrl = params.callBackUrl;
  }

  const res = await fetch(`${getKieBaseUrl()}/createTask`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as {
    code?: number;
    msg?: string;
    data?: { taskId?: string };
  };

  if (!res.ok) {
    throw new Error(
      `Kie createTask HTTP ${res.status}: ${json.msg || res.statusText}`,
    );
  }

  // docs: code 200/505 success variants — accept data.taskId
  const taskId = json.data?.taskId;
  if (!taskId) {
    throw new Error(
      `Kie createTask sin taskId: ${JSON.stringify(json).slice(0, 400)}`,
    );
  }

  return { taskId, raw: json };
}

export async function consultarTareaKie(taskId: string): Promise<KieRecordInfo> {
  const res = await fetch(
    `${getKieBaseUrl()}/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
  );

  const json = (await res.json().catch(() => ({}))) as {
    code?: number;
    msg?: string;
    data?: {
      taskId?: string;
      state?: string;
      resultJson?: string;
      failCode?: string;
      failMsg?: string;
      createTime?: number | string;
      completeTime?: number | string;
      costTime?: number;
    };
  };

  if (!res.ok) {
    throw new Error(
      `Kie recordInfo HTTP ${res.status}: ${json.msg || res.statusText}`,
    );
  }

  const data = json.data ?? {};
  let resultUrls: string[] = [];
  if (data.resultJson) {
    try {
      const parsed = JSON.parse(data.resultJson) as {
        resultUrls?: string[];
      };
      resultUrls = parsed.resultUrls ?? [];
    } catch {
      resultUrls = [];
    }
  }

  return {
    taskId: data.taskId || taskId,
    state: (data.state as KieTaskState) || "waiting",
    resultUrls,
    resultJson: data.resultJson ?? null,
    failCode: data.failCode ?? null,
    failMsg: data.failMsg ?? null,
    createTime: data.createTime ?? null,
    completeTime: data.completeTime ?? null,
    costTime: data.costTime ?? null,
    raw: json,
  };
}

export function callbackUrlKie(): string | null {
  const base = getUrlPublica();
  if (!base) return null;
  return `${base}/api/aviso-kie`;
}

export function isoFromKieTime(
  value: number | string | null | undefined,
): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    // Kie a veces usa epoch ms o segundos
    const ms = value > 1e12 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  const asNum = Number(value);
  if (!Number.isNaN(asNum) && /^\d+$/.test(String(value))) {
    const ms = asNum > 1e12 ? asNum : asNum * 1000;
    return new Date(ms).toISOString();
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export { isKieReal, getKieModel };
