"use client";

import * as React from "react";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive" | "warning";
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (item: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (item: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...item, id }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  return <ToastContext.Provider value={{ toasts, toast, dismiss }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser utilizado dentro de ToastProvider");
  return ctx;
}
