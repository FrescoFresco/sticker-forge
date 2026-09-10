import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui-helpers/empty-state";

export default function CapacidadPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Capacidad</h1>
        <p className="text-sm text-muted-foreground">
          Límites del sistema, fases, degradación y escalas.
        </p>
      </div>
      <EmptyState
        title="Reglas del sistema pendientes"
        description="Track D añadirá las tablas de capacidad y el bloque de prompts futuros."
      />
    </AppShell>
  );
}
