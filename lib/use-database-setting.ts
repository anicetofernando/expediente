"use client";

import * as React from "react";

export function useDatabaseSetting<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(initialValue);
  const [ready, setReady] = React.useState(false);
  const persisted = React.useRef("");

  React.useEffect(() => {
    let cancelled = false;
    void fetch(`/api/admin/settings/${key}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Nao foi possivel carregar a configuracao.");
        return response.json() as Promise<{ value: T | null }>;
      })
      .then((result) => {
        if (cancelled || result.value === null) return;
        persisted.current = JSON.stringify(result.value);
        setValue(result.value);
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [key]);

  React.useEffect(() => {
    if (!ready) return;
    const serialized = JSON.stringify(value);
    if (serialized === persisted.current) return;
    const timer = window.setTimeout(() => {
      void fetch(`/api/admin/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      }).then((response) => { if (response.ok) persisted.current = serialized; });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [key, ready, value]);

  return [value, setValue, ready] as const;
}
