import * as React from "react";
import { cn } from "@/lib/utils";
import type { ExpedientStatus, Priority, Confidentiality } from "@/types";
import { STATUS_META, PRIORITY_META, CONFIDENTIALITY_META } from "@/lib/status";

export function Badge({
  className,
  children,
  variant = "neutral",
}: {
  className?: string;
  children: React.ReactNode;
  variant?: "neutral" | "navy" | "success" | "amber" | "crimson" | "info";
}) {
  const variants: Record<string, string> = {
    neutral: "bg-graphite-100 text-graphite-700 border-graphite-200",
    navy: "bg-navy-50 text-navy-700 border-navy-200",
    success: "bg-success-50 text-success-700 border-success-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    crimson: "bg-crimson-50 text-crimson-700 border-crimson-200",
    info: "bg-info-50 text-info-700 border-info-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-px text-2xs font-semibold leading-4",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className, withDescription = false }: { status: ExpedientStatus; className?: string; withDescription?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span
      title={withDescription ? meta.description : undefined}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-px text-2xs font-semibold leading-4",
        meta.badge,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: ExpedientStatus; className?: string }) {
  const meta = STATUS_META[status];
  return <span className={cn("inline-block size-1.5 rounded-full", meta.dot, className)} aria-hidden />;
}

export function PriorityBadge({ priority, className, label }: { priority: Priority; className?: string; label?: string }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-px text-2xs font-semibold leading-4",
        meta.badge,
        className
      )}
    >
      {label ?? meta.label}
    </span>
  );
}

export function ConfidentialityBadge({ level, className, label }: { level: Confidentiality; className?: string; label?: string }) {
  const meta = CONFIDENTIALITY_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-sm border px-1.5 py-px text-2xs font-semibold leading-4",
        meta.badge,
        className
      )}
    >
      {label ?? meta.label}
    </span>
  );
}
