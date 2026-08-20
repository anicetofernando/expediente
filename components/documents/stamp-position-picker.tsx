"use client";

import * as React from "react";
import { Move } from "lucide-react";
import type { FreePosition } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DEFAULT_WIDTH = 28;
const DEFAULT_HEIGHT = 14;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function StampPositionPicker({
  open,
  onOpenChange,
  pdfUrl,
  imageUrl,
  itemName,
  initialPosition,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  imageUrl: string;
  itemName: string;
  initialPosition?: FreePosition;
  onConfirm: (position: FreePosition) => void;
}) {
  const [position, setPosition] = React.useState<FreePosition>(
    initialPosition ?? { x: 62, y: 78, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  );
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);

  React.useEffect(() => {
    if (open) setPosition(initialPosition ?? { x: 62, y: 78, width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  }, [open, initialPosition]);

  function updateFromPointer(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100 - position.width);
    const py = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100 - position.height);
    setPosition((current) => ({ ...current, x: px, y: py }));
  }

  function handlePointerDown(event: React.PointerEvent) {
    dragging.current = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX, event.clientY);
  }
  function handlePointerMove(event: React.PointerEvent) {
    if (!dragging.current) return;
    updateFromPointer(event.clientX, event.clientY);
  }
  function handlePointerUp() {
    dragging.current = false;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Posicionar «{itemName}»</DialogTitle>
          <DialogDescription>Arraste a imagem para o local exacto onde deve ficar no documento.</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-[520px] overflow-hidden border border-graphite-300 bg-white shadow-sm"
            style={{ aspectRatio: "210 / 297" }}
          >
            <iframe
              title="Documento"
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH&page=9999`}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Arrastar para posicionar"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="absolute cursor-move touch-none select-none border-2 border-dashed border-navy-500 bg-white/70"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `${position.width}%`,
                height: `${position.height}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={itemName} className="h-full w-full object-contain" draggable={false} />
              <span className="pointer-events-none absolute -top-2.5 -right-2.5 flex size-5 items-center justify-center rounded-full bg-navy-600 text-white">
                <Move className="size-3" />
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-2xs text-graphite-500">
            Mostra a última página do documento. A posição fica guardada só para este documento.
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onConfirm(position)}>Aplicar aqui</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
