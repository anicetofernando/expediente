"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { loadPdfJsRuntime, type PdfDocumentProxy } from "@/lib/pdfjs-runtime";

const MAX_RENDER_WIDTH = 900;
const MAX_ATTEMPTS = 3;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Mostra o PDF pagina a pagina, desenhado directamente em <canvas> via pdf.js
 * -- ao contrario de um <iframe> puro apontado para o visualizador nativo do
 * browser, que em muitos browsers moveis fica em branco ou nao abre. Se o
 * pdf.js falhar (ex.: browser sem suporte a "module workers", comum em
 * WebView Android mais antigo), cai automaticamente para o <iframe> nativo
 * como rede de seguranca, com um link directo como ultimo recurso.
 */
export function PdfCanvasViewer({ url }: { url: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRefs = React.useRef<Array<HTMLCanvasElement | null>>([]);
  const docRef = React.useRef<PdfDocumentProxy | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "fallback">("loading");
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
      // Numa ligacao lenta/instavel (comum em mobile) uma falha isolada nao
      // deve deixar o documento por abrir -- tenta mais duas vezes antes de
      // mostrar o aviso com a alternativa de abrir num separador novo.
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
      // Alguns browsers moveis reais (sobretudo WebView Android mais antigo)
      // nao suportam "module workers", que o pdf.js exige -- isso nunca
      // aparece a testar em emulacao no Chrome do computador (que suporta
      // sempre), so' em dispositivos reais. Em vez de desistir, cai para um
      // <iframe> directo ao PDF, que nao depende disso.
      console.warn("[pdf-canvas-viewer] load failed, falling back to iframe", error);
      if (!cancelled) setStatus("fallback");
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
      console.warn("[pdf-canvas-viewer] render failed, falling back to iframe", error);
      if (!cancelled) setStatus("fallback");
    });
    return () => { cancelled = true; };
  }, [pageCount, width]);

  if (status === "fallback") {
    return (
      <div className="flex h-full min-h-[320px] w-full flex-col gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto inline-flex shrink-0 items-center gap-1.5 text-2xs font-medium text-cfm-700 underline-offset-2 hover:underline"
        >
          <ExternalLink className="size-3" /> Não consegue ver o documento abaixo? Abrir num separador novo
        </a>
        <iframe title="Pré-visualização do documento" src={url} className="min-h-0 w-full flex-1 border border-graphite-300 bg-white" />
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
