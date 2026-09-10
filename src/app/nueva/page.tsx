import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui-helpers/empty-state";

export default function NuevaPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Nueva pegatina</h1>
        <p className="text-sm text-muted-foreground">
          Formulario de composición y preview del request.
        </p>
      </div>
      <EmptyState
        title="Formulario pendiente"
        description="Track C conectará el alta manual y el JSON de request."
      />
    </AppShell>
  );
}
