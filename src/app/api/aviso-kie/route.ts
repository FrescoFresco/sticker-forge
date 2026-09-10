import { NextResponse } from "next/server";
import { aplicarAvisoKie, vigilar } from "@/lib/store";

/**
 * Callback de Kie: no confiar en el body; usar taskId solo como señal
 * y volver a consultar recordInfo.
 */
export async function POST(request: Request) {
  vigilar();
  let taskId: string | null = null;
  try {
    const body = (await request.json()) as {
      taskId?: string;
      data?: { taskId?: string };
    };
    taskId = body.taskId ?? body.data?.taskId ?? null;
  } catch {
    // body vacío o no JSON
  }

  if (!taskId) {
    const url = new URL(request.url);
    taskId = url.searchParams.get("taskId");
  }

  if (!taskId) {
    return NextResponse.json(
      { ok: false, error: "taskId requerido" },
      { status: 400 },
    );
  }

  const generacion = await aplicarAvisoKie(taskId);
  return NextResponse.json({
    ok: true,
    taskId,
    encontrada: Boolean(generacion),
    estado: generacion?.estado ?? null,
  });
}
