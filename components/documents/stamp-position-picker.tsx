"use client";

import * as React from "react";
import { Move } from "lucide-react";
import type { FreePosition } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { loadPdfJsRuntime } from "@/lib/pdfjs-runtime";

const STAMP_DEFAULT: FreePosition = { x: 10, y: 76, width: 28, height: 14 };
const SIGNATURE_DEFAULT: FreePosition = { x: 62, y: 78, width: 28, height: 14 };
const NOTE_DEFAULT: FreePosition = { x: 36, y: 66, width: 38, height: 11 };
const REFERENCE_DEFAULT: FreePosition = { x: 58, y: 8, width: 34, height: 6 };
const MIN_SIZE = 6;
const MAX_SIZE = 60;
const MAX_PREVIEW_WIDTH = 680;
const MAX_PREVIEW_HEIGHT = 720;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pdfViewerUrl(url: string, previewPage: "first" | "last") {
  const base = url.split("#", 1)[0];
  const page = previewPage === "first" ? "&page=1" : "";
  return `${base}#toolbar=0&navpanes=0&view=FitH${page}`;
}

interface PositionableItem {
  kind?: "image" | "text";
  imageUrl: string;
  label: string;
  text?: string;
  attribution?: string;
  initialPosition?: FreePosition;
}

/**
 * Renders the exact final page of the PDF to a canvas via pdf.js — pixel-accurate,
 * unlike an <iframe> pointed at the browser's native PDF viewer, which adds its own
 * chrome/padding that can't be measured, breaking the % coordinates dragged over it.
 */
