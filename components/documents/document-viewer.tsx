"use client";

import * as React from "react";
import { Download, Printer, Maximize2, FileText } from "lucide-react";
import type { ExpedientDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";
import { PdfCanvasViewer } from "@/components/documents/pdf-canvas-viewer";
import { useSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type VersionView = "pdf" | "original";

function withDownload(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
}

function pdfName(name: string) {
  return `${name.replace(/\.[^.]+$/, "")}.pdf`;
}

export function DocumentViewer({ document: doc }: { document: ExpedientDocument }) {
  const { profile } = useSession();
  const canExport = hasPermission(profile.permissoes, ["documentos.exportar"]);
  const canPrint = hasPermission(profile.permissoes, ["documentos.imprimir"]);
  const [version, setVersion] = React.useState<VersionView>("pdf");
  const [fullscreen, setFullscreen] = React.useState(false);
  const pdfUrl = doc.pdfUrl ?? doc.downloadUrl;
  const canShowOriginal = Boolean(doc.pdfUrl && doc.downloadUrl && (
    doc.mimeType === "application/pdf" ||
    doc.mimeType?.startsWith("image/") ||
    doc.conteudoHtml
  ));
  const viewUrl = version === "original" ? doc.downloadUrl : pdfUrl;

  function printDocument() {
    if (!pdfUrl) return;
    const frame = window.document.createElement("iframe");
    frame.src = pdfUrl;
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "1px";
    frame.style.height = "1px";
    frame.style.border = "0";
    frame.onload = () => {
      window.setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          window.open(pdfUrl, "_blank", "noopener,noreferrer");
        }
        window.setTimeout(() => frame.remove(), 1_000);
      }, 300);
    };
    window.document.body.appendChild(frame);
  }

  const Toolbar = (
    <div className="flex min-h-11 flex-wrap items-center gap-2 border-b border-graphite-200 bg-graphite-50 px-3 py-2">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-2 text-xs text-graphite-600 sm:basis-auto">
        <FileText className="size-4 shrink-0 text-navy-700" />
        <span className="truncate">{doc.nome}</span>
        <span className="shrink-0 text-graphite-400">· {doc.paginas} pág.</span>
      </div>

      <div className="ml-0 flex w-full items-center justify-end gap-1.5 sm:ml-auto sm:w-auto">
        {canShowOriginal && (
          <Select value={version} onValueChange={(value) => setVersion(value as VersionView)}>
            <SelectTrigger className="h-8 w-[150px] text-xs sm:w-[168px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Documento final em PDF</SelectItem>
              <SelectItem value="original">Ficheiro original</SelectItem>
            </SelectContent>
          </Select>
        )}
        {canExport && (
          <SimpleTooltip label="Descarregar PDF">
            <Button asChild variant="ghost" size="icon" className="size-8" disabled={!pdfUrl}>
              <a href={pdfUrl ? withDownload(pdfUrl) : "#"} download={pdfName(doc.nome)} aria-label="Descarregar PDF"><Download className="size-4" /></a>
            </Button>
          </SimpleTooltip>
        )}
        {canPrint && (
          <SimpleTooltip label="Imprimir documento">
            <Button variant="ghost" size="icon" className="size-8" onClick={printDocument} disabled={!pdfUrl}><Printer className="size-4" /></Button>
          </SimpleTooltip>
        )}
        <SimpleTooltip label="Ecrã inteiro">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setFullscreen(true)} disabled={!viewUrl}><Maximize2 className="size-4" /></Button>
        </SimpleTooltip>
      </div>
    </div>
  );

  const isImageOriginal = version === "original" && Boolean(doc.mimeType?.startsWith("image/"));

  const Canvas = (
    <div className="min-h-0 flex-1 bg-graphite-200/70 p-1.5 sm:p-3">
      {!viewUrl ? (
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 border border-graphite-300 bg-white p-8 text-center sm:min-h-[620px] lg:min-h-[680px]">
          <FileText className="size-10 text-graphite-300" />
          <p className="text-[13px] font-medium text-graphite-600">Pré-visualização indisponível</p>
        </div>
      ) : isImageOriginal ? (
        <div className="flex h-full min-h-[420px] items-center justify-center overflow-auto border border-graphite-300 bg-white sm:min-h-[620px] lg:min-h-[680px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewUrl} alt={doc.nome} className="max-h-full max-w-full object-contain" />
        </div>
      ) : (
        <div className="h-full min-h-[420px] border border-graphite-300 bg-white shadow-sm sm:min-h-[620px] lg:min-h-[680px]">
          <PdfCanvasViewer key={`${version}-${viewUrl}`} url={viewUrl} />
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-md border border-graphite-200 bg-white sm:min-h-[680px] sm:rounded-lg lg:min-h-[740px]">
        {Toolbar}
        {Canvas}
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent size="xl" className="inset-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none p-0 sm:left-1/2 sm:top-1/2 sm:h-[94vh] sm:w-[96vw] sm:max-w-[1600px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg">
          <div className="flex h-full min-h-0 flex-col pt-10 sm:pt-8">
            {Toolbar}
            {Canvas}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
