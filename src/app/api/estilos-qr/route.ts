import { NextResponse } from "next/server";
import {
  createEstiloQr,
  listEstilosOperaciones,
  listEstilosQr,
  listLimpiezas,
} from "@/lib/store";
import type { EstiloQrCreatePayload } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    estilos: listEstilosQr(),
    operaciones: listEstilosOperaciones(),
    limpiezas: listLimpiezas(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EstiloQrCreatePayload;
    const estilo = createEstiloQr(body);
    return NextResponse.json({ estilo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear estilo" },
      { status: 400 },
    );
  }
}
