"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GeneracionDto } from "@/lib/types";

export interface ColaResumen {
  max_en_vuelo: number;
  en_vuelo: string[];
  pendientes: string[];
}

interface GeneracionesResponse {
  generaciones: GeneracionDto[];
  cola: ColaResumen;
}

const EMPTY_COLA: ColaResumen = {
  max_en_vuelo: 3,
  en_vuelo: [],
  pendientes: [],
};

/** Poll generaciones + cola (~2.5s) for Procesando / Resultados / badge. */
export function useGeneraciones(pollMs = 2500) {
  const [data, setData] = useState<GeneracionesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/generaciones", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar la cola");
      const json = (await res.json()) as GeneracionesResponse;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  const cola = data?.cola ?? EMPTY_COLA;

  const procesando = useMemo(
    () =>
      (data?.generaciones ?? []).filter(
        (g) => g.estado === "generando" || g.estado === "pendiente",
      ),
    [data],
  );

  const listas = useMemo(
    () =>
      (data?.generaciones ?? []).filter(
        (g) =>
          g.estado === "listo" ||
          g.estado === "revision_necesaria" ||
          g.estado === "error",
      ),
    [data],
  );

  const queueSummary = useMemo(
    () => ({
      en_vuelo: cola.en_vuelo.length,
      max: cola.max_en_vuelo,
    }),
    [cola],
  );

  return {
    generaciones: data?.generaciones ?? [],
    cola,
    queueSummary,
    procesando,
    listas,
    loading,
    error,
    refresh,
  };
}
