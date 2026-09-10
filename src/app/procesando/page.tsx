"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-helpers/data-table";
import { EmptyState } from "@/components/ui-helpers/empty-state";
import { StatusBadge } from "@/components/ui-helpers/status-badge";
import { useGeneraciones } from "@/hooks/use-generaciones";
import {
  formatFecha,
  labelFase,
  labelQrModo,
  progresoFase,
} from "@/lib/labels";
import type { GeneracionDto } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProcesandoPage() {
  const router = useRouter();
  const { generaciones, cola, queueSummary, loading, error } =
    useGeneraciones();
  const [modelo, setModelo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadEstado() {
      try {
        const res = await fetch("/api/estado", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          modelo_kie?: string;
          cola?: { modelo?: string };
        };
        if (!cancelled) {
          setModelo(json.cola?.modelo ?? json.modelo_kie ?? null);
        }
      } catch {
        /* optional */
      }
    }
    void loadEstado();
    const id = setInterval(() => void loadEstado(), 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const enVuelo = useMemo(
    () =>
      generaciones.filter(
        (g) => g.estado === "generando" || cola.en_vuelo.includes(g.id),
      ),
    [generaciones, cola.en_vuelo],
  );

  const enCola = useMemo(
    () =>
      generaciones.filter(
        (g) => g.estado === "pendiente" || cola.pendientes.includes(g.id),
      ),
    [generaciones, cola.pendientes],
  );

  const goDetalle = (g: GeneracionDto) => {
    router.push(`/generacion/${g.id}`);
  };

  return (
    <AppShell queue={queueSummary}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Procesando</h1>
          <p className="text-sm text-muted-foreground">
            Cola en vuelo y pendientes. Actualización ~2.5s.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border/80 bg-background px-3 py-2.5 text-sm">
          <span>
            <span className="text-muted-foreground">max</span>{" "}
            <span className="font-medium">{cola.max_en_vuelo}</span>
          </span>
          <span>
            <span className="text-muted-foreground">en_vuelo</span>{" "}
            <span className="font-medium">{cola.en_vuelo.length}</span>
          </span>
          <span>
            <span className="text-muted-foreground">pendientes</span>{" "}
            <span className="font-medium">{cola.pendientes.length}</span>
          </span>
          {modelo ? (
            <span>
              <span className="text-muted-foreground">modelo</span>{" "}
              <span className="font-mono text-xs font-medium">{modelo}</span>
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            En vuelo
          </h2>
          {enVuelo.length === 0 && !loading ? (
            <EmptyState
              title="Nada en vuelo"
              description="Cuando una pegatina tome un slot de cola, aparecerá aquí."
              className="py-8"
            />
          ) : (
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>negocio</TableHead>
                  <TableHead>estado</TableHead>
                  <TableHead>fase</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>intentos</TableHead>
                  <TableHead>task/lease</TableHead>
                  <TableHead>formato</TableHead>
                  <TableHead>modo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enVuelo.map((g) => {
                  const pct = progresoFase(g);
                  const taskLease = [g.kie_task_id, g.lease_id]
                    .filter(Boolean)
                    .join(" · ");
                  const intentos = [
                    g.intentos_inicio,
                    g.qr_artistico_intento != null
                      ? `qr:${g.qr_artistico_intento}`
                      : null,
                    g.integracion_intento != null
                      ? `int:${g.integracion_intento}`
                      : null,
                    g.reintentos_qr ? `re:${g.reintentos_qr}` : null,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <TableRow
                      key={g.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => goDetalle(g)}
                    >
                      <TableCell className="font-medium">
                        {g.nombre_negocio}
                      </TableCell>
                      <TableCell>
                        <StatusBadge estado={g.estado} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {labelFase(g.fase_qr)}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-[4.5rem] items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                            <div
                              className="h-full rounded-full bg-foreground/70"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-xs text-muted-foreground">
                            {pct}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {intentos || "—"}
                      </TableCell>
                      <TableCell
                        className="max-w-[10rem] truncate font-mono text-xs text-muted-foreground"
                        title={taskLease || undefined}
                      >
                        {taskLease || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {g.aspect_ratio} · {g.resolucion}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {labelQrModo(g.qr_modo)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            En cola
          </h2>
          {enCola.length === 0 && !loading ? (
            <EmptyState
              title="Cola vacía"
              description="Las pegatinas pendientes de slot aparecerán en esta tabla."
              className="py-8"
            />
          ) : (
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>negocio</TableHead>
                  <TableHead>estado</TableHead>
                  <TableHead>origen</TableHead>
                  <TableHead>archivo</TableHead>
                  <TableHead>creado_en</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enCola.map((g) => (
                  <TableRow
                    key={g.id}
                    className={cn("cursor-pointer hover:bg-muted/50")}
                    onClick={() => goDetalle(g)}
                  >
                    <TableCell className="font-medium">
                      {g.nombre_negocio}
                    </TableCell>
                    <TableCell>
                      <StatusBadge estado={g.estado} />
                    </TableCell>
                    <TableCell className="text-xs">{g.origen}</TableCell>
                    <TableCell className="max-w-[12rem] truncate font-mono text-xs text-muted-foreground">
                      {g.archivo_origen ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatFecha(g.creado_en)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </section>
      </div>
    </AppShell>
  );
}
