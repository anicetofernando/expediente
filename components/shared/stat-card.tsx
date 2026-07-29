import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function StatCard({
  label,
  value,
  delta,
  tone = "navy",
  className,
}: {
  label: string;
  value: string | number;
  icon?: string;
  delta?: { value: string; direction: "up" | "down" | "neutral"; positive?: boolean };
  tone?: "navy" | "success" | "amber" | "crimson" | "info" | "graphite";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    navy: "bg-navy-700",
    success: "bg-success-700",
    amber: "bg-amber-700",
    crimson: "bg-crimson-700",
    info: "bg-info-700",
    graphite: "bg-graphite-500",
  };

  const DeltaIcon = delta?.direction === "up" ? ArrowUpRight : delta?.direction === "down" ? ArrowDownRight : Minus;
  const deltaColor = delta
    ? delta.positive === false
      ? "text-crimson-600"
      : delta.positive === true
      ? "text-success-600"
      : "text-graphite-500"
    : "";

  return (
    <div className={cn("rounded-sm border border-graphite-200 bg-white px-3 py-2.5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium leading-4 text-graphite-500">{label}</span>
          <span className="mt-0.5 block text-xl font-semibold leading-6 tabular-nums tracking-tight text-cfm-900">
            {value}
          </span>
        </span>
        <span className={cn("mt-1 h-4 w-0.5 shrink-0", toneClasses[tone])} aria-hidden />
      </div>
      {delta && (
        <div className="mt-1 flex justify-end">
          <span className={cn("flex items-center gap-0.5 text-xs font-medium tabular-nums", deltaColor)}>
            <DeltaIcon className="size-3" aria-hidden />
            {delta.value}
          </span>
        </div>
      )}
    </div>
  );
}
