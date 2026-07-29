"use client";

import * as React from "react";
import {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  FileEdit,
  Forward,
  HelpCircle,
  Inbox,
  MessageSquareText,
  PackageCheck,
  PenTool,
  PlayCircle,
  Send,
  Stamp,
  TrendingUp,
  Undo2,
  XCircle,
} from "lucide-react";
import type { Expedient } from "@/types";
import { ACTIONS_BY_STATUS, type ActionDef } from "@/lib/expedient-actions";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { organizationalUnits } from "@/data/organization";
import { stamps } from "@/data/stamps";
import { signatures } from "@/data/signatures";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  FileEdit,
  Forward,
  HelpCircle,
  Inbox,
  MessageSquareText,
  PackageCheck,
  PenTool,
  PlayCircle,
  Send,
  Stamp,
  TrendingUp,
  Undo2,
  XCircle,
};

type ActionExpedient = Pick<Expedient, "estado" | "protocolo" | "assunto">;

export function ActionPanel({ expedient }: { expedient: ActionExpedient }) {
  const { toast } = useToast();
  const actions = ACTIONS_BY_STATUS[expedient.estado] ?? [];
  const [activeAction, setActiveAction] = React.useState<ActionDef | null>(null);

  function complete(action: ActionDef, message: string) {
    toast({ title: `${action.label} registado`, description: message, variant: "success" });
    setActiveAction(null);
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-graphite-200 bg-graphite-50 px-4 py-5 text-center">
        <CheckCircle2 className="mx-auto mb-2 size-5 text-graphite-400" />
        <p className="text-[13px] font-medium text-graphite-600">Sem acções pendentes</p>
        <p className="mt-1 text-2xs text-graphite-400">Este processo encontra-se num estado terminal e não requer intervenção.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => {
        const Icon = ACTION_ICONS[action.icon];
        return (
          <Button key={action.key} variant={action.variant} className="w-full justify-start" onClick={() => setActiveAction(action)}>
            <Icon className="size-3.5" /> {action.label}
          </Button>
        );
      })}

      {activeAction && (
        <ActionDialog
          action={activeAction}
          expedient={expedient}
          onClose={() => setActiveAction(null)}
          onComplete={(msg) => complete(activeAction, msg)}
        />
      )}
    </div>
  );
}

function ActionDialog({
  action,
  expedient,
  onClose,
  onComplete,
}: {
  action: ActionDef;
  expedient: ActionExpedient;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const [note, setNote] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [stampId, setStampId] = React.useState(stamps[0]?.id ?? "");
  const [signatureId, setSignatureId] = React.useState(signatures[0]?.id ?? "");
  const [pin, setPin] = React.useState("");

  if (action.kind === "confirm") {
    return (
      <ConfirmDialog
        open
        onOpenChange={(v) => !v && onClose()}
        title={`${action.label} — ${expedient.protocolo}`}
        description={`Confirma a acção "${action.label}" sobre este expediente? Esta acção ficará registada no histórico e na auditoria do processo.`}
        confirmLabel={action.label}
        destructive={action.variant === "destructive"}
        onConfirm={() => onComplete(`"${action.label}" aplicado a ${expedient.protocolo}.`)}
      />
    );
  }

  if (action.kind === "archive") {
    return (
      <ConfirmDialog
        open
        onOpenChange={(v) => !v && onClose()}
        title="Arquivar expediente"
        description="O processo será marcado como concluído e movido para o arquivo digital. Continuará disponível para consulta e auditoria."
        confirmLabel="Arquivar"
        onConfirm={() => onComplete(`${expedient.protocolo} foi arquivado.`)}
      />
    );
  }

  if (action.kind === "note") {
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{action.label}</DialogTitle>
            <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Label required>Observações</Label>
            <Textarea rows={4} placeholder="Descreva o motivo desta acção…" value={note} onChange={(e) => setNote(e.target.value)} />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant={action.variant} disabled={!note.trim()} onClick={() => onComplete(note)}>{action.label}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (action.kind === "forward") {
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{action.label}</DialogTitle>
            <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3.5">
            <div>
              <Label required>Unidade / responsável de destino</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue placeholder="Seleccione o destino" /></SelectTrigger>
                <SelectContent>
                  {organizationalUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Instruções (opcional)</Label>
              <Textarea rows={3} placeholder="Acrescente instruções para o destinatário…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button disabled={!target} onClick={() => onComplete(`Encaminhado para ${organizationalUnits.find((u) => u.id === target)?.nome}.`)}>
              {action.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (action.kind === "stamp") {
    const selected = stamps.find((s) => s.id === stampId);
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Aplicar carimbo</DialogTitle>
            <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
          </DialogHeader>
          <DialogBody className="grid grid-cols-2 gap-5">
            <div className="space-y-3.5">
              <div>
                <Label required>Carimbo</Label>
                <Select value={stampId} onValueChange={setStampId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stamps.filter((s) => s.activo).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-2xs leading-relaxed text-graphite-500">
                Categoria: {selected?.categoria} · Posição: {selected?.posicao} · Tamanho: {selected?.tamanho}
              </p>
            </div>
            <div className="flex items-center justify-center rounded-lg border border-dashed border-graphite-300 bg-graphite-50 p-4">
              <div className="relative flex aspect-[210/297] w-full items-center justify-center border border-graphite-200 bg-white">
                <span className="text-2xs text-graphite-300">Folha A4</span>
                <span
                  className={cn(
                    "absolute rotate-[-8deg] rounded border-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                    "border-navy-700 text-navy-700",
                    selected?.posicao.includes("superior") ? "top-3" : "bottom-3",
                    selected?.posicao.includes("esquerda") ? "left-3" : selected?.posicao.includes("direita") ? "right-3" : ""
                  )}
                  style={{ opacity: 1 - (selected?.transparencia ?? 0) / 100 }}
                >
                  {selected?.nome}
                </span>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => onComplete(`Carimbo "${selected?.nome}" aplicado ao documento.`)}>Aplicar carimbo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (action.kind === "signature") {
    const selected = signatures.find((s) => s.id === signatureId);
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Aplicar assinatura digital</DialogTitle>
            <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3.5">
            <div>
              <Label required>Assinatura</Label>
              <Select value={signatureId} onValueChange={setSignatureId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {signatures.filter((s) => s.estado === "activa").map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.proprietario} — {s.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selected?.requerPin && (
              <div>
                <Label required>PIN de assinatura</Label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-graphite-300 px-3 text-sm tracking-widest focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/15"
                  placeholder="••••••"
                />
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button disabled={selected?.requerPin && pin.length < 4} onClick={() => onComplete(`Documento assinado digitalmente por ${selected?.proprietario}.`)}>
              Assinar documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
