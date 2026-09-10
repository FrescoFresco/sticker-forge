import { NextResponse } from "next/server";
import { getCapacidades, colaResumen, vigilar } from "@/lib/store";

export async function GET() {
  vigilar();
  return NextResponse.json({
    ...getCapacidades(),
    cola: colaResumen(),
  });
}
