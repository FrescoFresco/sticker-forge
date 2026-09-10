import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type QueueSummary = {
  en_vuelo: number;
  max: number;
};

export function QueueBadge({
  en_vuelo,
  max,
  className,
}: QueueSummary & { className?: string }) {
  const saturated = en_vuelo >= max && max > 0;

  return (
    <Badge
      variant="outline"
      title="Cola: generaciones en vuelo / máximo"
      className={cn(
        "rounded-md font-mono text-[11px] tabular-nums",
        saturated
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-border bg-background text-muted-foreground",
        className,
      )}
    >
      <span className="text-foreground">{en_vuelo}</span>
      <span aria-hidden>/</span>
      <span>{max}</span>
    </Badge>
  );
}
