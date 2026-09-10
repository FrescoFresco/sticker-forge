import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui-helpers/empty-state";

export default async function GeneracionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Generación</h1>
        <p className="font-mono text-sm text-muted-foreground">{id}</p>
      </div>
      <EmptyState
        title="Ficha de generación pendiente"
        description="Track D añadirá las 7 pestañas con cobertura JSON completa."
      />
    </AppShell>
  );
}
