import { NextResponse } from "next/server";
import { crearGeneracion } from "@/lib/store";
import type { GenerarPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerarPayload;
    const generacion = crearGeneracion(body);
    return NextResponse.json({ id: generacion.id, estado: generacion.estado, generacion }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar" },
      { status: 400 },
    );
  }
}
