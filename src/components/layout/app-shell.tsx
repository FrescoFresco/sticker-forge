"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Gauge,
  Images,
  Inbox,
  Loader,
  Palette,
  Sticker,
} from "lucide-react";
import {
  QueueBadge,
  type QueueSummary,
} from "@/components/ui-helpers/queue-badge";
import { cn } from "@/lib/utils";

const HUB = [
  { href: "/", label: "Entrada", icon: Inbox },
  { href: "/procesando", label: "Procesando", icon: Loader },
  { href: "/resultados", label: "Resultados", icon: Images },
  { href: "/estilos", label: "Estilos", icon: Palette },
  { href: "/capacidad", label: "Capacidad", icon: Gauge },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function normalizeQueue(queue?: QueueSummary | null): QueueSummary {
  return {
    en_vuelo: queue?.en_vuelo ?? 0,
    max: queue?.max ?? 3,
  };
}

function useQueueFallback(queue?: QueueSummary | null) {
  const [fetched, setFetched] = useState<QueueSummary | null>(null);

  useEffect(() => {
    if (queue) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/estado", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          cola?: {
            en_vuelo?: string[] | number;
            max_en_vuelo?: number;
          };
        };
        const cola = json.cola;
        if (!cola || cancelled) return;
        const enVuelo = Array.isArray(cola.en_vuelo)
          ? cola.en_vuelo.length
          : Number(cola.en_vuelo ?? 0);
        setFetched({
          en_vuelo: enVuelo,
          max: Number(cola.max_en_vuelo ?? 3),
        });
      } catch {
        /* badge stays on defaults */
      }
    }

    void load();
    const id = setInterval(() => void load(), 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [queue]);

  return normalizeQueue(queue ?? fetched);
}

function HubLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors",
        compact ? "size-11" : "h-12 min-w-0 flex-1 px-1",
        active
          ? "bg-white/15 text-white"
          : "text-white/55 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!compact ? (
        <span className="max-w-full truncate text-[10px] font-medium leading-none">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({
  children,
  queue,
}: {
  children: React.ReactNode;
  queue?: QueueSummary | null;
}) {
  const pathname = usePathname();
  const q = useQueueFallback(queue);

  return (
    <div className="flex min-h-svh bg-neutral-50 text-foreground">
      {/* Desktop / tablet: rail izquierdo */}
      <aside className="sticky top-0 z-40 hidden h-svh w-16 shrink-0 flex-col items-center bg-neutral-950 py-3 md:flex">
        <Link
          href="/"
          aria-label="Pegatinas NFC"
          className="mb-4 flex size-10 items-center justify-center rounded-xl bg-white text-neutral-950"
        >
          <Sticker className="size-4" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {HUB.map((item) => (
            <HubLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item.href)}
              compact
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Móvil: marca (el hub va abajo) */}
        <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur md:hidden">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-white">
              <Sticker className="size-3" />
            </span>
            <span className="truncate">Pegatinas NFC</span>
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-8">
          <div className="flex justify-end">
            <Link
              href="/procesando"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              title="Generaciones en cola / máximo en paralelo"
            >
              <span>Cola</span>
              <QueueBadge en_vuelo={q.en_vuelo} max={q.max} />
            </Link>
          </div>
          {children}
        </main>

        {/* Móvil: mismo hub abajo */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950 md:hidden">
          <div className="mx-auto flex max-w-6xl items-stretch gap-0.5 px-1 py-1.5">
            {HUB.map((item) => (
              <HubLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(pathname, item.href)}
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
