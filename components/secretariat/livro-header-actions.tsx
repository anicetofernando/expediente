"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { LivroRow } from "@/components/secretariat/livro-board";

export function LivroHeaderActions({ rows }: { rows: LivroRow[] }) {
  const { toast } = useToast();
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Exportar livro"
        title="Exportar"
        onClick={() => {
          const header = ["Numero","Protocolo","Data","Origem","Remetente","Assunto","Destinatario","Estado"];
          const escape=(value:unknown)=>`"${String(value??"").replaceAll('"','""')}"`;
          const csv=[header,...rows.map((row)=>[row.numeroSequencial,row.protocolo,row.data,row.origem,row.remetente,row.assunto,row.destinatario,row.estado])].map((line)=>line.map(escape).join(";")).join("\r\n");
          const url=URL.createObjectURL(new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}));
          const anchor=document.createElement("a");anchor.href=url;anchor.download=`livro-expediente-${new Date().toISOString().slice(0,10)}.csv`;anchor.click();URL.revokeObjectURL(url);
          toast({ title: "Livro exportado", description: `${rows.length} registos exportados em CSV.` });
        }}
      >
        <Download className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Imprimir livro"
        title="Imprimir"
        onClick={() => window.print()}
      >
        <Printer className="size-3.5" aria-hidden="true" />
      </Button>
    </>
  );
}
