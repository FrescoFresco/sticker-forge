import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Thin wrapper for consistent horizontal-scroll tables on móvil.
 * Prefer composing with the re-exported Table* primitives.
 */
export function DataTable({
  children,
  className,
  caption,
}: {
  children: ReactNode;
  className?: string;
  caption?: string;
}) {
  return (
    <div
      data-slot="data-table"
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-border/80 bg-background",
        className,
      )}
    >
      <Table>
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        {children}
      </Table>
    </div>
  );
}

export {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
