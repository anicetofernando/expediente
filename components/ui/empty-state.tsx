import * as React from "react";
import { cn } from "@/lib/utils";
import { InboxIcon } from "lucide-react";

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-graphite-100">
        <Icon className="size-5 text-graphite-400" aria-hidden />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-graphite-800">{title}</p>
        {description && <p className="mt-1 text-[13px] text-graphite-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Ocorreu um erro",
  description = "Não foi possível carregar esta informação. Tente novamente.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-crimson-50">
        <svg viewBox="0 0 24 24" fill="none" className="size-5 text-crimson-600" aria-hidden>
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-medium text-graphite-800">{title}</p>
        <p className="mt-1 text-[13px] text-graphite-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
