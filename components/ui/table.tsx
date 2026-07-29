import * as React from "react";
import { cn } from "@/lib/utils";

export function TableContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative w-full overflow-x-auto", className)}>{children}</div>;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-left text-xs leading-5", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("sticky top-0 z-10 border-y border-graphite-300 bg-graphite-100", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-graphite-150", className)} {...props} />;
}

export function TableRow({
  className,
  selected,
  clickable,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean; clickable?: boolean }) {
  return (
    <tr
      {...props}
      aria-selected={selected || props["aria-selected"]}
      className={cn(
        "transition-colors duration-100",
        clickable &&
          "cursor-pointer hover:bg-cfm-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cfm-500",
        selected && "bg-cfm-50",
        className
      )}
    />
  );
}

export function TableHeaderCell({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "h-8 whitespace-nowrap px-3 py-1.5 text-2xs font-semibold uppercase tracking-wide text-cfm-800",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2 align-middle text-graphite-700", className)} {...props} />;
}
