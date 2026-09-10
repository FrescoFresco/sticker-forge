import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui-helpers/empty-state";

export default function EntradaPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Entrada</h1>
        <p className="text-sm text-muted-foreground">
          Suelta JSON o ZIP para preparar un lote de pegatinas.
        </p>
      </div>
      <EmptyState
        title="Sin lote en revisión"
        description="La dropzone y la tabla de revisión se conectarán en el flujo de Entrada."
        action={
          <Link
            href="/nueva"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            + Nueva pegatina
          </Link>
        }
      />
    </AppShell>
  );
}
