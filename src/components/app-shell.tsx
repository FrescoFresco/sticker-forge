"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Layers,
  LayoutGrid,
  Menu,
  Settings2,
  Sticker,
  Workflow,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Operación", icon: LayoutGrid },
  { href: "/estilos", label: "Estilos QR", icon: Layers },
  { href: "/sistema", label: "Sistema", icon: Settings2 },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex size-10 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "border-border bg-background text-foreground shadow-sm",
            )}
            title={item.label}
          >
            <Icon className="size-4" />
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  eyebrow = "Principal",
  title,
  description,
  tabs,
}: {
  children?: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  tabs?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-neutral-50 text-foreground">
      <aside className="sticky top-0 hidden h-svh w-14 shrink-0 flex-col items-center gap-4 border-r border-border/80 bg-neutral-100/80 py-4 md:flex">
        <div className="flex size-9 items-center justify-center rounded-lg bg-foreground text-background">
          <Sticker className="size-4" />
        </div>
        <NavItems />
        <div className="mt-auto flex flex-col gap-1">
          <div className="flex size-10 items-center justify-center rounded-lg text-muted-foreground">
            <Workflow className="size-4" />
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg text-muted-foreground">
            <BookOpen className="size-4" />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border/70 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <Sheet>
            <SheetTrigger
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-lg border border-border bg-background",
              )}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>Pegatinas NFC</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-2 px-2">
                {NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <h1 className="truncate text-base font-semibold">{title}</h1>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 md:py-10">
          <div className="hidden md:block">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          {description ? (
            <p className="text-sm text-muted-foreground md:hidden">
              {description}
            </p>
          ) : null}

          {tabs}
          {children}
        </main>
      </div>
    </div>
  );
}
