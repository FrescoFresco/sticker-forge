import { NextResponse } from "next/server";
import { archiveEstiloQr, getEstiloQr, updateEstiloQr } from "@/lib/store";
import type { EstiloQrUpdatePayload } from "@/lib/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const estilo = getEstiloQr(id);
  if (!estilo) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json({ estilo });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as EstiloQrUpdatePayload;
    const estilo = updateEstiloQr(id, body);
    return NextResponse.json({ estilo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al actualizar" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const estilo = archiveEstiloQr(id);
    return NextResponse.json({ estilo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al archivar" },
      { status: 400 },
    );
  }
}
