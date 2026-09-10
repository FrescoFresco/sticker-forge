import { NextResponse } from "next/server";
import { getEntradaAsset } from "@/lib/entrada-assets";
import type { InputRol } from "@/lib/types";

const ROLES = new Set<InputRol>([
  "logo",
  "estilo",
  "logo_qr",
  "nfc",
  "qr_funcional",
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; rol: string }> },
) {
  const { id, rol } = await context.params;
  if (!ROLES.has(rol as InputRol)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 404 });
  }

  const asset = getEntradaAsset(id, rol as InputRol);
  if (!asset) {
    return NextResponse.json(
      { error: "Recurso no encontrado" },
      { status: 404 },
    );
  }

  return new NextResponse(Uint8Array.from(asset.bytes), {
    status: 200,
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "private, max-age=60",
    },
  });
}
