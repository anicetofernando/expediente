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
import { DespachoDialog } from "@/components/expedients/detail/despacho-dialog";
import { ACTIONS_BY_STATUS, type ActionDef } from "@/lib/expedient-actions";
import { hasActionPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCatalogs } from "@/lib/catalogs";
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
  secretaria: new Set(["receber", "protocolar", "encaminhar", "disponibilizar", "arquivar", "notificar"]),
  superior: new Set(["encaminhar", "parecer", "esclarecimento", "aprovar", "rejeitar", "devolver", "resposta", "disponibilizar", "retomar", "escalar"]),
  administracao: new Set(Object.values(ACTIONS_BY_STATUS).flat().map((action) => action.key)),
};

export function ActionPanel({ expedient, principalPdfUrl }: { expedient: ActionExpedient; principalPdfUrl?: string }) {
  const { toast } = useToast();
  const { perfilNavegacao, profile } = useSession();
  const router = useRouter();
  const blockDirectApproval = perfilNavegacao === "superior" && expedient.precisaEscalarDirector;
  const actions = (ACTIONS_BY_STATUS[expedient.estado] ?? [])
    .filter((action) => PROFILE_ACTIONS[perfilNavegacao]?.has(action.key))
    .filter((action) => hasActionPermission(profile.permissoes, action.key))
    .filter((action) => !(blockDirectApproval && action.key === "aprovar"));
  const [activeAction, setActiveAction] = React.useState<ActionDef | null>(null);

  async function complete(action: ActionDef, message: string, target?: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition) {
    try {
      const response = await fetch(`/api/expedients/${expedient.id}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: action.key, note: message, target, posicaoCarimbo, posicaoAssinatura }),
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
          onComplete={(msg, target, posicaoCarimbo, posicaoAssinatura) => complete(activeAction, msg, target, posicaoCarimbo, posicaoAssinatura)}
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
}: {
  action: ActionDef;
  expedient: ActionExpedient;
  principalPdfUrl?: string;
  onClose: () => void;
  onComplete: (message: string, target?: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition) => void;
}) {
  const { organizationalUnits } = useCatalogs();
  const { perfilNavegacao } = useSession();
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [target, setTarget] = React.useState("");

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

  if (action.kind === "protocolar") {
    if (!principalPdfUrl) return null;
    return (
      <ProtocolarDialog
        expedient={expedient}
        principalPdfUrl={principalPdfUrl}
        onClose={onClose}
        onComplete={(posicaoCarimbo, posicaoAssinatura) => onComplete(`${expedient.protocolo} protocolado.`, undefined, posicaoCarimbo, posicaoAssinatura)}
      />
    );
  }

  if (action.kind === "resposta") {
    if (perfilNavegacao === "superior" || perfilNavegacao === "administracao") {
      return (
        <DespachoDialog
          expedientId={expedient.id}
          protocolo={expedient.protocolo}
          onClose={onClose}
          onDone={() => { onClose(); router.refresh(); }}
        />
      );
    }
    return (
      <ConfirmDialog
        open
        onOpenChange={(v) => !v && onClose()}
        title={`${action.label} — ${expedient.protocolo}`}
        description={`Confirma a acção "${action.label}" sobre este expediente? Esta acção ficará registada no histórico e na auditoria do processo.`}
        confirmLabel={action.label}
        onConfirm={() => onComplete(`"${action.label}" aplicado a ${expedient.protocolo}.`)}
      />
    );
  }

  return null;
}

function ProtocolarDialog({
  expedient,
  principalPdfUrl,
  onClose,
  onComplete,
}: {
  expedient: ActionExpedient;
  principalPdfUrl: string;
  onClose: () => void;
  onComplete: (posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition) => void;
}) {
  const [authorization, setAuthorization] = React.useState<{ stamp: StampDefinition | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: true });
  const [positioning, setPositioning] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/document-authorizations", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, []);

  const readyToSign = Boolean(authorization.stamp && authorization.signature);
  const hasFreePositionImages = Boolean(authorization.stamp?.imagemUrl || authorization.signature?.imagemUrl);

  if (positioning) {
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => !v && setPositioning(false)}
        pdfUrl={principalPdfUrl}
        stamp={authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: authorization.stamp.posicaoLivre } : undefined}
        signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: authorization.signature.posicaoLivre } : undefined}
        onConfirm={(result) => onComplete(result.posicaoCarimbo, result.posicaoAssinatura)}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Protocolar</DialogTitle>
          <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3">
          {authorization.loading ? (
            <p className="text-[13px] text-graphite-500">A verificar o carimbo e a assinatura da sua unidade…</p>
          ) : readyToSign ? (
            <>
              <p className="text-[13px] text-graphite-600">
                Vai aplicar o carimbo de <strong>{authorization.stamp?.unidade}</strong> e a sua assinatura ({authorization.signature?.proprietario}) a este documento.
              </p>
              {!authorization.signature?.imagemUrl && (
                <p className="border border-info-200 bg-info-50 px-3 py-2 text-xs leading-relaxed text-info-800">
                  A sua assinatura ainda não tem uma imagem carregada, por isso vai ser aplicada como texto num local fixo do documento — não pode ser arrastada para uma posição específica. Peça a um administrador para carregar a imagem em Administração → Assinaturas.
                </p>
              )}
            </>
          ) : (
            <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              {!authorization.stamp && "A sua unidade ainda não tem um carimbo configurado. "}
              {!authorization.signature && "Não tem uma assinatura configurada. "}
              Contacte a administração — não é possível protocolar sem os dois.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!readyToSign || authorization.loading}
            onClick={() => (hasFreePositionImages ? setPositioning(true) : onComplete())}
          >
            {hasFreePositionImages ? "Continuar e posicionar" : "Protocolar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
