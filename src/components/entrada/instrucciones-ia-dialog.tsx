"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INSTRUCCIONES_IA_IMPORT } from "@/lib/instrucciones-ia";

export function InstruccionesIaDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copiarTodo = async () => {
    try {
      await navigator.clipboard.writeText(INSTRUCCIONES_IA_IMPORT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* el usuario puede seleccionar el textarea a mano */
    }
  };

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="size-4" />
        Instrucciones para IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[min(90svh,40rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton
        >
          <DialogHeader className="gap-1 border-b border-border/80 px-4 py-4 pr-12 text-left">
            <DialogTitle>Instrucciones para IA</DialogTitle>
            <DialogDescription>
              Copia este texto, pégalo en cualquier IA y pide un ZIP completo
              (generacion.json + logo + estilo QR fino) listo para Entrada.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <textarea
              readOnly
              value={INSTRUCCIONES_IA_IMPORT}
              aria-label="Instrucciones completas para pegar en una IA"
              className="h-72 w-full resize-none rounded-lg border border-border/80 bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
            <Button type="button" onClick={() => void copiarTodo()}>
              {copied ? (
                <>
                  <Check className="size-4" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copiar todo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
