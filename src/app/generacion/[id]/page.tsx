"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-helpers/data-table";
import { EmptyState } from "@/components/ui-helpers/empty-state";
import { JsonBlock } from "@/components/ui-helpers/json-block";
import { StatusBadge } from "@/components/ui-helpers/status-badge";
import {
  INPUT_ROLES,
  backHrefForEstado,
  formatCoste,
  formatFecha,
  labelAjuste,
  labelAjusteResultado,
  labelFase,
  labelInputRol,
  labelOrigen,
  labelQrModo,
} from "@/lib/labels";
import type { GeneracionDetalle } from "@/lib/types";
import { cn } from "@/lib/utils";

function ArtifactChips({ g }: { g: GeneracionDetalle }) {
  const chips: { on: boolean; label: string }[] = [
    { on: g.tiene_logo, label: "Logo" },
    { on: g.tiene_estilo, label: "Estilo" },
    { on: g.tiene_logo_qr, label: "Logo QR" },
    { on: g.tiene_resultado, label: "Resultado" },
    { on: g.tiene_qr_artistico, label: "QR artístico" },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <Badge
          key={c.label}
          variant={c.on ? "secondary" : "outline"}
          className={
            c.on ? "rounded-md" : "rounded-md text-muted-foreground opacity-60"
          }
        >
          {c.on ? c.label : `Sin ${c.label.toLowerCase()}`}
        </Badge>
      ))}
    </div>
  );
}

function KvRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-border/60 py-2 sm:grid-cols-[minmax(10rem,14rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
      <dd className="break-all font-mono text-xs text-foreground sm:text-sm">
        {v ?? "—"}
      </dd>
    </div>
  );
}

const TABS = [
  ["resumen", "Resumen"],
  ["entradas", "Entradas"],
  ["prompt", "Prompt"],
  ["kie", "Kie"],
  ["qr", "QR"],
  ["resultado", "Resultado"],
  ["json", "JSON"],
] as const;

