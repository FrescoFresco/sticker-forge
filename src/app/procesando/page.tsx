import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui-helpers/empty-state";

export default function ProcesandoPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Procesando</h1>
        <p className="text-sm text-muted-foreground">
          Cola en vuelo y pendientes. Poll cada ~2.5s.
        </p>
      </div>
      <EmptyState
        title="Tablas de cola pendientes"
        description="Aquí irán las tablas EN VUELO y EN COLA."
      />
    </AppShell>
  );
}
