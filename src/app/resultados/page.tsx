"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { StatusBadge } from "@/components/ui-helpers/status-badge";
import { useGeneraciones } from "@/hooks/use-generaciones";
import { formatCoste, labelQrModo } from "@/lib/labels";
import type { GeneracionDto } from "@/lib/types";
import { cn } from "@/lib/utils";

type Vista = "grid" | "tabla";
type Filtro = "all" | "listo" | "revision" | "error";

function motivoDe(g: GeneracionDto): string {
  if (g.estado === "error") return g.error_msg ?? "Error";
  if (g.estado === "revision_necesaria") {
    if (g.qr_ajustes_aplicados.length) {
      const last = g.qr_ajustes_aplicados[g.qr_ajustes_aplicados.length - 1];
      return `${last.ajuste}: ${last.resultado}`;
    }
    return g.error_msg ?? "Revisión necesaria";
  }
  return "—";
}

export default function ResultadosPage() {
  const { listas, queueSummary, loading, error, refresh } = useGeneraciones();
  const [vista, setVista] = useState<Vista>("tabla");
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [regenId, setRegenId] = useState<string | null>(null);
  const [confirmarGasto, setConfirmarGasto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    return listas.filter((g) => {
      if (filtro === "all") return true;
      if (filtro === "listo") return g.estado === "listo";
      if (filtro === "revision") return g.estado === "revision_necesaria";
      if (filtro === "error") return g.estado === "error";
      return true;
    });
  }, [listas, filtro]);

  const regenTarget = listas.find((g) => g.id === regenId) ?? null;

  const exportar = async (g: GeneracionDto) => {
    try {
      const res = await fetch(`/api/generacion/${g.id}`, { cache: "no-store" });
      if (!res.ok) {
        window.open(`/api/generacion/${g.id}`, "_blank");
        return;
      }
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pegatina-${g.nombre_negocio || g.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`/api/generacion/${g.id}`, "_blank");
    }
  };

  const regenerar = async () => {
    if (!regenId || !confirmarGasto) return;
    setBusy(true);
    setRegenError(null);
    try {
      const res = await fetch(`/api/generaciones/${regenId}/regenerar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmarGasto: true }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "No se pudo regenerar");
      setRegenId(null);
      setConfirmarGasto(false);
      await refresh();
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "Error al regenerar");
    } finally {
      setBusy(false);
    }
  };

  const filtros: { id: Filtro; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "listo", label: "Listo" },
    { id: "revision", label: "Revisión" },
    { id: "error", label: "Error" },
  ];

  return (
    <AppShell queue={queueSummary}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Resultados</h1>
            <p className="text-sm text-muted-foreground">
              Pegatinas finalizadas, en revisión o con error.
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-border/80 bg-background p-0.5">
            {(["grid", "tabla"] as Vista[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  vista === v
                    ? "bg-neutral-100 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "grid" ? "Grid" : "Tabla"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filtro === f.id
                  ? "bg-foreground text-background"
                  : "bg-neutral-100 text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && filtradas.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="Cuando una generación termine, aparecerá aquí."
          />
        ) : null}

        {vista === "tabla" && filtradas.length > 0 ? (
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>negocio</TableHead>
                <TableHead>estado</TableHead>
                <TableHead>modo</TableHead>
                <TableHead>formato</TableHead>
                <TableHead>coste</TableHead>
                <TableHead>motivo</TableHead>
                <TableHead>acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    {g.nombre_negocio}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={g.estado} />
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {labelQrModo(g.qr_modo)}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {g.aspect_ratio} · {g.resolucion}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">
                    {formatCoste(g.coste_ms)}
                  </TableCell>
                  <TableCell className="max-w-[14rem] truncate text-xs text-muted-foreground">
                    {motivoDe(g)}
                  </TableCell>
                  <TableCell>
                    <Acciones
                      g={g}
                      onExport={() => void exportar(g)}
                      onRegen={() => {
                        setRegenId(g.id);
                        setConfirmarGasto(false);
                        setRegenError(null);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        ) : null}

        {vista === "grid" && filtradas.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtradas.map((g) => (
              <div
                key={g.id}
                className="flex flex-col gap-3 rounded-lg border border-border/80 bg-background p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{g.nombre_negocio}</p>
                    <p className="text-xs text-muted-foreground">
                      {labelQrModo(g.qr_modo)} · {g.aspect_ratio}
                    </p>
                  </div>
                  <StatusBadge estado={g.estado} />
                </div>
                {g.resultado?.proxy ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.resultado.proxy}
                    alt=""
                    className="aspect-square w-full rounded-md bg-neutral-100 object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-md bg-neutral-100 text-xs text-muted-foreground">
                    Sin preview
                  </div>
                )}
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {motivoDe(g)}
                </p>
                <Acciones
                  g={g}
                  onExport={() => void exportar(g)}
                  onRegen={() => {
                    setRegenId(g.id);
                    setConfirmarGasto(false);
                    setRegenError(null);
                  }}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Dialog
        open={regenId != null}
        onOpenChange={(open) => {
          if (!open) {
            setRegenId(null);
            setConfirmarGasto(false);
            setRegenError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerar pegatina</DialogTitle>
            <DialogDescription>
              {regenTarget
                ? `Se creará una nueva generación desde «${regenTarget.nombre_negocio}». Confirma el gasto para continuar.`
                : "Confirma el gasto para regenerar."}
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={confirmarGasto}
              onCheckedChange={setConfirmarGasto}
              className="mt-0.5"
            />
            <span>Confirmar gasto de regeneración (confirmarGasto)</span>
          </label>
          {regenError ? (
            <p className="text-sm text-destructive">{regenError}</p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenId(null)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void regenerar()}
              disabled={!confirmarGasto || busy}
            >
              {busy ? "Regenerando…" : "Regenerar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Acciones({
  g,
  onExport,
  onRegen,
}: {
  g: GeneracionDto;
  onExport: () => void;
  onRegen: () => void;
}) {
  const canRegen = g.estado === "revision_necesaria";
  return (
    <div className="flex flex-wrap gap-1.5">
      <Link
        href={`/generacion/${g.id}`}
        className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
      >
        Abrir
      </Link>
      <Button size="xs" variant="outline" onClick={onExport}>
        Exportar
      </Button>
      {canRegen ? (
        <Button size="xs" variant="secondary" onClick={onRegen}>
          Regenerar
        </Button>
      ) : null}
    </div>
  );
}
