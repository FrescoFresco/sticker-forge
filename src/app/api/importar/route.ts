import { NextResponse } from "next/server";
import { parseImportFiles } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const encolar = form.get("encolar") !== "0";
    const files = form.getAll("files");
    const parsed: { name: string; text?: string }[] = [];

    for (const entry of files) {
      if (!(entry instanceof File)) continue;
      const name = entry.name;
      if (name.toLowerCase().endsWith(".json")) {
        parsed.push({ name, text: await entry.text() });
      } else {
        parsed.push({ name });
      }
    }

    if (parsed.length === 0) {
      return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });
    }

    const result = parseImportFiles(parsed, { encolar });
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de importación" },
      { status: 400 },
    );
  }
}
