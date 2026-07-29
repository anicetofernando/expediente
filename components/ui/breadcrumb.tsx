import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0 text-2xs leading-4 text-graphite-500", className)}>
      <ol className="flex min-w-0 items-center gap-1">
        <li className="flex shrink-0 items-center">
          <Link
            href="/painel"
            className="rounded-sm text-graphite-400 transition-colors hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/30"
          >
            <Home className="size-3" aria-hidden="true" />
            <span className="sr-only">Painel principal</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.href ?? ""}-${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              <span aria-hidden="true" className="shrink-0 text-graphite-300">
                /
              </span>
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="truncate rounded-sm transition-colors hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/30"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn("truncate", isLast && "font-medium text-graphite-700")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
