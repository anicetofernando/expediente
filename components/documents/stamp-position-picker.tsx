"use client";

import * as React from "react";
import { Move } from "lucide-react";
import type { FreePosition } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STAMP_DEFAULT: FreePosition = { x: 10, y: 76, width: 28, height: 14 };
const SIGNATURE_DEFAULT: FreePosition = { x: 62, y: 78, width: 28, height: 14 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface PositionableItem {
  imageUrl: string;
  label: string;
  initialPosition?: FreePosition;
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
  const dragging = React.useRef(false);

  function updateFromPointer(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100 - position.width);
    const py = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100 - position.height);
    onChange({ ...position, x: px, y: py });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Arrastar para posicionar ${item.label}`}
      onPointerDown={(event) => { dragging.current = true; (event.target as HTMLElement).setPointerCapture(event.pointerId); updateFromPointer(event.clientX, event.clientY); }}
      onPointerMove={(event) => { if (dragging.current) updateFromPointer(event.clientX, event.clientY); }}
      onPointerUp={() => { dragging.current = false; }}
      className="absolute cursor-move touch-none select-none border-2 border-dashed bg-white/70"
      style={{ left: `${position.x}%`, top: `${position.y}%`, width: `${position.width}%`, height: `${position.height}%`, borderColor: accent }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.imageUrl} alt={item.label} className="h-full w-full object-contain" draggable={false} />
      <span className="pointer-events-none absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: accent }}>
        <Move className="size-3" />
      </span>
      <span className="pointer-events-none absolute -bottom-4 left-0 whitespace-nowrap text-2xs font-medium" style={{ color: accent }}>{item.label}</span>
    </div>
  );
}

export function StampPositionPicker({
  open,
  onOpenChange,
  pdfUrl,
  stamp,
  signature,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  stamp?: PositionableItem;
  signature?: PositionableItem;
  onConfirm: (result: { posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition }) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [stampPosition, setStampPosition] = React.useState<FreePosition>(stamp?.initialPosition ?? STAMP_DEFAULT);
  const [signaturePosition, setSignaturePosition] = React.useState<FreePosition>(signature?.initialPosition ?? SIGNATURE_DEFAULT);

  React.useEffect(() => {
    if (!open) return;
    setStampPosition(stamp?.initialPosition ?? STAMP_DEFAULT);
    setSignaturePosition(signature?.initialPosition ?? SIGNATURE_DEFAULT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[94vh]">
        <DialogHeader>
          <DialogTitle>Posicionar carimbo e assinatura</DialogTitle>
          <DialogDescription>Arraste cada elemento para o local exacto onde deve ficar no documento.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-1 flex-col items-center">
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-[680px] overflow-hidden border border-graphite-300 bg-white shadow-sm"
            style={{ aspectRatio: "210 / 297" }}
          >
            <iframe
              title="Documento"
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH&page=9999`}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {stamp && (
              <PositionableOverlay containerRef={containerRef} item={stamp} position={stampPosition} onChange={setStampPosition} accent="#173f70" />
            )}
            {signature && (
              <PositionableOverlay containerRef={containerRef} item={signature} position={signaturePosition} onChange={setSignaturePosition} accent="#177047" />
            )}
          </div>
          <p className="mt-2 shrink-0 text-center text-2xs text-graphite-500">
            Mostra a última página do documento. A posição de cada elemento fica guardada para as próximas vezes.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onConfirm({ posicaoCarimbo: stamp ? stampPosition : undefined, posicaoAssinatura: signature ? signaturePosition : undefined })}>
            Aplicar aqui
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
