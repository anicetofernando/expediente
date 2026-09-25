"use client";

import * as React from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { loadPdfJsRuntime, type PdfDocumentProxy } from "@/lib/pdfjs-runtime";
import { Button } from "@/components/ui/button";

const MAX_RENDER_WIDTH = 900;

/**
 * Mostra o PDF pagina a pagina, desenhado directamente em <canvas> via pdf.js
 * -- ao contrario de um <iframe> apontado para o visualizador nativo do
 * browser, que em muitos browsers moveis (Safari/Chrome em iOS e Android)
 * fica em branco ou nao abre. Funciona da mesma forma em todos os browsers,
 * porque nao depende de nenhum plugin/visualizador nativo.
 */
export function PdfCanvasViewer({ url }: { url: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRefs = React.useRef<Array<HTMLCanvasElement | null>>([]);
  const docRef = React.useRef<PdfDocumentProxy | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = React.useState(0);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0);
      setWidth((current) => (Math.abs(current - next) > 8 ? next : current));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setPageCount(0);
    docRef.current = null;
    (async () => {
      const pdfjs = await loadPdfJsRuntime();
      const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(`Falha ao obter o PDF: ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length === 0) throw new Error("PDF vazio.");
      const doc = await pdfjs.getDocument({ data: bytes }).promise;
      if (cancelled) return;
      docRef.current = doc;
      canvasRefs.current = new Array(doc.numPages).fill(null);
      setPageCount(doc.numPages);
    })().catch((error) => {
      console.warn("[pdf-canvas-viewer] load failed", error);
      if (!cancelled) setStatus("error");
    });
    return () => { cancelled = true; };
  }, [url]);

  React.useEffect(() => {
    if (!pageCount || !width || !docRef.current) return;
    let cancelled = false;
    (async () => {
      const doc = docRef.current!;
      const outputScale = window.devicePixelRatio || 1;
      const targetWidth = Math.min(width, MAX_RENDER_WIDTH);
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        if (cancelled) return;
        const page = await doc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const scale = targetWidth / base.width;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRefs.current[pageNumber - 1];
        const context = canvas?.getContext("2d");
        if (!canvas || !context) continue;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        await page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        }).promise;
      }
      if (!cancelled) setStatus("ready");
    })().catch((error) => {
      console.warn("[pdf-canvas-viewer] render failed", error);
      if (!cancelled) setStatus("error");
    });
    return () => { cancelled = true; };
  }, [pageCount, width]);

  if (status === "error") {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle className="size-8 text-amber-500" />
        <p className="text-[13px] font-medium text-graphite-700">Não foi possível mostrar a pré-visualização aqui.</p>
        <Button asChild variant="secondary" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-3.5" /> Abrir num separador novo</a>
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col items-center gap-3 overflow-auto py-2">
      {status === "loading" && (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-[13px] text-graphite-500">
          <span className="size-5 animate-spin rounded-full border-2 border-graphite-300 border-t-navy-700" />
          <span>A carregar documento…</span>
        </div>
      )}
      {Array.from({ length: pageCount }, (_, index) => (
        <canvas
          key={index}
          ref={(el) => { canvasRefs.current[index] = el; }}
          className={status === "ready" ? "block max-w-full border border-graphite-300 bg-white shadow-sm" : "hidden"}
        />
      ))}
    </div>
  );
}