export default function GeneracionDetallePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [generacion, setGeneracion] = useState<GeneracionDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenOpen, setRegenOpen] = useState(false);
  const [confirmarGasto, setConfirmarGasto] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("resumen");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/generacion/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setGeneracion(null);
        setError("Generación no encontrada");
        return;
      }
      if (!res.ok) {
        setError("No se pudo cargar la generación");
        return;
      }
      const json = (await res.json()) as { generacion: GeneracionDetalle };
      setGeneracion(json.generacion);
    } catch {
      setError("Error de red al cargar la generación");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRegenerar() {
    if (!generacion) return;
    setRegenBusy(true);
    setRegenError(null);
    try {
      const res = await fetch(`/api/generaciones/${generacion.id}/regenerar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmarGasto }),
      });
      const json = (await res.json()) as {
        generacion?: GeneracionDetalle;
        error?: string;
      };
      if (!res.ok) {
        setRegenError(json.error ?? "No se pudo regenerar");
        return;
      }
      setRegenOpen(false);
      setConfirmarGasto(false);
      if (json.generacion?.id) {
        router.push(`/generacion/${json.generacion.id}`);
      } else {
        void load();
      }
    } catch {
      setRegenError("Error de red al regenerar");
    } finally {
      setRegenBusy(false);
    }
  }

  function exportJson() {
    if (!generacion) return;
    const blob = new Blob([JSON.stringify(generacion, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pegatina-${generacion.slug_negocio || generacion.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const back = generacion
    ? backHrefForEstado(generacion.estado)
    : { href: "/resultados", label: "Volver" };

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Link
            href={back.href}
            className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            {back.label}
          </Link>

          {generacion ? (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {generacion.nombre_negocio}
                </h1>
                <StatusBadge estado={generacion.estado} />
              </div>
              <p className="text-sm text-muted-foreground">
                {generacion.nombre_agencia} ·{" "}
                <span className="font-mono text-xs">{generacion.id}</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Generación
              </h1>
              {id ? (
                <p className="font-mono text-sm text-muted-foreground">{id}</p>
              ) : null}
            </div>
          )}
        </div>

        {loading ? (
          <EmptyState
            title="Cargando ficha…"
            description="Leyendo la generación completa desde el mock."
          />
        ) : error || !generacion ? (
          <EmptyState
            title={error ?? "Sin datos"}
            description="Comprueba el id o vuelve a la cola / resultados."
            action={
              <Link
                href={back.href}
                className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                {back.label}
              </Link>
            }
          />
        ) : (
          <div className="flex w-full flex-col gap-4">
            <div
              role="tablist"
              aria-label="Secciones de la generación"
              className="flex flex-wrap gap-1 border-b border-border/80 pb-1"
            >
              {TABS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "resumen" ? (
            <div className="flex flex-col gap-4">
              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-2 text-sm font-medium">Identidad</h2>
                <dl>
                  <KvRow k="negocio" v={generacion.nombre_negocio} />
                  <KvRow k="agencia" v={generacion.nombre_agencia} />
                  <KvRow k="slug" v={generacion.slug_negocio} />
                  <KvRow k="aspect_ratio" v={generacion.aspect_ratio} />
                  <KvRow k="resolucion" v={generacion.resolucion} />
                  <KvRow k="qr_modo" v={labelQrModo(generacion.qr_modo)} />
                  <KvRow k="url_qr" v={generacion.url_qr ?? "—"} />
                  <KvRow k="estilo_texto" v={generacion.estilo_texto || "—"} />
                </dl>
              </section>

              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-2 text-sm font-medium">Estado y fechas</h2>
                <dl>
                  <KvRow
                    k="estado"
                    v={<StatusBadge estado={generacion.estado} />}
                  />
                  <KvRow k="fase_qr" v={labelFase(generacion.fase_qr)} />
                  <KvRow
                    k="intentos_inicio"
                    v={String(generacion.intentos_inicio)}
                  />
                  <KvRow k="creado_en" v={formatFecha(generacion.creado_en)} />
                  <KvRow
                    k="iniciado_en"
                    v={formatFecha(generacion.iniciado_en)}
                  />
                  <KvRow k="coste" v={formatCoste(generacion.coste_ms)} />
                  <KvRow k="error_msg" v={generacion.error_msg ?? "—"} />
                </dl>
              </section>

              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-2 text-sm font-medium">Origen</h2>
                <dl>
                  <KvRow k="origen" v={labelOrigen(generacion.origen)} />
                  <KvRow
                    k="regenerado_desde"
                    v={
                      generacion.regenerado_desde ? (
                        <Link
                          href={`/generacion/${generacion.regenerado_desde}`}
                          className="text-foreground underline-offset-2 hover:underline"
                        >
                          {generacion.regenerado_desde}
                        </Link>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <KvRow
                    k="archivo_origen"
                    v={generacion.archivo_origen ?? "—"}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-2 text-sm font-medium">Fencing</h2>
                <dl>
                  <KvRow
                    k="lease_id"
                    v={generacion.fencing.lease_id ?? "—"}
                  />
                  <KvRow
                    k="lease_hasta"
                    v={formatFecha(generacion.fencing.lease_hasta)}
                  />
                  <KvRow
                    k="reintentos_qr"
                    v={String(generacion.fencing.reintentos_qr)}
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-3 text-sm font-medium">Artefactos</h2>
                <ArtifactChips g={generacion} />
              </section>
            </div>
            ) : null}

            {tab === "entradas" ? (
            <div className="flex flex-col gap-4">
              <DataTable caption="Entradas por rol">
                <TableHeader>
                  <TableRow>
                    <TableHead>rol</TableHead>
                    <TableHead>hay</TableHead>
                    <TableHead>origen</TableHead>
                    <TableHead>proxy</TableHead>
                    <TableHead>nota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INPUT_ROLES.map((rol) => {
                    const row = generacion.inputs[rol];
                    return (
                      <TableRow key={rol}>
                        <TableCell className="font-medium">
                          {labelInputRol(rol)}
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {rol}
                          </div>
                        </TableCell>
                        <TableCell>{row.hay ? "sí" : "no"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.origen ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[14rem] truncate font-mono text-xs">
                          {row.proxy ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.nota ?? (row.mime ? `mime: ${row.mime}` : "—")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </DataTable>
            </div>
            ) : null}

            {tab === "prompt" ? (
            <div className="flex flex-col gap-4">
              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-2 text-sm font-medium">
                  familia_composicion
                </h2>
                <p className="font-mono text-sm">
                  {generacion.familia_composicion ?? "—"}
                </p>
              </section>
              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-2 text-sm font-medium">input_urls</h2>
                {generacion.input_urls.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin URLs</p>
                ) : (
                  <ol className="list-decimal space-y-1 pl-5 font-mono text-xs">
                    {generacion.input_urls.map((url) => (
                      <li key={url} className="break-all">
                        {url}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
              <JsonBlock
                title="prompt_enviado"
                data={generacion.prompt_enviado ?? "(vacío)"}
                defaultOpen
              />
            </div>
            ) : null}

            {tab === "kie" ? (
            <div className="flex flex-col gap-4">
              <DataTable caption="Estado Kie">
                <TableHeader>
                  <TableRow>
                    <TableHead>clave</TableHead>
                    <TableHead>valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    [
                      ["model", generacion.kie.model],
                      ["task_id", generacion.kie.task_id],
                      ["callBackUrl", generacion.kie.callBackUrl],
                      ["createTime", generacion.kie.createTime],
                      ["completeTime", generacion.kie.completeTime],
                      [
                        "costTime_segundos_backup",
                        generacion.kie.costTime_segundos_backup,
                      ],
                      ["reserva_inicio", generacion.kie.reserva_inicio],
                    ] as const
                  ).map(([clave, valor]) => (
                    <TableRow key={clave}>
                      <TableCell className="font-mono text-xs">{clave}</TableCell>
                      <TableCell className="break-all font-mono text-xs">
                        {valor == null ? "—" : String(valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
              <JsonBlock
                title="input_enviado"
                data={generacion.kie.input_enviado ?? null}
                defaultOpen
              />
            </div>
            ) : null}

            {tab === "qr" ? (
            <div className="flex flex-col gap-4">
              <section className="rounded-lg border border-border/80 bg-background p-4">
                <h2 className="mb-2 text-sm font-medium">Intentos</h2>
                <dl>
                  <KvRow
                    k="qr_artistico_intento"
                    v={
                      generacion.qr_artistico_intento == null
                        ? "—"
                        : String(generacion.qr_artistico_intento)
                    }
                  />
                  <KvRow
                    k="integracion_intento"
                    v={
                      generacion.integracion_intento == null
                        ? "—"
                        : String(generacion.integracion_intento)
                    }
                  />
                  <KvRow
                    k="reintentos_qr"
                    v={String(generacion.fencing.reintentos_qr)}
                  />
                </dl>
              </section>

              <JsonBlock
                title="qr_estilo_snapshot"
                data={generacion.qr_estilo_snapshot}
                defaultOpen={!generacion.qr_estilo_snapshot}
              />

              <DataTable caption="Ajustes QR aplicados">
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>ajuste</TableHead>
                    <TableHead>resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generacion.qr_ajustes_aplicados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Sin ajustes
                      </TableCell>
                    </TableRow>
                  ) : (
                    generacion.qr_ajustes_aplicados.map((a, i) => (
                      <TableRow key={`${a.ajuste}-${i}`}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          {labelAjuste(a.ajuste)}
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {a.ajuste}
                          </div>
                        </TableCell>
                        <TableCell>
                          {labelAjusteResultado(a.resultado)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </DataTable>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-medium">zona_final · puntos</h2>
                  {generacion.qr_zona_final ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        escala_usada:{" "}
                        <span className="font-mono text-foreground">
                          {generacion.qr_zona_final.escala_usada}
                        </span>
                      </p>
                      <DataTable>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>x</TableHead>
                            <TableHead>y</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {generacion.qr_zona_final.cuadrilatero.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell className="font-mono">{p.x}</TableCell>
                              <TableCell className="font-mono">{p.y}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </DataTable>
                    </>
                  ) : (
                    <EmptyState
                      title="Sin zona final"
                      description="Aún no hay cuadrilátero localizado."
                      className="py-8"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-medium">Vista zona QR</h2>
                  <div
                    className="relative aspect-square w-full overflow-hidden rounded-lg border border-dashed border-border/80 bg-neutral-100"
                    aria-label="Placeholder visual de zona QR"
                  >
                    {generacion.qr_zona_final ? (
                      <svg
                        viewBox="0 0 1 1"
                        className="absolute inset-0 size-full"
                        preserveAspectRatio="none"
                      >
                        <polygon
                          points={generacion.qr_zona_final.cuadrilatero
                            .map((p) => `${p.x},${p.y}`)
                            .join(" ")}
                          fill="rgb(0 0 0 / 0.08)"
                          stroke="currentColor"
                          strokeWidth={0.008}
                          className="text-foreground"
                        />
                        {generacion.qr_zona_final.cuadrilatero.map((p, i) => (
                          <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={0.02}
                            className="fill-foreground"
                          />
                        ))}
                      </svg>
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        Sin overlay
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            ) : null}

            {tab === "resultado" ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["original", generacion.resultados.original],
                    ["final", generacion.resultados.final],
                  ] as const
                ).map(([name, ref]) => (
                  <section
                    key={name}
                    className="flex flex-col gap-3 rounded-lg border border-border/80 bg-background p-4"
                  >
                    <h2 className="text-sm font-medium capitalize">{name}</h2>
                    <dl>
                      <KvRow k="hay" v={ref.hay ? "sí" : "no"} />
                      <KvRow
                        k="es_original"
                        v={ref.es_original ? "sí" : "no"}
                      />
                      <KvRow k="es_final" v={ref.es_final ? "sí" : "no"} />
                      <KvRow k="proxy" v={ref.proxy ?? "—"} />
                    </dl>
                    <Button variant="outline" disabled className="w-fit">
                      <Download data-icon="inline-start" />
                      Descargar {name}
                    </Button>
                  </section>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={exportJson}>
                  Exportar JSON
                </Button>
                {generacion.estado === "revision_necesaria" ? (
                  <Button onClick={() => setRegenOpen(true)}>
                    <RefreshCw data-icon="inline-start" />
                    Regenerar
                  </Button>
                ) : null}
              </div>

              <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Regenerar pegatina</DialogTitle>
                    <DialogDescription>
                      Se encola una nueva generación a partir de esta ficha.
                      Confirma el gasto si el modo es artístico.
                    </DialogDescription>
                  </DialogHeader>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={confirmarGasto}
                      onCheckedChange={(v) => setConfirmarGasto(v)}
                    />
                    Confirmar gasto artístico
                  </label>
                  {regenError ? (
                    <p className="text-sm text-destructive">{regenError}</p>
                  ) : null}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setRegenOpen(false)}
                      disabled={regenBusy}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => void handleRegenerar()}
                      disabled={regenBusy}
                    >
                      {regenBusy ? "Encolando…" : "Confirmar regeneración"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            ) : null}

            {tab === "json" ? (
            <div className="flex flex-col gap-4">
              <JsonBlock
                title="Generación completa"
                data={generacion}
                defaultOpen
              />
            </div>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
