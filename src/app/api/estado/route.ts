import { NextResponse } from "next/server";
import { getCapacidadCompleta, colaResumen, vigilar } from "@/lib/store";

export async function GET() {
  vigilar();
  return NextResponse.json({
    ...getCapacidadCompleta(),
    cola: colaResumen(),
  });
}
