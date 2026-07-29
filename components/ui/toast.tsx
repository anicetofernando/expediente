"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const iconMap = {
  default: Info,
  success: CheckCircle2,
  destructive: XCircle,
  warning: AlertTriangle,
};

const styleMap: Record<string, string> = {
  default: "border-graphite-200 [&_svg]:text-info-600",
  success: "border-success-200 [&_svg]:text-success-600",
  destructive: "border-crimson-200 [&_svg]:text-crimson-600",
  warning: "border-amber-200 [&_svg]:text-amber-600",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((t) => {
        const Icon = iconMap[t.variant ?? "default"];
        return (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => !open && dismiss(t.id)}
            className={cn(
              "flex gap-2.5 rounded-lg border bg-white p-3.5 shadow-modal data-[state=open]:animate-slide-in-top",
              styleMap[t.variant ?? "default"]
            )}
          >
            <Icon className="size-4 shrink-0 mt-0.5" aria-hidden />
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="text-[13px] font-semibold text-graphite-900">{t.title}</ToastPrimitive.Title>
              {t.description && <ToastPrimitive.Description className="mt-0.5 text-[13px] text-graphite-500">{t.description}</ToastPrimitive.Description>}
            </div>
            <ToastPrimitive.Close className="text-graphite-400 hover:text-graphite-600">
              <X className="size-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </ToastPrimitive.Provider>
  );
}
