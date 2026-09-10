"use client";

import { useEffect, useState, useTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppStore } from "@/lib/types";

export default function SistemaPage() {
  const [store, setStore] = useState<AppStore | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    void fetch("/api/store", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setStore(data));
  }

  useEffect(() => {
    load();
  }, []);

  function reset() {
    startTransition(async () => {
      await fetch("/api/store", { method: "POST" });
      load();
    });
  }

  return (
    <AppShell
      eyebrow="Debug"
      title="Sistema"
      description="Store JSON completo del mock. Aquí puedes inspeccionar y resetear sin tocar Kie/Supabase reales."
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={load}>
          Recargar store
        </Button>
        <Button variant="secondary" disabled={pending} onClick={reset}>
          Reset seed
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Modelo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {store?.modelo_kie ?? "…"}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Generaciones</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {store?.generaciones.length ?? "…"}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cola máx.</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {store?.cola_max_en_vuelo ?? "…"}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">store.json (memoria)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-[28rem] overflow-auto rounded-xl bg-neutral-950 p-4 text-xs text-neutral-100">
            {store ? JSON.stringify(store, null, 2) : "Cargando…"}
          </pre>
        </CardContent>
      </Card>
    </AppShell>
  );
}
