"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PERIOD_OPTIONS, STATUS_GROUPS } from "@/lib/dashboard-metrics";

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  return React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (!value || value === "todos") params.delete(key);
      else params.set(key, value);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams]
  );
}

export function StatusFilterSelect({ value }: { value: string }) {
  const update = useQueryUpdater();
  return (
    <Select value={value} onValueChange={(v) => update("estado", v)}>
      <SelectTrigger className="w-[190px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todos os estatutos</SelectItem>
        {STATUS_GROUPS.map((group) => (
          <SelectItem key={group} value={group}>
            {group}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function PeriodSelect({ value }: { value: string }) {
  const update = useQueryUpdater();
  return (
    <Select value={value} onValueChange={(v) => update("periodo", v)}>
      <SelectTrigger className="w-[190px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ExportReportButton({
  label = "Exportar relatório",
  estado = "todos",
  periodo = "6m",
}: {
  label?: string;
  estado?: string;
  periodo?: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (estado && estado !== "todos") params.set("estado", estado);
      if (periodo) params.set("periodo", periodo);
      const query = params.toString();
      const response = await fetch(`/api/reports/export${query ? `?${query}` : ""}`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível gerar o relatório.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `relatorio-cfm-${new Date().toISOString().slice(0, 10)}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: "Relatório exportado", description: "O PDF foi gerado e descarregado com sucesso.", variant: "success" });
    } catch (error) {
      toast({
        title: "Falha ao exportar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
      {loading ? "A gerar PDF…" : label}
    </Button>
  );
}
