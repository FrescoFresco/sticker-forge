import { NextResponse } from "next/server";
import { getStore, resetStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  // Vista interna mock (sin secrets reales). Incluye campos internos a propósito.
  return NextResponse.json(store);
}

export async function POST() {
  const store = resetStore();
  return NextResponse.json({ ok: true, store });
}
