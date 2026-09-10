"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui-helpers/data-table";
import { EmptyState } from "@/components/ui-helpers/empty-state";
import { labelAjuste, labelFase, labelQrModo } from "@/lib/labels";
import type { CapacidadesCompletas } from "@/lib/types";

type EstadoResponse = CapacidadesCompletas & {
  cola?: {
    max_en_vuelo?: number;
    en_vuelo?: string[];
    pendientes?: string[];
    modelo?: string;
  };
};

function ChipList({
  items,
  empty = "—",
}: {
  items: string[];
  empty?: string;
}) {
  if (!items.length) {
    return <span className="text-sm text-muted-foreground">{empty}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="rounded-md font-mono">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function KvRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-border/60 py-2 sm:grid-cols-[minmax(10rem,16rem)_1fr] sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
      <dd className="text-sm text-foreground">{v}</dd>
    </div>
  );
}

export default function CapacidadPage() {
  const [data, setData] = useState<EstadoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/estado", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setError("No se pudo cargar /api/estado");
          return;
        }
        const json = (await res.json()) as EstadoResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Error de red al cargar capacidad");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Capacidad</h1>
          <p className="text-sm text-muted-foreground">
            Límites del sistema, fases QR, degradación y escalas.
          </p>
        </div>

        {loading ? (
          <EmptyState
            title="Cargando capacidad…"
            description="Consultando reglas y cola del mock."
          />
        ) : error || !data ? (
          <EmptyState
            title={error ?? "Sin datos"}
            description="Reintenta más tarde."
          />
        ) : (
          <>
            <section className="rounded-lg border border-border/80 bg-background p-4">
              <h2 className="mb-3 text-sm font-medium">Sistema</h2>
              <dl>
                <KvRow
                  k="modelo_kie"
                  v={
                    <span className="font-mono text-xs sm:text-sm">
                      {data.modelo_kie}
                    </span>
                  }
                />
                <KvRow
                  k="kie_modo"
                  v={
                    <Badge
                      variant={
                        data.kie_modo === "real" ? "default" : "secondary"
                      }
                    >
                      {data.kie_modo === "real"
                        ? "real (KIE_API_KEY)"
                        : "mock (sin clave)"}
                    </Badge>
                  }
                />
                <KvRow
                  k="cola_max_en_vuelo"
                  v={
                    <span className="font-mono">
                      {data.cola_max_en_vuelo}
                      {data.cola?.en_vuelo ? (
                        <span className="ml-2 text-muted-foreground">
                          (en vuelo ahora: {data.cola.en_vuelo.length})
                        </span>
                      ) : null}
                    </span>
                  }
                />
                <KvRow k="formatos" v={<ChipList items={data.formatos} />} />
                <KvRow
                  k="resoluciones"
                  v={<ChipList items={data.resoluciones} />}
                />
                <KvRow
                  k="qr_modos"
                  v={
                    <ChipList
                      items={data.qr_modos.map((m) => labelQrModo(m))}
                    />
                  }
                />
              </dl>
            </section>

            <section className="rounded-lg border border-border/80 bg-background p-4">
              <h2 className="mb-3 text-sm font-medium">Límites</h2>
              <dl>
                <KvRow
                  k="negocio_chars"
                  v={
                    <span className="font-mono">
                      {data.limites.negocio_chars}
                    </span>
                  }
                />
                <KvRow
                  k="agencia_chars"
                  v={
                    <span className="font-mono">
                      {data.limites.agencia_chars}
                    </span>
                  }
                />
                <KvRow
                  k="estilo_texto_chars"
                  v={
                    <span className="font-mono">
                      {data.limites.estilo_texto_chars}
                    </span>
                  }
                />
                <KvRow
                  k="prompt_chars"
                  v={
                    <span className="font-mono">
                      {data.limites.prompt_chars}
                    </span>
                  }
                />
                <KvRow
                  k="cola_max_en_vuelo"
                  v={
                    <span className="font-mono">
                      {data.limites.cola_max_en_vuelo}
                    </span>
                  }
                />
              </dl>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Fases QR</h2>
              <DataTable caption="Catálogo de fases por modo">
                <TableHeader>
                  <TableRow>
                    <TableHead>id</TableHead>
                    <TableHead>etiqueta</TableHead>
                    <TableHead>modos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fases.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.id}</TableCell>
                      <TableCell>{f.etiqueta || labelFase(f.id)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {f.modos.map((m) => (
                            <Badge
                              key={m}
                              variant="outline"
                              className="rounded-md text-[10px]"
                            >
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Degradación</h2>
              <DataTable caption="Pasos de degradación del estilo QR">
                <TableHeader>
                  <TableRow>
                    <TableHead>orden</TableHead>
                    <TableHead>ajuste</TableHead>
                    <TableHead>descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.degradacion.map((d) => (
                    <TableRow key={d.orden}>
                      <TableCell className="font-mono">{d.orden}</TableCell>
                      <TableCell>
                        {labelAjuste(d.ajuste)}
                        <div className="font-mono text-[10px] text-muted-foreground">
                          {d.ajuste}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.descripcion}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Escalas</h2>
              <DataTable caption="Escalas de zona QR">
                <TableHeader>
                  <TableRow>
                    <TableHead>valor</TableHead>
                    <TableHead>uso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.escalas.map((e) => (
                    <TableRow key={e.valor}>
                      <TableCell className="font-mono">{e.valor}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.uso}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </section>

            <section className="rounded-lg border border-border/80 bg-background p-4">
              <h2 className="mb-3 text-sm font-medium">
                Artístico · límites 3+3
              </h2>
              <dl>
                <KvRow
                  k="max_intentos_qr"
                  v={
                    <span className="font-mono">
                      {data.artistico.max_intentos_qr}
                    </span>
                  }
                />
                <KvRow
                  k="max_intentos_integracion"
                  v={
                    <span className="font-mono">
                      {data.artistico.max_intentos_integracion}
                    </span>
                  }
                />
              </dl>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Futuro · prompt_sets</h2>
              {data.futuro.prompt_sets.length === 0 ? (
                <EmptyState
                  title="No implementado"
                  description="El catálogo de prompt_sets aún no forma parte del mock."
                />
              ) : (
                <ChipList items={data.futuro.prompt_sets.map(String)} />
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
