"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function ExportReportButton({ label = "Exportar relatório" }: { label?: string }) {
  const { toast } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        toast({
          title: "Relatório em preparação",
          description: "O relatório está a ser gerado em PDF e será disponibilizado para descarregamento em instantes.",
          variant: "success",
        })
      }
    >
      <Download className="size-4" aria-hidden />
      {label}
    </Button>
  );
}

const PERIODOS = [
  { value: "6m", label: "Últimos 6 meses" },
  { value: "trimestre", label: "Este trimestre" },
  { value: "ano", label: "Este ano" },
];

export function PeriodSelect() {
  const [period, setPeriod] = React.useState("6m");
  return (
    <Select value={period} onValueChange={setPeriod}>
      <SelectTrigger className="w-[190px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODOS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
