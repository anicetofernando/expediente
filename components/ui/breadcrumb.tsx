import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  // No mobile, uma "trilha" com varios niveis (icone + separadores + varios
  // nomes) nao cabe numa unica linha e acaba a partir para uma segunda linha
  // de forma desalinhada. Em vez de forcar tudo a caber, mostra-se so um
  // link simples para voltar ao nivel anterior -- o protocolo/nome actual ja
  // aparece no titulo da propria pagina, nao precisa de se repetir aqui.
  const backTarget = items.find((item) => item.href);

  return (
    <div className={cn("min-w-0", className)}>
      {backTarget && (
        <Link
          href={backTarget.href!}
          className="flex w-fit items-center gap-1 rounded-sm text-2xs font-medium text-graphite-500 transition-colors hover:text-cfm-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30 sm:hidden"
        >
          <ChevronLeft className="size-3.5 shrink-0" aria-hidden="true" />
          {backTarget.label}
        </Link>
      )}

      <nav aria-label="Breadcrumb" className="hidden min-w-0 overflow-hidden text-2xs leading-4 text-graphite-500 sm:block">
        <ol className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
          <li className="flex shrink-0 items-center">
            <Link
              href="/painel"
              className="rounded-sm text-graphite-400 transition-colors hover:text-cfm-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
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
                    className="truncate rounded-sm transition-colors hover:text-cfm-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-500/30"
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
    </div>
  );
}
