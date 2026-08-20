"use client";

import * as React from "react";
import { Download, Printer, Maximize2, FileText } from "lucide-react";
import type { ExpedientDocument } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleTooltip } from "@/components/ui/tooltip";

type VersionView = "pdf" | "original";

function withDownload(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}download=1`;
}

function pdfName(name: string) {
  return `${name.replace(/\.[^.]+$/, "")}.pdf`;
}

export function DocumentViewer({ document: doc }: { document: ExpedientDocument }) {
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
      <div className="flex min-w-0 items-center gap-2 text-xs text-graphite-600">
        <FileText className="size-4 shrink-0 text-navy-700" />
        <span className="truncate">{doc.nome}</span>
        <span className="shrink-0 text-graphite-400">· {doc.paginas} pág.</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {canShowOriginal && (
          <Select value={version} onValueChange={(value) => setVersion(value as VersionView)}>
            <SelectTrigger className="h-8 w-[168px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Documento final em PDF</SelectItem>
              <SelectItem value="original">Ficheiro original</SelectItem>
            </SelectContent>
          </Select>
        )}
        <SimpleTooltip label="Descarregar PDF">
          <Button asChild variant="ghost" size="icon" className="size-8" disabled={!pdfUrl}>
            <a href={pdfUrl ? withDownload(pdfUrl) : "#"} download={pdfName(doc.nome)} aria-label="Descarregar PDF"><Download className="size-4" /></a>
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label="Imprimir documento">
          <Button variant="ghost" size="icon" className="size-8" onClick={printDocument} disabled={!pdfUrl}><Printer className="size-4" /></Button>
        </SimpleTooltip>
        <SimpleTooltip label="Ecrã inteiro">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setFullscreen(true)} disabled={!viewUrl}><Maximize2 className="size-4" /></Button>
        </SimpleTooltip>
      </div>
    </div>
  );

  const Canvas = (
    <div className="min-h-0 flex-1 bg-graphite-200/70 p-2 sm:p-3">
      {viewUrl ? (
        <iframe
          key={`${version}-${viewUrl}`}
          title={`Pré-visualização de ${doc.nome}`}
          src={version === "pdf" ? `${viewUrl}#toolbar=1&navpanes=0&view=FitH` : viewUrl}
          className="h-full min-h-[680px] w-full border border-graphite-300 bg-white shadow-sm"
        />
      ) : (
        <div className="flex h-full min-h-[680px] flex-col items-center justify-center gap-3 border border-graphite-300 bg-white p-8 text-center">
          <FileText className="size-10 text-graphite-300" />
          <p className="text-[13px] font-medium text-graphite-600">Pré-visualização indisponível</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex h-full min-h-[740px] flex-col overflow-hidden rounded-lg border border-graphite-200 bg-white">
        {Toolbar}
        {Canvas}
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent size="xl" className="h-[94vh] w-[96vw] max-w-[1600px] p-0">
          <div className="flex h-full min-h-0 flex-col pt-8">
            {Toolbar}
            {Canvas}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
