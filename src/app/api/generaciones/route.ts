import { NextResponse } from "next/server";
import { listGeneraciones, colaResumen } from "@/lib/store";

export async function GET() {
  const generaciones = listGeneraciones();
  return NextResponse.json({
    generaciones,
    cola: colaResumen(),
  });
}
