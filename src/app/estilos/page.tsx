"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ESTILO_QR_DEFAULT } from "@/lib/seed";
import { formatFecha } from "@/lib/labels";
import type {
  EstiloQr,
  EstiloQrConfig,
  EstiloQrOperacion,
  Limpieza,
} from "@/lib/types";

type EstilosResponse = {
  estilos: EstiloQr[];
  operaciones: EstiloQrOperacion[];
  limpiezas: Limpieza[];
};

type FormState = {
  nombre: string;
  tiene_logo: boolean;
  forma: string;
  color: string;
  margen: number;
  correccion: EstiloQrConfig["correccion"];
  fondoColor: string;
  logoTamano: number;
};

const CORRECCIONES: EstiloQrConfig["correccion"][] = ["L", "M", "Q", "H"];

function configToForm(estilo: Pick<EstiloQr, "nombre" | "tiene_logo" | "config">): FormState {
  return {
    nombre: estilo.nombre,
    tiene_logo: estilo.tiene_logo,
    forma: estilo.config.modulos.forma,
    color: estilo.config.modulos.color,
    margen: estilo.config.margen,
    correccion: estilo.config.correccion,
    fondoColor: estilo.config.fondo.color,
    logoTamano: estilo.config.logo.tamano,
  };
}

function blankForm(): FormState {
  return configToForm({
    nombre: "",
    tiene_logo: false,
    config: structuredClone(ESTILO_QR_DEFAULT),
  });
}

function formToConfig(form: FormState, base?: EstiloQrConfig): EstiloQrConfig {
  const config = structuredClone(base ?? ESTILO_QR_DEFAULT);
  config.modulos.forma = form.forma.trim() || "cuadrado";
  config.modulos.color = form.color.trim() || "#000000";
  config.margen = Number.isFinite(form.margen) ? form.margen : 4;
  config.correccion = form.correccion;
  config.fondo.color = form.fondoColor.trim() || "#FFFFFF";
  config.logo.tamano = Number.isFinite(form.logoTamano) ? form.logoTamano : 0.2;
  return config;
}

