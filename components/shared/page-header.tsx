import * as React from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-graphite-300 bg-white px-4 py-2.5", className)}>
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} className="sr-only" />}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[17px] font-semibold leading-6 tracking-tight text-cfm-900">{title}</h1>
          {description && <p className="sr-only">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
      </div>
    </header>
  );
}
