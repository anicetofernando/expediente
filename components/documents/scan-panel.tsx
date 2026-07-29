"use client";

import * as React from "react";
import { ScanLine, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type ScanState = "idle" | "scanning" | "done";

export function ScanPanel() {
  const [state, setState] = React.useState<ScanState>("idle");
  const [fileName, setFileName] = React.useState("");
  const [pages, setPages] = React.useState(0);

  function startScan() {
    setState("scanning");
    window.setTimeout(() => {
      setFileName(`Digitalizacao_${new Date().toISOString().slice(0, 10)}_${Math.floor(Math.random() * 900 + 100)}.pdf`);
      setPages(Math.floor(Math.random() * 4) + 1);
      setState("done");
    }, 1600);
  }

  function reset() {
    setState("idle");
    setFileName("");
    setPages(0);
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Área de digitalização</CardTitle>
          <CardDescription>Ligação simulada ao digitalizador institucional da Secretaria Geral</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {state === "idle" && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-graphite-200 bg-graphite-50 px-6 py-12 text-center">
            <ScanLine className="size-8 text-graphite-400" />
            <p className="text-[13px] font-medium text-graphite-700">Dispositivo de digitalização pronto</p>
            <p className="max-w-sm text-2xs text-graphite-500">
              Coloque o documento original no digitalizador institucional e inicie a captura. As páginas digitalizadas
              serão adicionadas à história de digitalizações abaixo.
            </p>
            <Button onClick={startScan}>
              <ScanLine className="size-3.5" /> Iniciar digitalização
            </Button>
          </div>
        )}

        {state === "scanning" && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-navy-200 bg-navy-50/50 px-6 py-12 text-center">
            <Loader2 className="size-8 animate-spin text-navy-600" />
            <p className="text-[13px] font-medium text-navy-800">A digitalizar documento…</p>
            <p className="max-w-sm text-2xs text-navy-600">Não retire o documento do digitalizador enquanto a captura estiver em curso.</p>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-3">
            <Alert variant="success" title="Digitalização concluída">
              {pages} página(s) capturada(s) com sucesso e disponível(is) para associação a um processo de expediente.
            </Alert>
            <div className="flex items-center gap-3 rounded-lg border border-graphite-200 px-4 py-3.5">
              <span className="flex size-10 items-center justify-center rounded-md bg-navy-50 text-navy-700"><FileText className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-graphite-900">{fileName}</p>
                <p className="text-2xs text-graphite-400">{pages} página(s) · Cópia conforme ao original</p>
              </div>
              <CheckCircle2 className="size-4 shrink-0 text-success-600" />
              <Button variant="ghost" size="sm" onClick={reset}>Nova digitalização</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
