"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JsonBlock } from "@/components/ui-helpers/json-block";
import { useGeneraciones } from "@/hooks/use-generaciones";
import type { EstiloQr, GenerarPayload, QrModo } from "@/lib/types";

const ASPECTOS = [
  "1:1",
  "4:5",
  "5:4",
  "3:4",
  "4:3",
  "2:3",
  "3:2",
  "9:16",
  "16:9",
  "circulo",
  "auto",
];

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function NuevaPage() {
  const router = useRouter();
  const { queueSummary } = useGeneraciones();

  const [negocio, setNegocio] = useState("");
  const [agencia, setAgencia] = useState("");
  const [aspecto, setAspecto] = useState("1:1");
  const [resolucion, setResolucion] = useState<"1K" | "2K">("1K");
  const [estiloTexto, setEstiloTexto] = useState("");
  const [qrModo, setQrModo] = useState<QrModo>("ninguno");
  const [urlQr, setUrlQr] = useState("");
  const [estiloQrId, setEstiloQrId] = useState("");
  const [confirmarGastoArtistico, setConfirmarGastoArtistico] = useState(false);
  const [estilos, setEstilos] = useState<EstiloQr[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/estilos-qr", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { estilos?: EstiloQr[] };
        if (!cancelled) {
          setEstilos((json.estilos ?? []).filter((e) => !e.archivado_en));
        }
      } catch {
        /* optional catalogue */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const payload: GenerarPayload = useMemo(() => {
    const body: GenerarPayload = {
      negocio: negocio.trim(),
      agencia: agencia.trim(),
      aspecto,
      resolucion,
      estiloTexto: estiloTexto.trim() || undefined,
      qrModo,
    };
    if (qrModo !== "ninguno") {
      body.urlQr = urlQr.trim() || undefined;
      if (estiloQrId) body.estiloQrId = estiloQrId;
    }
    if (qrModo === "artistico_ia") {
      body.confirmarGastoArtistico = confirmarGastoArtistico;
    }
    return body;
  }, [
    negocio,
    agencia,
    aspecto,
    resolucion,
    estiloTexto,
    qrModo,
    urlQr,
    estiloQrId,
    confirmarGastoArtistico,
  ]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "No se pudo crear la pegatina");
      router.push("/procesando");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell queue={queueSummary}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver a Entrada
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Nueva pegatina
            </h1>
            <p className="text-sm text-muted-foreground">
              Composición manual. El request JSON se muestra abajo antes de
              encolar.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="negocio">Negocio</Label>
              <Input
                id="negocio"
                required
                maxLength={60}
                value={negocio}
                onChange={(e) => setNegocio(e.target.value)}
                placeholder="Nombre del negocio"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agencia">Agencia</Label>
              <Input
                id="agencia"
                required
                maxLength={60}
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
                placeholder="Nombre de la agencia"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aspecto">Aspecto</Label>
              <select
                id="aspecto"
                className={selectClass}
                value={aspecto}
                onChange={(e) => setAspecto(e.target.value)}
              >
                {ASPECTOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="resolucion">Resolución</Label>
              <select
                id="resolucion"
                className={selectClass}
                value={resolucion}
                onChange={(e) => setResolucion(e.target.value as "1K" | "2K")}
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estiloTexto">Estilo (texto)</Label>
            <Textarea
              id="estiloTexto"
              value={estiloTexto}
              onChange={(e) => setEstiloTexto(e.target.value)}
              maxLength={600}
              placeholder="Indicaciones de estilo para la pegatina"
              className="min-h-24"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qrModo">Modo QR</Label>
              <select
                id="qrModo"
                className={selectClass}
                value={qrModo}
                onChange={(e) => setQrModo(e.target.value as QrModo)}
              >
                <option value="ninguno">Sin QR funcional</option>
                <option value="inmutable">QR inmutable</option>
                <option value="artistico_ia">QR artístico IA</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="urlQr">URL QR</Label>
              <Input
                id="urlQr"
                type="url"
                value={urlQr}
                onChange={(e) => setUrlQr(e.target.value)}
                disabled={qrModo === "ninguno"}
                placeholder="https://…"
                required={qrModo !== "ninguno"}
              />
            </div>
          </div>

          {qrModo !== "ninguno" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="estiloQrId">Estilo QR (catálogo)</Label>
              <select
                id="estiloQrId"
                className={selectClass}
                value={estiloQrId}
                onChange={(e) => setEstiloQrId(e.target.value)}
              >
                <option value="">Por defecto</option>
                {estilos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} (v{e.version})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {qrModo === "artistico_ia" ? (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={confirmarGastoArtistico}
                onCheckedChange={setConfirmarGastoArtistico}
                className="mt-0.5"
              />
              <span>
                Confirmar gasto artístico — el modo artístico consume intentos
                de generación QR.
              </span>
            </label>
          ) : null}

          <JsonBlock title="Request JSON" data={payload} />

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Encolando…" : "Generar pegatina"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/")}
              disabled={busy}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