function QrPreview({ color, fondo }: { color: string; fondo: string }) {
  const cells = Array.from({ length: 49 }, (_, i) => {
    const row = Math.floor(i / 7);
    const col = i % 7;
    const finder =
      (row < 3 && col < 3) ||
      (row < 3 && col > 3) ||
      (row > 3 && col < 3);
    const data = (row + col) % 2 === 0;
    return finder || data;
  });

  return (
    <div
      className="mx-auto aspect-square w-full max-w-[220px] rounded-lg border border-border p-3"
      style={{ backgroundColor: fondo || "#FFFFFF" }}
      aria-label="Vista previa QR"
    >
      <div className="grid h-full w-full grid-cols-7 grid-rows-7 gap-0.5">
        {cells.map((on, i) => (
          <div
            key={i}
            className="rounded-[1px]"
            style={{ backgroundColor: on ? color || "#000000" : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function EstilosPage() {
  const [estilos, setEstilos] = useState<EstiloQr[]>([]);
  const [operaciones, setOperaciones] = useState<EstiloQrOperacion[]>([]);
  const [limpiezas, setLimpiezas] = useState<Limpieza[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = estilos.find((e) => e.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/estilos-qr", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar el catálogo de estilos");
      const data = (await res.json()) as EstilosResponse;
      setEstilos(data.estilos ?? []);
      setOperaciones(data.operaciones ?? []);
      setLimpiezas(data.limpiezas ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de carga");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function selectEstilo(estilo: EstiloQr) {
    setSelectedId(estilo.id);
    setForm(configToForm(estilo));
    setError(null);
  }

  function startCreate() {
    setSelectedId(null);
    setForm(blankForm());
    setError(null);
  }

  async function handleCrear() {
    const nombre = form.nombre.trim();
    if (!nombre) {
      setError("Indica un nombre para el estilo");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/estilos-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          tiene_logo: form.tiene_logo,
          config: formToConfig(form),
        }),
      });
      const json = (await res.json()) as { estilo?: EstiloQr; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al crear");
      await load();
      if (json.estilo) selectEstilo(json.estilo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  }

  async function handleGuardar() {
    if (!selected) {
      setError("Selecciona un estilo para guardar");
      return;
    }
    const nombre = form.nombre.trim();
    if (!nombre) {
      setError("Indica un nombre para el estilo");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/estilos-qr/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          tiene_logo: form.tiene_logo,
          config: formToConfig(form, selected.config),
        }),
      });
      const json = (await res.json()) as { estilo?: EstiloQr; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      await load();
      if (json.estilo) selectEstilo(json.estilo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchivar() {
    if (!selected) {
      setError("Selecciona un estilo para archivar");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/estilos-qr/${selected.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Error al archivar");
      setSelectedId(null);
      setForm(blankForm());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al archivar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Estilos QR</h1>
            <p className="text-sm text-muted-foreground">
              Catálogo de estilos, editor de configuración, operaciones y limpiezas.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={startCreate} disabled={busy}>
            Nuevo estilo
          </Button>
        </div>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">Catálogo</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando estilos…</p>
            ) : estilos.length === 0 ? (
              <EmptyState
                title="Sin estilos"
                description="Crea el primer estilo QR del catálogo."
              />
            ) : (
              <DataTable caption="Catálogo de estilos QR">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Versión</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Actualizado</TableHead>
                    <TableHead>Archivado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estilos.map((estilo) => (
                    <TableRow
                      key={estilo.id}
                      data-state={selectedId === estilo.id ? "selected" : undefined}
                      className={selectedId === estilo.id ? "bg-muted/50" : undefined}
                    >
                      <TableCell className="font-medium">{estilo.nombre}</TableCell>
                      <TableCell>{estilo.version}</TableCell>
                      <TableCell>{estilo.tiene_logo ? "sí" : "no"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatFecha(estilo.actualizado_en)}
                      </TableCell>
                      <TableCell>{estilo.archivado_en ? "sí" : "no"}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => selectEstilo(estilo)}
                          disabled={busy}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border/80 p-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium">
                {selected ? "Editor" : "Nuevo estilo"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selected
                  ? `Editando «${selected.nombre}» · v${selected.version}`
                  : "Rellena el formulario y pulsa Crear."}
              </p>
            </div>

            <QrPreview color={form.color} fondo={form.fondoColor} />

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="estilo-nombre">Nombre</Label>
                <Input
                  id="estilo-nombre"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del estilo"
                  disabled={busy}
                />
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="modulos-forma">Módulos · forma</Label>
                  <Input
                    id="modulos-forma"
                    value={form.forma}
                    onChange={(e) => setForm((f) => ({ ...f, forma: e.target.value }))}
                    placeholder="cuadrado / redondeado"
                    disabled={busy}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="modulos-color">Módulos · color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="modulos-color"
                      type="color"
                      className="h-8 w-12 shrink-0 p-1"
                      value={/^#[0-9A-Fa-f]{6}$/.test(form.color) ? form.color : "#000000"}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      disabled={busy}
                    />
                    <Input
                      value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      placeholder="#251911"
                      disabled={busy}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="margen">Margen</Label>
                  <Input
                    id="margen"
                    type="number"
                    min={0}
                    step={1}
                    value={form.margen}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, margen: Number(e.target.value) }))
                    }
                    disabled={busy}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="correccion">Corrección</Label>
                  <select
                    id="correccion"
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={form.correccion}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        correccion: e.target.value as EstiloQrConfig["correccion"],
                      }))
                    }
                    disabled={busy}
                  >
                    {CORRECCIONES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-1.5 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="fondo-color">Fondo · color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fondo-color"
                      type="color"
                      className="h-8 w-12 shrink-0 p-1"
                      value={
                        /^#[0-9A-Fa-f]{6}$/.test(form.fondoColor)
                          ? form.fondoColor
                          : "#FFFFFF"
                      }
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fondoColor: e.target.value }))
                      }
                      disabled={busy}
                    />
                    <Input
                      value={form.fondoColor}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fondoColor: e.target.value }))
                      }
                      placeholder="#FFFFFF"
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="logo-tamano">Logo · tamaño</Label>
                  <Input
                    id="logo-tamano"
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={form.logoTamano}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, logoTamano: Number(e.target.value) }))
                    }
                    disabled={busy}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.tiene_logo}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, tiene_logo: checked === true }))
                  }
                  disabled={busy}
                />
                Incluye logo
              </label>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
              <Button type="button" onClick={() => void handleCrear()} disabled={busy}>
                Crear
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleGuardar()}
                disabled={busy || !selected}
              >
                Guardar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleArchivar()}
                disabled={busy || !selected}
              >
                Archivar
              </Button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Operaciones</h2>
          {operaciones.length === 0 ? (
            <EmptyState
              title="Sin operaciones"
              description="Las operaciones de estilos aparecerán aquí."
            />
          ) : (
            <DataTable caption="Operaciones de estilos QR">
              <TableHeader>
                <TableRow>
                  <TableHead>Id</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Versión esperada</TableHead>
                  <TableHead>TTL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operaciones.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-mono text-xs">{op.id}</TableCell>
                    <TableCell>{op.tipo}</TableCell>
                    <TableCell>{op.estado}</TableCell>
                    <TableCell>
                      {op.version_esperada == null ? "—" : op.version_esperada}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatFecha(op.ttl_hasta)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Limpiezas</h2>
          {limpiezas.length === 0 ? (
            <EmptyState
              title="Sin limpiezas"
              description="Las limpiezas de archivos temporales aparecerán aquí."
            />
          ) : (
            <DataTable caption="Limpiezas asociadas a estilos">
              <TableHeader>
                <TableRow>
                  <TableHead>Id</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limpiezas.map((limp) => (
                  <TableRow key={limp.id}>
                    <TableCell className="font-mono text-xs">{limp.id}</TableCell>
                    <TableCell>{limp.target}</TableCell>
                    <TableCell className="max-w-[280px] truncate font-mono text-xs">
                      {limp.path}
                    </TableCell>
                    <TableCell>{limp.estado}</TableCell>
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
