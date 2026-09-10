import { NextResponse } from "next/server";
import { regenerar } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { confirmarGasto?: boolean };
    const generacion = regenerar(id, Boolean(body.confirmarGasto));
    return NextResponse.json({ generacion }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al regenerar" },
      { status: 400 },
    );
  }
}
