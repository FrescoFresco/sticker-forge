"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  formatCoste,
  formatFecha,
  labelEstado,
  labelFase,
  labelQrModo,
  progresoFase,
} from "@/lib/labels";
import type { GeneracionDto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

export function EstadoBadge({ estado }: { estado: GeneracionDto["estado"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        estado === "listo" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        estado === "generando" && "border-sky-200 bg-sky-50 text-sky-800",
        estado === "pendiente" && "border-amber-200 bg-amber-50 text-amber-900",
        estado === "revision_necesaria" &&
          "border-orange-200 bg-orange-50 text-orange-900",
        estado === "error" && "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {labelEstado(estado)}
    </Badge>
  );
}

export function GeneracionCard({
  g,
  onRegenerar,
  regenerando,
}: {
  g: GeneracionDto;
  onRegenerar?: (id: string) => void;
  regenerando?: boolean;
}) {
  const progress = progresoFase(g);
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-medium">{g.nombre_negocio}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {g.nombre_agencia} · {g.aspect_ratio} · {g.resolucion}
            </p>
          </div>
          <EstadoBadge estado={g.estado} />
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-1">
            {labelQrModo(g.qr_modo)}
          </span>
          {g.archivo_origen ? (
            <span className="rounded-md bg-muted px-2 py-1">
              {g.archivo_origen}
            </span>
          ) : null}
          <span className="rounded-md bg-muted px-2 py-1">
            {formatFecha(g.creado_en)}
          </span>
          {g.coste_ms != null ? (
            <span className="rounded-md bg-muted px-2 py-1">
              {formatCoste(g.coste_ms)}
            </span>
          ) : null}
        </div>

        {(g.estado === "generando" || g.estado === "pendiente") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {g.estado === "pendiente"
                  ? "Espera hueco de cola"
                  : labelFase(g.fase_qr)}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
            {g.qr_modo === "artistico_ia" ? (
              <p className="text-xs text-muted-foreground">
                QR artístico {g.qr_artistico_intento ?? 0}/3 · integración{" "}
                {g.integracion_intento ?? 0}/3
              </p>
            ) : null}
          </div>
        )}

        {g.error_msg ? (
          <p className="rounded-lg bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
            {g.error_msg}
          </p>
        ) : null}

        {g.estado === "revision_necesaria" && onRegenerar ? (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={regenerando}
              onClick={() => onRegenerar(g.id)}
            >
              <RefreshCw className="size-3.5" />
              Regenerar
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
