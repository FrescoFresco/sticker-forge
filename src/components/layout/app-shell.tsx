"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Sticker } from "lucide-react";
import { QueueBadge, type QueueSummary } from "@/components/ui-helpers/queue-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const MAIN_TABS = [
  { href: "/", label: "Entrada", short: "Entrada" },
  { href: "/procesando", label: "Procesando", short: "Proc." },
  { href: "/resultados", label: "Resultados", short: "Result." },
] as const;

const SECONDARY_LINKS = [
  { href: "/estilos", label: "Estilos" },
  { href: "/capacidad", label: "Capacidad" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function normalizeQueue(
  queue?: QueueSummary | null,
): QueueSummary {
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

export function AppShell({
  children,
  queue,
}: {
  children: React.ReactNode;
  queue?: QueueSummary | null;
}) {
  const pathname = usePathname();
  const q = useQueueFallback(queue);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-neutral-50 text-foreground">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 hidden border-b border-border/80 bg-background/90 backdrop-blur md:block">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
              <Sticker className="size-3.5" />
            </span>
            Pegatinas NFC
          </Link>

          <nav className="flex items-center gap-1">
            {MAIN_TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-neutral-100 text-foreground"
                      : "text-muted-foreground hover:bg-neutral-100/80 hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <QueueBadge en_vuelo={q.en_vuelo} max={q.max} />
            {SECONDARY_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile top strip: brand + queue + menu */}
      <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur md:hidden">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground text-background">
            <Sticker className="size-3" />
          </span>
          <span className="truncate">Pegatinas NFC</span>
        </Link>
        <QueueBadge en_vuelo={q.en_vuelo} max={q.max} />
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md border border-border bg-background text-foreground",
            )}
            aria-label="Menú"
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-2">
              {SECONDARY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm hover:bg-accent",
                    isActive(pathname, link.href) &&
                      "bg-accent font-medium text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/nueva"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                Nueva pegatina
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 md:py-8 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-1 px-2 py-2">
          {MAIN_TABS.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-md py-2 text-center text-xs font-medium transition-colors",
                  active
                    ? "bg-neutral-100 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
