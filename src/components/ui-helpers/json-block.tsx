"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function JsonBlock({
  title = "JSON",
  data,
  defaultOpen = false,
  className,
  children,
}: {
  title?: string;
  data?: unknown;
  defaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const body =
    children ??
    (typeof data === "string"
      ? data
      : data === undefined
        ? ""
        : JSON.stringify(data, null, 2));

  return (
    <div
      data-slot="json-block"
      className={cn(
        "overflow-hidden rounded-lg border border-border/80 bg-background",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted/50"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <pre className="max-h-96 overflow-auto border-t border-border/80 bg-neutral-50 p-3 font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap break-all">
          {body}
        </pre>
      ) : null}
    </div>
  );
}
