import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "destructive" | "neutral";

const variantConfig: Record<AlertVariant, { icon: React.ComponentType<{ className?: string }>; classes: string }> = {
  info: { icon: Info, classes: "bg-info-50 border-info-200 text-info-800 [&_.alert-icon]:text-info-600" },
  success: { icon: CheckCircle2, classes: "bg-success-50 border-success-200 text-success-800 [&_.alert-icon]:text-success-600" },
  warning: { icon: AlertTriangle, classes: "bg-amber-50 border-amber-200 text-amber-800 [&_.alert-icon]:text-amber-600" },
  destructive: { icon: XCircle, classes: "bg-crimson-50 border-crimson-200 text-crimson-800 [&_.alert-icon]:text-crimson-600" },
  neutral: { icon: Info, classes: "bg-graphite-100 border-graphite-200 text-graphite-700 [&_.alert-icon]:text-graphite-500" },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  action,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const { icon: Icon, classes } = variantConfig[variant];
  return (
    <div role="alert" className={cn("flex gap-2.5 rounded-lg border px-3.5 py-3 text-[13px]", classes, className)}>
      <Icon className="alert-icon size-4 shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium leading-5">{title}</p>}
        {children && <div className={cn("leading-5", title && "mt-0.5 opacity-90")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
