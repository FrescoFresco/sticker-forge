"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EstiloQr } from "@/lib/types";

export default function EstilosPage() {
  const [estilos, setEstilos] = useState<EstiloQr[]>([]);

  useEffect(() => {
    void fetch("/api/store")
      .then((r) => r.json())
      .then((data) => setEstilos(data.estilos_qr ?? []));
  }, []);

  return (
    <AppShell
      eyebrow="Catálogo"
      title="Estilos QR"
      description="Catálogo mock de estilos visuales. Cada generación guarda un snapshot; editar aquí no cambia las anteriores."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {estilos
          .filter((e) => !e.archivado_en)
          .map((estilo) => (
            <Card key={estilo.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{estilo.nombre}</CardTitle>
                  <Badge variant="outline">v{estilo.version}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-md border"
                    style={{ background: estilo.config.modulos.color }}
                  />
                  <div>
                    <p>Módulos: {estilo.config.modulos.forma}</p>
                    <p>
                      Corrección {estilo.config.correccion} · margen{" "}
                      {estilo.config.margen}
                    </p>
                  </div>
                </div>
                <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
                  {JSON.stringify(estilo.config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
      </div>
    </AppShell>
  );
}
