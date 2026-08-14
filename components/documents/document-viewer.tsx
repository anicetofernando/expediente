"use client";

import * as React from "react";
import Image from "next/image";
import {
  ZoomIn, ZoomOut, RotateCw, Download, Printer, Maximize2, FileText, Layers, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { ExpedientDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";

type VersionView = "original" | "carimbado" | "final";

export function DocumentViewer({ document: doc }: { document: ExpedientDocument }) {
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

  function printDocument() {
    if (doc.conteudoHtml) {
      const popup = window.open("", "_blank", "noopener,noreferrer");
      if (!popup) return;
      popup.document.write(`<!doctype html><html><head><title>${doc.nome}</title><style>body{font:12pt Arial;max-width:190mm;margin:15mm auto;line-height:1.5}@media print{body{margin:0}}</style></head><body>${doc.conteudoHtml}</body></html>`);
      popup.document.close();
      popup.focus();
      popup.print();
      return;
    }
    if (doc.downloadUrl) window.open(doc.downloadUrl, "_blank", "noopener,noreferrer");
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
          <Button variant="ghost" size="icon" className="size-7" disabled={availableVersions.length < 2}>
            <Layers className="size-3.5" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Descarregar">
          <Button asChild variant="ghost" size="icon" className="size-7" disabled={!doc.downloadUrl}>
            <a href={doc.downloadUrl ?? "#"} download={doc.nome}><Download className="size-3.5" /></a>
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Imprimir">
          <Button variant="ghost" size="icon" className="size-7" onClick={printDocument} disabled={!doc.downloadUrl && !doc.conteudoHtml}>
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
        className="relative flex aspect-[210/297] w-full max-w-md shrink-0 flex-col overflow-hidden border border-graphite-300 bg-white shadow-card transition-transform"
        style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
      >
        {doc.conteudoHtml ? (
          <article className="h-full overflow-auto p-10 text-left text-[11px] leading-relaxed text-graphite-800" dangerouslySetInnerHTML={{ __html: doc.conteudoHtml }} />
        ) : doc.mimeType?.startsWith("image/") && doc.downloadUrl ? (
          <Image src={doc.downloadUrl} alt={doc.nome} fill unoptimized sizes="448px" className="object-contain" />
        ) : doc.mimeType === "application/pdf" && doc.downloadUrl ? (
          <iframe title={doc.nome} src={`${doc.downloadUrl}#page=${page}&toolbar=0`} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
            <FileText className="size-10 text-graphite-300" />
            <p className="text-[13px] font-medium text-graphite-600">{doc.nome}</p>
            <p className="text-2xs text-graphite-400">A pré-visualização deste formato não está disponível. Utilize Descarregar.</p>
          </div>
        )}
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
