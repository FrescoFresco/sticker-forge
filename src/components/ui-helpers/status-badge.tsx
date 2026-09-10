import { Badge } from "@/components/ui/badge";
import { labelEstado } from "@/lib/labels";
import type { EstadoGeneracion } from "@/lib/types";
import { cn } from "@/lib/utils";

const ESTADO_CLASS: Record<EstadoGeneracion, string> = {
  pendiente:
    "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  generando:
    "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  revision_necesaria:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
  listo:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
};

export function StatusBadge({
  estado,
  className,
}: {
  estado: EstadoGeneracion;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-md font-medium", ESTADO_CLASS[estado], className)}
    >
      {labelEstado(estado)}
    </Badge>
  );
}
