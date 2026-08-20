"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { Expedient, FreePosition, Signature, Stamp as StampDefinition } from "@/types";
import { StampPositionPicker } from "@/components/documents/stamp-position-picker";
import { ACTIONS_BY_STATUS, type ActionDef } from "@/lib/expedient-actions";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCatalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";

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

type ActionExpedient = Pick<Expedient, "id" | "estado" | "protocolo" | "assunto" | "precisaEscalarDirector">;

const PROFILE_ACTIONS: Record<string, Set<string>> = {
  remetente: new Set(["submeter", "resposta", "confirmar", "arquivar"]),
  secretaria: new Set(["receber", "protocolar", "encaminhar", "carimbo", "disponibilizar", "arquivar", "notificar"]),
  superior: new Set(["encaminhar", "parecer", "esclarecimento", "aprovar", "rejeitar", "devolver", "resposta", "carimbo", "assinatura", "disponibilizar", "retomar", "escalar"]),
  administracao: new Set(Object.values(ACTIONS_BY_STATUS).flat().map((action) => action.key)),
};

export function ActionPanel({ expedient, principalPdfUrl }: { expedient: ActionExpedient; principalPdfUrl?: string }) {
  const { toast } = useToast();
  const { perfilNavegacao } = useSession();
  const router = useRouter();
  const blockDirectApproval = perfilNavegacao === "superior" && expedient.precisaEscalarDirector;
  const actions = (ACTIONS_BY_STATUS[expedient.estado] ?? [])
    .filter((action) => PROFILE_ACTIONS[perfilNavegacao]?.has(action.key))
    .filter((action) => !(blockDirectApproval && action.key === "aprovar"));
  const [activeAction, setActiveAction] = React.useState<ActionDef | null>(null);
  const [authorizations, setAuthorizations] = React.useState<{stamps:StampDefinition[];signatures:Signature[]}>({stamps:[],signatures:[]});

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/document-authorizations", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { stamps: [], signatures: [] })
      .then((value) => { if (!cancelled) setAuthorizations(value); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  async function complete(action: ActionDef, message: string, target?: string, posicao?: FreePosition) {
    try {
      const response = await fetch(`/api/expedients/${expedient.id}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: action.key, note: message, target, posicao }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível registar a acção.");
      toast({ title: `${action.label} registado`, description: message, variant: "success" });
      setActiveAction(null);
      router.refresh();
    } catch (error) {
      toast({ title: "Acção não registada", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    }
  }

  if (actions.length === 0 && expedient.estado !== "rascunho") {
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
      {blockDirectApproval && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
          Este tipo de documento exige aprovação da direcção. Encaminhe para a unidade superior — não pode aprovar directamente aqui.
        </p>
      )}
      {expedient.estado === "rascunho" && (
        <Button asChild className="w-full justify-start">
          <Link href={`/expedientes/novo?rascunho=${expedient.id}`}>
            <FileEdit className="size-3.5" /> Continuar edição
          </Link>
        </Button>
      )}
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
          principalPdfUrl={principalPdfUrl}
          onClose={() => setActiveAction(null)}
          onComplete={(msg, target, posicao) => complete(activeAction, msg, target, posicao)}
          stamps={authorizations.stamps}
          signatures={authorizations.signatures}
        />
      )}
    </div>
  );
}

function ActionDialog({
  action,
  expedient,
  principalPdfUrl,
  onClose,
  onComplete,
  stamps,
  signatures,
}: {
  action: ActionDef;
  expedient: ActionExpedient;
  principalPdfUrl?: string;
  onClose: () => void;
  onComplete: (message: string, target?: string, posicao?: FreePosition) => void;
  stamps: StampDefinition[];
  signatures: Signature[];
}) {
  const { organizationalUnits } = useCatalogs();
  const [note, setNote] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [stampId, setStampId] = React.useState(stamps[0]?.id ?? "");
  const [signatureId, setSignatureId] = React.useState(signatures[0]?.id ?? "");
  const [pin, setPin] = React.useState("");
  const [positioning, setPositioning] = React.useState(false);

  React.useEffect(() => {
    if (!stamps.some((item) => item.id === stampId)) setStampId(stamps[0]?.id ?? "");
    if (!signatures.some((item) => item.id === signatureId)) setSignatureId(signatures[0]?.id ?? "");
  }, [signatureId, signatures, stampId, stamps]);

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
            <Button disabled={!target} onClick={() => onComplete(`Encaminhado para ${organizationalUnits.find((u) => u.id === target)?.nome}.`, target)}>
              {action.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (action.kind === "stamp") {
    const selected = stamps.find((s) => s.id === stampId);
    if (selected?.imagemUrl && principalPdfUrl) {
      if (positioning) {
        return (
          <StampPositionPicker
            open
            onOpenChange={(v) => !v && setPositioning(false)}
            pdfUrl={principalPdfUrl}
            imageUrl={selected.imagemUrl}
            itemName={selected.nome}
            initialPosition={selected.posicaoLivre}
            onConfirm={(posicao) => onComplete(`Carimbo "${selected.nome}" aplicado ao documento.`, stampId, posicao)}
          />
        );
      }
      return (
        <Dialog open onOpenChange={(v) => !v && onClose()}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Aplicar carimbo</DialogTitle>
              <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-3.5">
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
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button disabled={!selected} onClick={() => setPositioning(true)}>Continuar e posicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
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
            <Button disabled={!selected} onClick={() => onComplete(`Carimbo "${selected?.nome}" aplicado ao documento.`, stampId)}>Aplicar carimbo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (action.kind === "signature") {
    const selected = signatures.find((s) => s.id === signatureId);
    const pinOk = !selected?.requerPin || pin.length >= 4;
    const canPosition = Boolean(selected?.imagemUrl && principalPdfUrl);

    if (positioning && selected?.imagemUrl && principalPdfUrl) {
      return (
        <StampPositionPicker
          open
          onOpenChange={(v) => !v && setPositioning(false)}
          pdfUrl={principalPdfUrl}
          imageUrl={selected.imagemUrl}
          itemName={selected.proprietario}
          initialPosition={selected.posicaoLivre}
          onConfirm={(posicao) => onComplete(`Documento assinado digitalmente por ${selected.proprietario}.`, signatureId, posicao)}
        />
      );
    }

    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Aplicar assinatura digital</DialogTitle>
            <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3.5">
            {signatures.length === 0 && <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Não existe uma assinatura activa associada ao seu utilizador. A Administração deve registá-la individualmente.</p>}
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
            <Button
              disabled={!selected || !pinOk}
              onClick={() =>
                canPosition
                  ? setPositioning(true)
                  : onComplete(`Documento assinado digitalmente por ${selected?.proprietario}.`, signatureId)
              }
            >
              {canPosition ? "Continuar e posicionar" : "Assinar documento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
