"use client";

const PDFJS_LOADER_URL = "/pdfjs-loader.mjs";
const PDFJS_WORKER_URL = "/pdf.worker.min.mjs";

export type PdfViewport = { width: number; height: number };
export type PdfPageProxy = {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
    transform?: [number, number, number, number, number, number];
  }) => { promise: Promise<void> };
};
export type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
};
export type PdfJsRuntime = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: { data: Uint8Array }) => { promise: Promise<PdfDocumentProxy> };
};

declare global {
  interface Window {
    __cfmPdfJs?: PdfJsRuntime;
    __cfmPdfJsLoading?: Promise<PdfJsRuntime>;
  }
}

/**
 * Carrega o runtime do pdf.js uma unica vez por sessao de navegador (script
 * partilhado, cache em window) -- usado para renderizar PDFs directamente
 * para <canvas>, em vez de depender do visualizador nativo do browser num
 * <iframe>, que falha ou fica em branco em muitos browsers moveis (iOS/Android).
 */
export function loadPdfJsRuntime() {
  if (window.__cfmPdfJs) return Promise.resolve(window.__cfmPdfJs);
  if (window.__cfmPdfJsLoading) return window.__cfmPdfJsLoading;

  window.__cfmPdfJsLoading = new Promise<PdfJsRuntime>((resolve, reject) => {
    const finish = () => {
      if (!window.__cfmPdfJs) {
        reject(new Error("PDF.js runtime unavailable."));
        return;
      }
      window.__cfmPdfJs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      resolve(window.__cfmPdfJs);
    };
    const fail = () => reject(new Error("Could not load PDF.js runtime."));
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PDFJS_LOADER_URL}"]`);
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = PDFJS_LOADER_URL;
    script.async = true;
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    window.__cfmPdfJsLoading = undefined;
    throw error;
  });

  return window.__cfmPdfJsLoading;
}
