import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui-helpers/empty-state";

export default function ResultadosPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Resultados</h1>
        <p className="text-sm text-muted-foreground">
          Galería e histórico de pegatinas generadas.
        </p>
      </div>
      <EmptyState
        title="Sin resultados aún"
        description="Toggle Grid | Tabla y acciones (Abrir, Exportar, Regenerar) llegarán con Track C."
      />
    </AppShell>
  );
}
