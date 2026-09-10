"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { FileUp, Plus } from "lucide-react";
import { InstruccionesIaDialog } from "@/components/entrada/instrucciones-ia-dialog";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-helpers/data-table";
import { EmptyState } from "@/components/ui-helpers/empty-state";
import { useGeneraciones } from "@/hooks/use-generaciones";
import { formatFecha, labelQrModo } from "@/lib/labels";
import type { ImportPreviewItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function EntradaPage() {
  const router = useRouter();
  const { queueSummary, refresh } = useGeneraciones();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [items, setItems] = useState<ImportPreviewItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [encolar, setEncolar] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const operacionMeta = items[0]
    ? {
        operacion_id: items[0].operacion_id,
        ttl_hasta: items[0].ttl_hasta,
      }
    : null;

  const validas = items.filter((i) => i.ok).length;

  const previewFiles = useCallback(async (next: File[]) => {
    if (!next.length) {
      setFiles([]);
      setItems([]);
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    setFiles(next);
    try {
      const form = new FormData();
      for (const f of next) form.append("files", f);
      form.set("encolar", "0");
      const res = await fetch("/api/importar", { method: "POST", body: form });
      const json = (await res.json()) as {
        items?: ImportPreviewItem[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "No se pudo revisar el lote");
      setItems(json.items ?? []);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Error al revisar");
    } finally {
      setBusy(false);
    }
  }, []);

  const onPick = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const arr = Array.from(list).filter((f) => {
        const n = f.name.toLowerCase();
        return n.endsWith(".json") || n.endsWith(".zip");
      });
      if (!arr.length) {
        setError("Solo se admiten archivos .json o .zip");
        return;
      }
      void previewFiles(arr);
    },
    [previewFiles],
  );

  const cancelar = () => {
    setFiles([]);
    setItems([]);
    setError(null);
    setEncolar(true);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submitEncolar = async () => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      form.set("encolar", encolar ? "1" : "0");
      const res = await fetch("/api/importar", { method: "POST", body: form });
      const json = (await res.json()) as {
        items?: ImportPreviewItem[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Error al importar");
      setItems(json.items ?? []);
      await refresh();
      if (encolar) {
        cancelar();
        router.push("/procesando");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell queue={queueSummary}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Entrada</h1>
            <p className="text-sm text-muted-foreground">
              Importa un ZIP completo (datos + logo) o un JSON. Usa las
              instrucciones para IA si quieres que otra IA te prepare el paquete.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InstruccionesIaDialog />
            <Link
              href="/nueva"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Plus className="size-4" />
              Nueva pegatina
            </Link>
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
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
            if (e.currentTarget === e.target) setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onPick(e.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
            dragging
              ? "border-foreground/40 bg-neutral-100"
              : "border-border/80 bg-background hover:border-foreground/25 hover:bg-neutral-50",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-neutral-100 text-foreground">
            <FileUp className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Arrastra .json o .zip aquí, o haz clic para elegir
            </p>
            <p className="text-xs text-muted-foreground">
              Revisión por fila: errores no tumbaron el lote
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.zip,application/json,application/zip"
            multiple
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!items.length && !busy ? (
          <EmptyState
            title="Sin lote en revisión"
            description="Sube un manifiesto JSON o un ZIP de pegatinas para ver la tabla de revisión."
            action={
              <Link
                href="/nueva"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                <Plus className="size-3.5" />
                Nueva pegatina
              </Link>
            }
          />
        ) : null}

        {busy && !items.length ? (
          <p className="text-sm text-muted-foreground">Revisando lote…</p>
        ) : null}

        {items.length > 0 ? (
          <div className="flex flex-col gap-4">
            {operacionMeta ? (
              <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-border/80 bg-background px-3 py-2 text-xs text-muted-foreground">
                {operacionMeta.operacion_id ? (
                  <span>
                    <span className="font-medium text-foreground">
                      operacion_id
                    </span>{" "}
                    <span className="font-mono">
                      {operacionMeta.operacion_id}
                    </span>
                  </span>
                ) : null}
                {operacionMeta.ttl_hasta ? (
                  <span>
                    <span className="font-medium text-foreground">ttl</span>{" "}
                    {formatFecha(operacionMeta.ttl_hasta)}
                  </span>
                ) : null}
                <span>
                  <span className="font-medium text-foreground">archivos</span>{" "}
                  {items.length} · {validas} válidas
                </span>
              </div>
            ) : null}

            <DataTable caption="Revisión de importación">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>archivo</TableHead>
                  <TableHead>negocio</TableHead>
                  <TableHead>agencia</TableHead>
                  <TableHead>qr_modo</TableHead>
                  <TableHead>manifest</TableHead>
                  <TableHead>estado</TableHead>
                  <TableHead>error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.nombre_archivo}
                    </TableCell>
                    <TableCell>{item.negocio}</TableCell>
                    <TableCell>{item.agencia}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {labelQrModo(item.qr_modo)}
                    </TableCell>
                    <TableCell>v{item.manifest_version}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          item.ok ? "text-emerald-700" : "text-red-700",
                        )}
                      >
                        {item.ok ? "ok" : "error"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[14rem] truncate text-xs text-muted-foreground">
                      {item.error ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={encolar}
                  onCheckedChange={(v) => setEncolar(v)}
                />
                <span className="cursor-pointer font-normal">
                  Encolar {validas} válidas
                </span>
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelar} disabled={busy}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => void submitEncolar()}
                  disabled={busy || !files.length}
                >
                  {encolar ? `Encolar ${validas}` : "Confirmar revisión"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
