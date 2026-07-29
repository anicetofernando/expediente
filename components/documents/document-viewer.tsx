"use client";

import * as React from "react";
import {
  ZoomIn, ZoomOut, RotateCw, Download, Printer, Maximize2, FileText, Layers, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { ExpedientDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SimpleTooltip } from "@/components/ui/tooltip";

type VersionView = "original" | "carimbado" | "final";

export function DocumentViewer({ document: doc }: { document: ExpedientDocument }) {
  const { toast } = useToast();
  const [zoom, setZoom] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [version, setVersion] = React.useState<VersionView>(doc.assinado ? "final" : doc.carimbado ? "carimbado" : "original");
  const [fullscreen, setFullscreen] = React.useState(false);

  const availableVersions: { value: VersionView; label: string }[] = [
    { value: "original", label: "Original" },
    ...(doc.carimbado ? [{ value: "carimbado" as VersionView, label: "Carimbado" }] : []),
    ...(doc.assinado ? [{ value: "final" as VersionView, label: "Versão final assinada" }] : []),
  ];

  function notImplemented(action: string) {
    toast({ title: action, description: `${doc.nome} — acção simulada nesta fase de demonstração.` });
  }

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-1 border-b border-graphite-200 bg-graphite-50 px-3 py-2">
      <div className="flex items-center gap-1">
        <SimpleTooltip label="Reduzir zoom">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
            <ZoomOut className="size-3.5" />
          </Button>
        </SimpleTooltip>
        <span className="w-11 text-center text-2xs tabular-nums text-graphite-500">{zoom}%</span>
        <SimpleTooltip label="Aumentar zoom">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
            <ZoomIn className="size-3.5" />
          </Button>
        </SimpleTooltip>
      </div>
      <div className="mx-1 h-4 w-px bg-graphite-200" />
      <SimpleTooltip label="Rodar página">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setRotation((r) => (r + 90) % 360)}>
          <RotateCw className="size-3.5" />
        </Button>
      </SimpleTooltip>
      <div className="mx-1 h-4 w-px bg-graphite-200" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="text-2xs tabular-nums text-graphite-500 whitespace-nowrap">Pág. {page} / {doc.paginas}</span>
        <Button variant="ghost" size="icon" className="size-7" disabled={page >= doc.paginas} onClick={() => setPage((p) => p + 1)}>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {availableVersions.length > 1 && (
          <Select value={version} onValueChange={(v) => setVersion(v as VersionView)}>
            <SelectTrigger className="h-7 w-[168px] text-2xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableVersions.map((v) => (
                <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <SimpleTooltip label="Comparar versões">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => notImplemented("Comparação de versões")}>
            <Layers className="size-3.5" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Descarregar">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => notImplemented("Descarregamento iniciado")}>
            <Download className="size-3.5" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Imprimir">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => notImplemented("Impressão enviada")}>
            <Printer className="size-3.5" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Ecrã inteiro">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setFullscreen(true)}>
            <Maximize2 className="size-3.5" />
          </Button>
        </SimpleTooltip>
      </div>
    </div>
  );

  const Canvas = (
    <div className="flex flex-1 items-center justify-center overflow-auto bg-graphite-100 p-6">
      <div
        className="flex aspect-[210/297] w-full max-w-md shrink-0 flex-col items-center justify-center gap-3 border border-graphite-300 bg-white p-8 text-center shadow-card transition-transform"
        style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
      >
        <FileText className="size-10 text-graphite-300" />
        <p className="text-[13px] font-medium text-graphite-600">{doc.nome}</p>
        <p className="text-2xs text-graphite-400">Pré-visualização simulada · Página {page} de {doc.paginas}</p>
        {version === "carimbado" && (
          <span className="absolute mt-24 rotate-[-8deg] rounded border-2 border-navy-700 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-navy-700">
            Protocolo Geral
          </span>
        )}
        {version === "final" && (
          <span className="absolute mt-24 rotate-[-8deg] rounded border-2 border-success-600 px-3 py-1 text-2xs font-bold uppercase tracking-wide text-success-700">
            Assinado digitalmente
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-graphite-200 bg-white">
        {Toolbar}
        {Canvas}
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent size="xl" className="h-[88vh] p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-graphite-150 px-4 py-2.5 pr-11">
              <p className="text-[13px] font-medium text-graphite-800">{doc.nome}</p>
            </div>
            {Toolbar}
            {Canvas}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
