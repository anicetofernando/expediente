"use client";

import * as React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { loadPdfJsRuntime, type PdfDocumentProxy } from "@/lib/pdfjs-runtime";
import { Button } from "@/components/ui/button";

const MAX_RENDER_WIDTH = 900;
const MAX_OUTPUT_SCALE = 2;
const MAX_ATTEMPTS = 3;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function describeError(error: unknown) {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Erro desconhecido.";
  }
}

/**
 * Mostra o PDF pagina a pagina, desenhado directamente em <canvas> via pdf.js
 * -- ao contrario de um <iframe> apontado para o visualizador nativo do
 * browser, que nem sempre mostra o PDF embutido (alguns browsers moveis
 * mostram so um botao "abrir" em vez do conteudo). Se o pdf.js falhar por
 * qualquer motivo, a alternativa e' a mais fiavel de todas em mobile: uma
 * ligacao directa que abre o PDF a serio (navegacao completa, nao embutida),
 * em vez de insistir noutra forma de o embutir que pode falhar da mesma
 * maneira. Mostra tambem o erro tecnico, para ser possivel diagnosticar se
 * persistir.
 */
export function PdfCanvasViewer({ url }: { url: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRefs = React.useRef<Array<HTMLCanvasElement | null>>([]);
  const docRef = React.useRef<PdfDocumentProxy | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "fallback">("loading");
  const [pageCount, setPageCount] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const [errorDetail, setErrorDetail] = React.useState<string | null>(null);

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
    setErrorDetail(null);
    docRef.current = null;
    (async () => {
      const pdfjs = await loadPdfJsRuntime();
      // Numa ligacao lenta/instavel (comum em mobile) uma falha isolada nao
      // deve deixar o documento por abrir -- tenta mais duas vezes antes de
      // desistir.
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const response = await fetch(url, { credentials: "same-origin" });
          if (!response.ok) throw new Error(`Falha ao obter o PDF: ${response.status}`);
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (bytes.length === 0) throw new Error("PDF vazio.");
          const doc = await pdfjs.getDocument({ data: bytes }).promise;
          if (cancelled) return;
          docRef.current = doc;
          canvasRefs.current = new Array(doc.numPages).fill(null);
          setPageCount(doc.numPages);
          return;
        } catch (error) {
          lastError = error;
          if (attempt < MAX_ATTEMPTS) await delay(attempt * 800);
        }
      }
      throw lastError;
    })().catch((error) => {
      console.warn("[pdf-canvas-viewer] load failed", error);
      if (cancelled) return;
      setErrorDetail(describeError(error));
      setStatus("fallback");
    });
    return () => { cancelled = true; };
  }, [url]);

  React.useEffect(() => {
    if (!pageCount || !width || !docRef.current) return;
    let cancelled = false;
    (async () => {
      const doc = docRef.current!;
      const outputScale = Math.min(window.devicePixelRatio || 1, MAX_OUTPUT_SCALE);
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
      if (cancelled) return;
      setErrorDetail(describeError(error));
      setStatus("fallback");
    });
    return () => { cancelled = true; };
  }, [pageCount, width]);

  if (status === "fallback") {
    return (
      <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-3 p-6 text-center">
        <FileText className="size-10 text-graphite-300" />
        <p className="text-[13px] font-medium text-graphite-700">Não é possível mostrar a pré-visualização neste navegador.</p>
        <Button asChild>
          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Abrir documento</a>
        </Button>
        {errorDetail && <p className="mt-2 max-w-xs text-2xs text-graphite-400">Detalhe técnico: {errorDetail}</p>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full w-full flex-col items-center gap-3 overflow-auto py-2">
      {status === "loading" && (
        <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-[13px] text-graphite-500">
          <span className="size-5 animate-spin rounded-full border-2 border-graphite-300 border-t-cfm-700" />
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
