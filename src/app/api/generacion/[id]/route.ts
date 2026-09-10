import { NextResponse } from "next/server";
import { getGeneracionDetalle } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const generacion = getGeneracionDetalle(id);
  if (!generacion) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  return NextResponse.json({ generacion });
}
