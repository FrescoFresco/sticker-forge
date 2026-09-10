"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  FileJson,
  Globe2,
  HelpCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GeneracionCard } from "@/components/generacion-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useGeneraciones } from "@/hooks/use-generaciones";
import type { GenerarPayload, ImportPreviewItem, QrModo } from "@/lib/types";
import { cn } from "@/lib/utils";

const FORMATOS = [
  "1:1",
  "9:16",
  "4:5",
  "16:9",
  "circulo",
  "3:2",
  "2:3",
  "4:3",
];

export function OperacionClient() {
  const { procesando, listas, cola, loading, error, refresh } =
    useGeneraciones();
  const [tab, setTab] = useState("descubrir");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportPreviewItem[] | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    negocio: "",
    agencia: "",
    aspecto: "1:1",
    resolucion: "1K" as "1K" | "2K",
    estiloTexto: "",
    urlQr: "",
    qrModo: "inmutable" as QrModo,
    confirmarGastoArtistico: false,
    encolarAlImportar: true,
  });

  const canCreate = form.negocio.trim() && form.agencia.trim();
  const canImport = files.length > 0;

  const enCursoCount = useMemo(
    () => procesando.filter((g) => g.estado === "generando").length,
    [procesando],
  );

  function onFilesChosen(list: FileList | File[]) {
    const next = Array.from(list).filter((f) => {
      const n = f.name.toLowerCase();
      return n.endsWith(".json") || n.endsWith(".zip");
    });
    setFiles(next);
    setImportResult(null);
    setMessage(null);
  }

  function importar() {
    if (!canImport) return;
    startTransition(async () => {
      const body = new FormData();
      for (const file of files) body.append("files", file);
      body.set("encolar", form.encolarAlImportar ? "1" : "0");
      const res = await fetch("/api/importar", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "Error al importar");
        return;
      }
      setImportResult(json.items as ImportPreviewItem[]);
      setFiles([]);
      setMessage(
        form.encolarAlImportar
          ? `${json.creadas?.length ?? 0} generación(es) enviadas a Procesando.`
          : "Revisión previa lista. Activa el encolado para lanzarlas.",
      );
      await refresh();
      if (form.encolarAlImportar) setTab("procesando");
    });
  }

  function crearManual() {
    if (!canCreate) return;
    startTransition(async () => {
      const payload: GenerarPayload = {
        negocio: form.negocio,
        agencia: form.agencia,
        aspecto: form.aspecto,
        resolucion: form.resolucion,
        estiloTexto: form.estiloTexto,
        urlQr: form.urlQr || undefined,
        qrModo: form.qrModo,
        confirmarGastoArtistico: form.confirmarGastoArtistico,
      };
      const res = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "No se pudo crear");
        return;
      }
      setMessage(`Creada: ${json.generacion.nombre_negocio}`);
      setForm((f) => ({
        ...f,
        negocio: "",
        estiloTexto: "",
        urlQr: "",
        confirmarGastoArtistico: false,
      }));
      await refresh();
      setTab("procesando");
    });
  }

  function regenerar(id: string) {
    startTransition(async () => {
      const res = await fetch(`/api/generaciones/${id}/regenerar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmarGasto: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? "No se pudo regenerar");
        return;
      }
      setMessage("Regeneración encolada");
      await refresh();
      setTab("procesando");
    });
  }

  return (
    <AppShell
      title="Operación"
      description="Suelta JSON/ZIP o crea una pegatina. Lo que lances aparece en Procesando → EN CURSO. Mock JSON con gpt-image-2 (Kie)."
      tabs={
        <Tabs value={tab} onValueChange={setTab} className="gap-6">
          <TabsList variant="line" className="w-full justify-start gap-4">
            <TabsTrigger value="descubrir" className="px-1">
              <Globe2 data-icon="inline-start" />
              Crear
            </TabsTrigger>
            <TabsTrigger value="procesando" className="px-1">
              <RefreshCw data-icon="inline-start" />
              Procesando
              {procesando.length > 0 ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {procesando.length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="listas" className="px-1">
              Listas
              {listas.length > 0 ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {listas.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="descubrir" className="space-y-4">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="gap-3 border-b border-border/60 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-foreground text-background">
                    <Globe2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      + Crear / importar pegatina
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Suelta un .json / .zip o un lote. También puedes crear una
                      generación manual. Todo vive en el store JSON mock.
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={form.encolarAlImportar}
                    onCheckedChange={(v) =>
                      setForm((f) => ({ ...f, encolarAlImportar: Boolean(v) }))
                    }
                    className="mt-0.5"
                  />
                  <span>
                    Al terminar la importación, encolar ya las generaciones
                    válidas. Si lo quitas, solo verás la revisión previa.
                  </span>
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" type="button" disabled>
                    <Sparkles />
                    Prompt mock
                  </Button>
                  <a
                    href="/ejemplos/generacion-ejemplo.json"
                    download
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                  >
                    <FileJson className="size-3.5" />
                    Ejemplo JSON
                  </a>
                  <Button variant="outline" size="sm" type="button" disabled>
                    <HelpCircle />
                    Cómo va el archivo
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 pt-5">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json,.zip,application/json,application/zip"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) onFilesChosen(e.target.files);
                  }}
                />

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (e.dataTransfer.files?.length) {
                      onFilesChosen(e.dataTransfer.files);
                    }
                  }}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition-colors",
                    dragging
                      ? "border-foreground bg-muted/60"
                      : "border-border bg-muted/20 hover:bg-muted/40",
                  )}
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Suelta .json o .zip aquí o elige archivo
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Una generación, lote ZIP, o JSON histórico v1–v3
                    </p>
                  </div>
                  {files.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {files.map((f) => f.name).join(", ")}
                    </p>
                  ) : null}
                </button>

                <div className="space-y-3 rounded-xl border border-border/80 p-4">
                  <p className="text-sm font-medium">o crea aquí</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="negocio">Negocio</Label>
                      <Input
                        id="negocio"
                        value={form.negocio}
                        maxLength={60}
                        placeholder="Café Luna"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, negocio: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="agencia">Agencia</Label>
                      <Input
                        id="agencia"
                        value={form.agencia}
                        maxLength={60}
                        placeholder="Estudio Norte"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, agencia: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="aspecto">Formato</Label>
                      <select
                        id="aspecto"
                        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                        value={form.aspecto}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, aspecto: e.target.value }))
                        }
                      >
                        {FORMATOS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="resolucion">Resolución</Label>
                      <select
                        id="resolucion"
                        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                        value={form.resolucion}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            resolucion: e.target.value as "1K" | "2K",
                          }))
                        }
                      >
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notas">Notas de estilo</Label>
                    <Textarea
                      id="notas"
                      value={form.estiloTexto}
                      maxLength={600}
                      placeholder="Paleta, tipografía, atmósfera…"
                      onChange={(e) =>
                        setForm((f) => ({ ...f, estiloTexto: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="qrModo">Modo QR</Label>
                      <select
                        id="qrModo"
                        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                        value={form.qrModo}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            qrModo: e.target.value as QrModo,
                          }))
                        }
                      >
                        <option value="ninguno">Sin QR funcional</option>
                        <option value="inmutable">QR inmutable</option>
                        <option value="artistico_ia">QR artístico IA</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="urlQr">URL QR</Label>
                      <Input
                        id="urlQr"
                        value={form.urlQr}
                        placeholder="https://…"
                        disabled={form.qrModo === "ninguno"}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, urlQr: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {form.qrModo === "artistico_ia" ? (
                    <label className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={form.confirmarGastoArtistico}
                        onCheckedChange={(v) =>
                          setForm((f) => ({
                            ...f,
                            confirmarGastoArtistico: Boolean(v),
                          }))
                        }
                        className="mt-0.5"
                      />
                      <span>
                        Confirmo el gasto del modo artístico (hasta 3+3
                        intentos mock de Kie / gpt-image-2).
                      </span>
                    </label>
                  ) : null}
                </div>

                {importResult ? (
                  <div className="space-y-2 rounded-xl border border-border/80 p-3">
                    <p className="text-sm font-medium">Revisión de importación</p>
                    {importResult.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {item.nombre_archivo}
                          </p>
                          <p className="truncate text-muted-foreground">
                            {item.ok
                              ? `${item.negocio} · ${item.qr_modo} · v${item.manifest_version}`
                              : item.error}
                          </p>
                        </div>
                        <Badge variant={item.ok ? "secondary" : "destructive"}>
                          {item.ok ? "ok" : "error"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : null}

                {message ? (
                  <p className="text-sm text-muted-foreground">{message}</p>
                ) : null}

                <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-xs text-muted-foreground">
                    {files.length} archivo(s) · cola {cola.en_vuelo.length}/
                    {cola.max_en_vuelo} en vuelo
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="secondary"
                      disabled={!canImport || pending}
                      onClick={importar}
                    >
                      {pending ? <Loader2 className="animate-spin" /> : null}
                      Importar
                    </Button>
                    <Button
                      disabled={!canCreate || pending}
                      onClick={crearManual}
                    >
                      {pending ? <Loader2 className="animate-spin" /> : null}
                      Crear pegatina
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procesando" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">
                  En curso {enCursoCount}/{cola.max_en_vuelo}
                </p>
                <p className="text-xs text-muted-foreground">
                  Pendientes en cola: {cola.pendientes.length}. El mock avanza
                  fases cada ~2,5s.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                <RefreshCw />
                Actualizar
              </Button>
            </div>

            {loading && procesando.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {procesando.length === 0 && !loading ? (
              <Card className="border-dashed shadow-none">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Nada en proceso. Crea o importa desde la pestaña Crear.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {procesando.map((g) => (
                  <GeneracionCard key={g.id} g={g} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="listas" className="space-y-4">
            {listas.length === 0 ? (
              <Card className="border-dashed shadow-none">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Aún no hay resultados listos o en revisión.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {listas.map((g) => (
                  <GeneracionCard
                    key={g.id}
                    g={g}
                    onRegenerar={regenerar}
                    regenerando={pending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      }
    />
  );
}