function PdfPagePreview({
  pdfUrl,
  fallbackPdfUrl,
  previewPage,
  onReady,
}: {
  pdfUrl: string;
  fallbackPdfUrl?: string;
  previewPage: "first" | "last";
  onReady: () => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [slow, setSlow] = React.useState(false);
  const [fallbackUrl, setFallbackUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setSlow(false);
    const slowTimer = setTimeout(() => { if (!cancelled) setSlow(true); }, 4000);
    async function renderWithPdfJs(url: string) {
      const pdfjs = await loadPdfJsRuntime();
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) throw new Error(`PDF preview fetch failed: ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length === 0) throw new Error("PDF preview is empty.");
      const doc = await pdfjs.getDocument({ data: bytes }).promise;
      const page = await doc.getPage(previewPage === "first" ? 1 : doc.numPages);
      const base = page.getViewport({ scale: 1 });
      const availableWidth = Math.min(MAX_PREVIEW_WIDTH, Math.max(280, window.innerWidth - 48));
      const availableHeight = Math.min(MAX_PREVIEW_HEIGHT, Math.max(320, window.innerHeight - 220));
      const scale = Math.min(availableWidth / base.width, availableHeight / base.height);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || cancelled) return;
      const outputScale = window.devicePixelRatio || 1;
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
    (async () => {
      const sources = Array.from(new Set([pdfUrl, fallbackPdfUrl].filter(Boolean))) as string[];
      for (const source of sources) {
        try {
          await renderWithPdfJs(source);
          if (!cancelled) { setStatus("ready"); onReady(); }
          return;
        } catch (error) {
          console.warn("[document-preview] pdf.js preview failed", error);
        }
      }
      if (!cancelled) {
        setFallbackUrl(sources.at(-1) ?? pdfUrl);
        setStatus("fallback");
        onReady();
      }
    })().finally(() => {
      clearTimeout(slowTimer);
    });
    return () => { cancelled = true; clearTimeout(slowTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfUrl, fallbackPdfUrl, previewPage]);

  return (
    <>
      {status === "loading" && (
        <div className="flex h-64 w-full max-w-[420px] flex-col items-center justify-center gap-2 text-[13px] text-graphite-500">
          <span className="size-5 animate-spin rounded-full border-2 border-graphite-300 border-t-navy-700" />
          <span>A carregar pré-visualização…</span>
          {slow && <span className="text-2xs text-graphite-400">A gerar o documento real pode demorar mais alguns segundos…</span>}
        </div>
      )}
      {status === "error" && <div className="flex h-64 w-full max-w-[420px] items-center justify-center px-4 text-center text-[13px] text-crimson-600">Não foi possível carregar a pré-visualização do documento.</div>}
      {status === "fallback" && fallbackUrl && (
        <div className="h-[58dvh] min-h-[320px] w-full max-w-[420px] overflow-hidden bg-white">
          <iframe
            title="Pre-visualizacao alternativa do documento"
            src={pdfViewerUrl(fallbackUrl, previewPage)}
            className="h-full w-full border-0 bg-white"
          />
        </div>
      )}
      <canvas ref={canvasRef} className={status === "ready" ? "block" : "hidden"} />
    </>
  );
}

function PositionableOverlay({
  containerRef,
  item,
  position,
  onChange,
  accent,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  item: PositionableItem;
  position: FreePosition;
  onChange: (position: FreePosition) => void;
  accent: string;
}) {
  const mode = React.useRef<"move" | "resize" | null>(null);

  function updateFromPointer(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (mode.current === "resize") {
      const width = clamp(((clientX - rect.left) / rect.width) * 100 - position.x, MIN_SIZE, Math.min(MAX_SIZE, 100 - position.x));
      const height = clamp(((clientY - rect.top) / rect.height) * 100 - position.y, MIN_SIZE, Math.min(MAX_SIZE, 100 - position.y));
      onChange({ ...position, width, height });
    } else {
      const px = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100 - position.width);
      const py = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100 - position.height);
      onChange({ ...position, x: px, y: py });
    }
  }

  function startMove(event: React.PointerEvent) {
    mode.current = "move";
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  }

  function startResize(event: React.PointerEvent) {
    event.stopPropagation();
    mode.current = "resize";
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function stop() {
    mode.current = null;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Arrastar para posicionar ${item.label}`}
      onPointerDown={startMove}
      onPointerMove={(event) => { if (mode.current) updateFromPointer(event.clientX, event.clientY); }}
      onPointerUp={stop}
      className="absolute cursor-move touch-none select-none border-2 border-dashed bg-white/70"
      style={{ left: `${position.x}%`, top: `${position.y}%`, width: `${position.width}%`, height: `${position.height}%`, borderColor: accent }}
    >
      {item.kind === "text" ? (
        <div className="flex h-full w-full flex-col justify-start overflow-hidden p-1 text-left leading-tight text-graphite-900">
          <span className="whitespace-pre-wrap text-[11px] italic">{item.text}</span>
          {item.attribution && <span className="mt-1 truncate text-[8px] font-semibold">{item.attribution}</span>}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.label} className="h-full w-full object-contain" draggable={false} />
      )}
      <span className="pointer-events-none absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: accent }}>
        <Move className="size-3" />
      </span>
      <span className="pointer-events-none absolute -bottom-4 left-0 whitespace-nowrap text-2xs font-medium" style={{ color: accent }}>{item.label}</span>
      <div
        role="button"
        tabIndex={0}
        aria-label={`Redimensionar ${item.label}`}
        onPointerDown={startResize}
        onPointerMove={(event) => { if (mode.current === "resize") { event.stopPropagation(); updateFromPointer(event.clientX, event.clientY); } }}
        onPointerUp={(event) => { event.stopPropagation(); stop(); }}
        className="absolute -bottom-1.5 -right-1.5 flex size-4 cursor-nwse-resize touch-none items-center justify-center rounded-full border-2 border-white"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

export function StampPositionPicker({
  open,
  onOpenChange,
  pdfUrl,
  fallbackPdfUrl,
  stamp,
  signature,
  note,
  reference,
  previewPage = "last",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  fallbackPdfUrl?: string;
  stamp?: PositionableItem;
  signature?: PositionableItem;
  note?: Omit<PositionableItem, "imageUrl"> & { imageUrl?: string };
  reference?: Omit<PositionableItem, "imageUrl"> & { imageUrl?: string };
  previewPage?: "first" | "last";
  onConfirm: (result: { posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition; posicaoNota?: FreePosition; posicaoReferencia?: FreePosition }) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [stampPosition, setStampPosition] = React.useState<FreePosition>(stamp?.initialPosition ?? STAMP_DEFAULT);
  const [signaturePosition, setSignaturePosition] = React.useState<FreePosition>(signature?.initialPosition ?? SIGNATURE_DEFAULT);
  const [notePosition, setNotePosition] = React.useState<FreePosition>(note?.initialPosition ?? NOTE_DEFAULT);
  const [referencePosition, setReferencePosition] = React.useState<FreePosition>(reference?.initialPosition ?? REFERENCE_DEFAULT);
  const [previewReady, setPreviewReady] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStampPosition(stamp?.initialPosition ?? STAMP_DEFAULT);
    setSignaturePosition(signature?.initialPosition ?? SIGNATURE_DEFAULT);
    setNotePosition(note?.initialPosition ?? NOTE_DEFAULT);
    setReferencePosition(reference?.initialPosition ?? REFERENCE_DEFAULT);
    setPreviewReady(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pdfUrl, fallbackPdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[94vh]">
        <DialogHeader>
          <DialogTitle>Posicionar elementos</DialogTitle>
          <DialogDescription>Arraste cada elemento para o local exacto onde deve ficar, e use o ponto no canto inferior direito para ajustar o tamanho.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-1 flex-col items-stretch overflow-auto">
          <div ref={containerRef} className="relative mx-auto inline-block max-w-full border border-graphite-300 bg-white shadow-sm">
            <PdfPagePreview pdfUrl={pdfUrl} fallbackPdfUrl={fallbackPdfUrl} previewPage={previewPage} onReady={() => setPreviewReady(true)} />
            {previewReady && reference && (
              <PositionableOverlay
                containerRef={containerRef}
                item={{ imageUrl: "", kind: "text", label: reference.label, text: reference.text, attribution: reference.attribution }}
                position={referencePosition}
                onChange={setReferencePosition}
                accent="#173f70"
              />
            )}
            {previewReady && stamp && (
              <PositionableOverlay containerRef={containerRef} item={stamp} position={stampPosition} onChange={setStampPosition} accent="#173f70" />
            )}
            {previewReady && signature && (
              <PositionableOverlay containerRef={containerRef} item={signature} position={signaturePosition} onChange={setSignaturePosition} accent="#177047" />
            )}
            {previewReady && note && (
              <PositionableOverlay
                containerRef={containerRef}
                item={{ imageUrl: "", kind: "text", label: note.label, text: note.text, attribution: note.attribution }}
                position={notePosition}
                onChange={setNotePosition}
                accent="#5b3b91"
              />
            )}
          </div>
          <p className="mt-2 shrink-0 text-center text-2xs text-graphite-500">
            Mostra a {previewPage === "first" ? "primeira" : "ultima"} pagina do documento, a escala exacta. A posicao de cada elemento fica guardada para as proximas vezes.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!previewReady} onClick={() => onConfirm({ posicaoCarimbo: stamp ? stampPosition : undefined, posicaoAssinatura: signature ? signaturePosition : undefined, posicaoNota: note ? notePosition : undefined, posicaoReferencia: reference ? referencePosition : undefined })}>
            Aplicar aqui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
