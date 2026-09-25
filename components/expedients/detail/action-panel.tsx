"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileEdit,
  Forward,
  HelpCircle,
  Inbox,
  MessageSquareText,
  PackageCheck,
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
  PlayCircle,
  Send,
  Stamp,
  TrendingUp,
  Undo2,
  XCircle,
};

type ActionExpedient = Pick<Expedient, "id" | "estado" | "protocolo" | "assunto" | "exigeCarimbo" | "exigeAssinatura" | "responsavelActualId" | "destinatario" | "destinatarioId" | "destinatarioTipo" | "confidencialidade" | "pendingNextStatus">;
type ApprovalPdfUrls = { nota?: string; expediente?: string };

const PROFILE_ACTIONS: Record<string, Set<string>> = {
  remetente: new Set(["confirmar", "resposta"]),
  secretaria: new Set(["receber_encaminhar", "criar_nota", "devolver", "disponibilizar", "notificar"]),
  // "disponibilizar"/"notificar" so' se aplicam ao superior quando o processo e'
  // confidencial (a Secretaria nunca chega a ve-lo nesse caso) -- ver o filtro
  // allowSuperiorConfidentialHandoff mais abaixo.
  superior: new Set(["encaminhar", "parecer", "aprovar", "aprovar_nota", "rejeitar", "devolver", "resposta", "responder_nota", "enviar_parecer", "retomar", "escalar", "disponibilizar", "notificar"]),
  administracao: new Set(Object.values(ACTIONS_BY_STATUS).flat().map((action) => action.key)),
};

export function ActionPanel({
  expedient,
  principalPdfUrl,
  principalOriginalPdfUrl,
  principalCanPositionReference = false,
  approvalPdfUrls,
}: {
  expedient: ActionExpedient;
  principalPdfUrl?: string;
  principalOriginalPdfUrl?: string;
  principalCanPositionReference?: boolean;
  approvalPdfUrls?: ApprovalPdfUrls;
}) {
  const { toast } = useToast();
  const { perfilNavegacao, profile, user } = useSession();
  const router = useRouter();
  // Depois de encaminhar, a Secretaria deixa de poder devolver por iniciativa
  // propria -- o processo ja esta em maos do superior. So ele pode devolve-lo
  // a partir daqui (espelha a mesma regra aplicada no backend).
  const blockSecretaryReturn = perfilNavegacao === "secretaria" && ["encaminhado", "em_analise"].includes(expedient.estado);
  // Enquanto se aguarda parecer/esclarecimento, so quem recebeu o pedido (o
  // responsavel actual) pode responder -- quem o solicitou fica apenas a
  // aguardar, sem outras accoes disponiveis sobre este processo.
  const isPendingHandoff = ["aguardando_parecer", "aguardando_esclarecimento"].includes(expedient.estado);
  const isHandoffResponsible = expedient.responsavelActualId === user.id;
  const blockNonResponsibleHandoff = isPendingHandoff && !isHandoffResponsible;
  // Confidencial nunca passa pela Secretaria -- por isso, so' nesse caso, e' o
  // proprio superior responsavel que disponibiliza/notifica directamente.
  const allowSuperiorConfidentialHandoff = perfilNavegacao === "superior" && expedient.confidencialidade === "confidencial";
  const actions = (ACTIONS_BY_STATUS[expedient.estado] ?? [])
    .filter((action) => PROFILE_ACTIONS[perfilNavegacao]?.has(action.key))
    .filter((action) => hasActionPermission(profile.permissoes, action.key))
    .filter((action) => !(blockSecretaryReturn && action.key === "devolver"))
    .filter((action) => !(blockNonResponsibleHandoff && (action.key === "resposta" || action.key === "esclarecimento")))
    .filter((action) => !(perfilNavegacao === "superior" && (action.key === "disponibilizar" || action.key === "notificar") && !allowSuperiorConfidentialHandoff))
    .map((action) => action.key === "resposta" && perfilNavegacao === "remetente"
      ? { ...action, label: "Responder" }
      : action.key === "criar_nota"
        ? { ...action, label: expedient.pendingNextStatus === "nota_cobertura" ? "Criar nota de cobertura" : "Criar nota" }
        : action);
  const [activeAction, setActiveAction] = React.useState<ActionDef | null>(null);
  const canSenderEdit =
    perfilNavegacao === "remetente" &&
    ["rascunho", "devolvido", "submetido"].includes(expedient.estado);
  const senderEditLabel =
    expedient.estado === "devolvido"
      ? "Corrigir e voltar a submeter"
      : expedient.estado === "submetido"
        ? "Editar"
        : "Continuar edição";

  async function complete(action: ActionDef, message: string, target?: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition, alvo?: string, posicaoNota?: FreePosition, posicaoReferencia?: FreePosition) {
    try {
      const response = await fetch(`/api/expedients/${expedient.id}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: action.key, note: message, target, posicaoCarimbo, posicaoAssinatura, alvo, posicaoNota, posicaoReferencia }),
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

  if (actions.length === 0 && blockNonResponsibleHandoff) {
    return (
      <div className="rounded-lg border border-graphite-200 bg-graphite-50 px-4 py-5 text-center">
        <ClipboardCheck className="mx-auto mb-2 size-5 text-graphite-400" />
        <p className="text-[13px] font-medium text-graphite-600">
          {expedient.estado === "aguardando_parecer" ? "A aguardar parecer" : "A aguardar esclarecimento"}
        </p>
        <p className="mt-1 text-2xs text-graphite-400">
          O pedido já foi encaminhado. Não há nenhuma acção a fazer aqui até que seja respondido.
        </p>
      </div>
    );
  }

  // Enquanto o remetente corrige um expediente devolvido, mais ninguem tem
  // nada a fazer aqui -- nem a Secretaria nem o superior podem agir sobre um
  // processo que ainda esta a ser reescrito.
  if (expedient.estado === "devolvido" && perfilNavegacao !== "remetente") {
    return (
      <div className="rounded-lg border border-graphite-200 bg-graphite-50 px-4 py-5 text-center">
        <ClipboardCheck className="mx-auto mb-2 size-5 text-graphite-400" />
        <p className="text-[13px] font-medium text-graphite-600">A aguardar correcção</p>
        <p className="mt-1 text-2xs text-graphite-400">O expediente foi devolvido ao remetente e está a ser corrigido. Não há nenhuma acção a fazer aqui até ser reenviado.</p>
      </div>
    );
  }

  if (actions.length === 0 && !canSenderEdit) {
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
      {canSenderEdit && (
        <Button asChild className="w-full justify-start">
          <Link href={`/expedientes/novo?rascunho=${expedient.id}`}>
            <FileEdit className="size-3.5" /> {senderEditLabel}
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
          principalOriginalPdfUrl={principalOriginalPdfUrl}
          principalCanPositionReference={principalCanPositionReference}
          approvalPdfUrls={approvalPdfUrls}
          onClose={() => setActiveAction(null)}
          onComplete={(msg, target, posicaoCarimbo, posicaoAssinatura, actionKeyOverride, alvo, posicaoNota, posicaoReferencia) =>
            complete(actionKeyOverride ? { ...activeAction, key: actionKeyOverride } : activeAction, msg, target, posicaoCarimbo, posicaoAssinatura, alvo, posicaoNota, posicaoReferencia)}
        />
      )}
    </div>
  );
}

function ActionDialog({
  action,
  expedient,
  principalPdfUrl,
  principalOriginalPdfUrl,
  principalCanPositionReference,
  approvalPdfUrls,
  onClose,
  onComplete,
}: {
  action: ActionDef;
  expedient: ActionExpedient;
  principalPdfUrl?: string;
  principalOriginalPdfUrl?: string;
  principalCanPositionReference?: boolean;
  approvalPdfUrls?: ApprovalPdfUrls;
  onClose: () => void;
  onComplete: (message: string, target?: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition, actionKeyOverride?: string, alvo?: string, posicaoNota?: FreePosition, posicaoReferencia?: FreePosition) => void;
}) {
  const { organizationalUnits } = useCatalogs();
  const { perfilNavegacao } = useSession();
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [aprovarDespacho, setAprovarDespacho] = React.useState(false);
  const [rejeitarDespacho, setRejeitarDespacho] = React.useState(false);
  const [forwardAuthorization, setForwardAuthorization] = React.useState<{ stamp: StampDefinition | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: false });
  const [forwardPositioning, setForwardPositioning] = React.useState(false);
  const shouldSignCoverageNote = action.kind === "forward" && expedient.estado === "nota_cobertura";
  const shouldSignResponseNote = action.kind === "resposta-cobertura";
  const needsAprovacaoAuthorization = shouldSignCoverageNote || shouldSignResponseNote;

  React.useEffect(() => {
    if (!needsAprovacaoAuthorization) {
      setForwardAuthorization({ stamp: null, signature: null, loading: false });
      return;
    }
    let cancelled = false;
    setForwardAuthorization((current) => ({ ...current, loading: true }));
    void fetch("/api/document-authorizations?purpose=aprovacao", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setForwardAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setForwardAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, [needsAprovacaoAuthorization]);

  React.useEffect(() => {
    setForwardPositioning(false);
  }, [action.key, target]);

  if (action.kind === "rejeitar") {
    if (rejeitarDespacho) {
      return (
        <DespachoDialog
          expedientId={expedient.id}
          protocolo={expedient.protocolo}
          onClose={onClose}
          onDone={() => { onClose(); router.refresh(); }}
          endpoint="resposta"
          dialogTitle="Criar despacho de rejeição"
          submitLabel="Registar e rejeitar"
          intent="rejeitar"
        />
      );
    }
    return (
      <RejeitarDialog
        expedient={expedient}
        approvalPdfUrls={approvalPdfUrls}
        onClose={onClose}
        onMarcar={(alvo, motivo, posicoes) => onComplete(motivo, undefined, posicoes?.posicaoCarimbo, posicoes?.posicaoAssinatura, undefined, alvo, posicoes?.posicaoNota)}
        onDespacho={() => setRejeitarDespacho(true)}
      />
    );
  }

  if (action.kind === "aprovar") {
    if (aprovarDespacho) {
      return (
        <DespachoDialog
          expedientId={expedient.id}
          protocolo={expedient.protocolo}
          onClose={onClose}
          onDone={() => { onClose(); router.refresh(); }}
          endpoint="resposta"
          dialogTitle="Criar despacho de aprovação"
          submitLabel="Registar e aprovar"
        />
      );
    }
    return (
      <AprovarDialog
        expedient={expedient}
        approvalPdfUrls={approvalPdfUrls}
        onClose={onClose}
        onFinalizar={(alvo, texto, posicoes) => onComplete(texto, undefined, posicoes?.posicaoCarimbo, posicoes?.posicaoAssinatura, "aprovar", alvo, posicoes?.posicaoNota)}
        onCobertura={() => onComplete("Nota de cobertura pedida.", undefined, undefined, undefined, "aprovar_nota")}
        onDespacho={() => setAprovarDespacho(true)}
      />
    );
  }

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
    const departments = organizationalUnits.filter((u) => u.tipo === "direccao");
    const services = departmentId ? organizationalUnits.filter((u) => u.parentId === departmentId) : [];
    const targetName = organizationalUnits.find((u) => u.id === target)?.nome ?? "a unidade seleccionada";
    const coveragePdfUrl = approvalPdfUrls?.nota;
    const readyToSignCoverage = !shouldSignCoverageNote || (!forwardAuthorization.loading && Boolean(forwardAuthorization.stamp && forwardAuthorization.signature));
    const canPositionCoverage = shouldSignCoverageNote && Boolean(coveragePdfUrl && (forwardAuthorization.stamp?.imagemUrl || forwardAuthorization.signature?.imagemUrl));
    const message = `${action.key === "parecer" ? "Solicitado parecer a" : "Encaminhado para"} ${targetName}. ${note}`.trim();
    if (forwardPositioning && coveragePdfUrl) {
      return (
        <StampPositionPicker
          open
          onOpenChange={(v) => !v && setForwardPositioning(false)}
          pdfUrl={coveragePdfUrl}
          stamp={forwardAuthorization.stamp?.imagemUrl ? { imageUrl: forwardAuthorization.stamp.imagemUrl, label: forwardAuthorization.stamp.nome, initialPosition: forwardAuthorization.stamp.posicaoLivre } : undefined}
          signature={forwardAuthorization.signature?.imagemUrl ? { imageUrl: forwardAuthorization.signature.imagemUrl, label: forwardAuthorization.signature.proprietario, initialPosition: forwardAuthorization.signature.posicaoLivre } : undefined}
          onConfirm={(result) => onComplete(message, target, result.posicaoCarimbo, result.posicaoAssinatura)}
        />
      );
    }
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{action.label}</DialogTitle>
            <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3.5">
            <div>
              <Label required>Departamento</Label>
              <Select
                value={departmentId}
                onValueChange={(value) => { setDepartmentId(value); setTarget(value); }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccione o departamento" /></SelectTrigger>
                <SelectContent>
                  {departments.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {services.length > 0 && (
              <div>
                <Label>Serviço (opcional — sem escolher, vai para o departamento)</Label>
                <Select value={target === departmentId ? "" : target} onValueChange={(value) => setTarget(value)}>
                  <SelectTrigger><SelectValue placeholder="Enviar directamente ao departamento" /></SelectTrigger>
                  <SelectContent>
                    {services.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Instruções (opcional)</Label>
              <Textarea rows={3} placeholder="Acrescente instruções para o destinatário…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {shouldSignCoverageNote && forwardAuthorization.loading && (
              <p className="text-[13px] text-graphite-500">A verificar o carimbo e a assinatura...</p>
            )}
            {shouldSignCoverageNote && !forwardAuthorization.loading && !readyToSignCoverage && (
              <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                {!forwardAuthorization.stamp && "A sua unidade ainda nao tem um carimbo activo. "}
                {!forwardAuthorization.signature && "Nao tem uma assinatura individual configurada. "}
                Configure antes de encaminhar esta nota.
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={!target || !readyToSignCoverage || (shouldSignCoverageNote && forwardAuthorization.loading)}
              onClick={() => (canPositionCoverage ? setForwardPositioning(true) : onComplete(message, target))}
            >
              {canPositionCoverage ? "Posicionar e continuar" : action.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (action.kind === "resposta-cobertura") {
    const coveragePdfUrl = approvalPdfUrls?.nota;
    const readyToSign = !forwardAuthorization.loading && Boolean(forwardAuthorization.stamp && forwardAuthorization.signature);
    const canPosition = Boolean(coveragePdfUrl && (forwardAuthorization.stamp?.imagemUrl || forwardAuthorization.signature?.imagemUrl));
    const message = `Parecer respondido. ${note}`.trim();
    if (forwardPositioning && coveragePdfUrl) {
      return (
        <StampPositionPicker
          open
          onOpenChange={(v) => !v && setForwardPositioning(false)}
          pdfUrl={coveragePdfUrl}
          stamp={forwardAuthorization.stamp?.imagemUrl ? { imageUrl: forwardAuthorization.stamp.imagemUrl, label: forwardAuthorization.stamp.nome, initialPosition: forwardAuthorization.stamp.posicaoLivre } : undefined}
          signature={forwardAuthorization.signature?.imagemUrl ? { imageUrl: forwardAuthorization.signature.imagemUrl, label: forwardAuthorization.signature.proprietario, initialPosition: forwardAuthorization.signature.posicaoLivre } : undefined}
          onConfirm={(result) => onComplete(message, undefined, result.posicaoCarimbo, result.posicaoAssinatura)}
        />
      );
    }
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{action.label} — {expedient.protocolo}</DialogTitle>
            <DialogDescription>{expedient.assunto} · a nota de cobertura volta directamente a quem pediu o parecer.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3.5">
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea rows={3} placeholder="Acrescente observações à resposta…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {forwardAuthorization.loading && (
              <p className="text-[13px] text-graphite-500">A verificar o carimbo e a assinatura...</p>
            )}
            {!forwardAuthorization.loading && !readyToSign && (
              <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                {!forwardAuthorization.stamp && "A sua unidade ainda nao tem um carimbo activo. "}
                {!forwardAuthorization.signature && "Nao tem uma assinatura individual configurada. "}
                Configure antes de assinar esta nota.
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={!readyToSign || forwardAuthorization.loading}
              onClick={() => (canPosition ? setForwardPositioning(true) : onComplete(message, undefined))}
            >
              {canPosition ? "Posicionar e enviar" : action.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (action.kind === "receive-forward") {
    return (
      <ReceiveForwardDialog
        expedient={expedient}
        principalPdfUrl={principalPdfUrl}
        principalOriginalPdfUrl={principalOriginalPdfUrl}
        principalCanPositionReference={principalCanPositionReference}
        onClose={onClose}
        onComplete={(message, destination, posicaoCarimbo, posicaoAssinatura, posicaoReferencia) => onComplete(message, destination, posicaoCarimbo, posicaoAssinatura, undefined, undefined, undefined, posicaoReferencia)}
      />
    );
  }

  if (action.kind === "nota") {
    const isCobertura = expedient.pendingNextStatus === "nota_cobertura" || expedient.pendingNextStatus === "resposta_parecer";
    return (
      <DespachoDialog
        expedientId={expedient.id}
        protocolo={expedient.protocolo}
        onClose={onClose}
        onDone={() => { onClose(); router.refresh(); }}
        endpoint="nota"
        dialogTitle={isCobertura ? "Criar nota de cobertura" : "Criar nota"}
        submitLabel={isCobertura ? "Registar nota de cobertura" : "Registar nota"}
        isCobertura={isCobertura}
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
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Responder — {expedient.protocolo}</DialogTitle>
            <DialogDescription>{expedient.assunto} · continua no mesmo processo, sem novo número.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Label required>Resposta</Label>
            <Textarea rows={5} placeholder="Escreva a sua resposta, esclarecimento ou correcção…" value={note} onChange={(e) => setNote(e.target.value)} />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button disabled={!note.trim()} onClick={() => onComplete(note)}>Responder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}

function ReceiveForwardDialog({
  expedient,
  principalPdfUrl,
  principalOriginalPdfUrl,
  principalCanPositionReference,
  onClose,
  onComplete,
}: {
  expedient: ActionExpedient;
  principalPdfUrl?: string;
  principalOriginalPdfUrl?: string;
  principalCanPositionReference?: boolean;
  onClose: () => void;
  onComplete: (message: string, target: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition, posicaoReferencia?: FreePosition) => void;
}) {
  const { organizationalUnits } = useCatalogs();
  const [authorization, setAuthorization] = React.useState<{ stamp: StampDefinition | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: true });
  const [positioning, setPositioning] = React.useState<"reference" | "stamp" | null>(null);
  const [referencePosition, setReferencePosition] = React.useState<FreePosition | undefined>();
  const [note, setNote] = React.useState("");

  // "em_transito" e' sempre um salto seguinte (subida a director, ou pedido de
  // parecer a outra unidade) -- o destino ja vem fixo, nao ha protocolo-copia
  // a carimbar aqui (isso so acontece no primeiro salto); so falta confirmar a
  // recepcao antes de a Secretaria desta unidade preparar a proxima nota.
  const isFirstHop = expedient.estado !== "em_transito";

  // O remetente ja escolheu o destino ao criar o expediente: um servico
  // especifico (a Secretaria nao tem escolha, encaminha so para ele) ou apenas
  // o departamento/direccao (a Secretaria escolhe entre os servicos daquele
  // departamento). Se a direccao nao tiver servicos, encaminha directo a ela.
  const childServices = isFirstHop ? organizationalUnits.filter((unit) => unit.parentId === expedient.destinatarioId) : [];
  const isLocked = !isFirstHop || expedient.destinatarioTipo !== "direccao" || childServices.length === 0;
  const [target, setTarget] = React.useState(isLocked ? expedient.destinatarioId : "");

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/document-authorizations?purpose=secretaria", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, []);

  const needsStamp = isFirstHop && Boolean(principalPdfUrl);
  const needsReference = isFirstHop && principalCanPositionReference && Boolean(principalPdfUrl);
  const readyToStamp = Boolean(authorization.stamp && authorization.signature);
  const ready = Boolean(target && (!needsStamp || readyToStamp));
  const hasStampPositionableItems = isFirstHop && Boolean(principalPdfUrl && (authorization.stamp?.imagemUrl || authorization.signature?.imagemUrl));
  const hasPositionableItems = needsReference || hasStampPositionableItems;
  const targetName = organizationalUnits.find((unit) => unit.id === target)?.nome ?? "a unidade seleccionada";
  const completeMessage = `Recebido em ${targetName}. ${note}`.trim();

  if (positioning === "reference" && principalPdfUrl) {
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => !v && setPositioning(null)}
        pdfUrl={principalPdfUrl}
        fallbackPdfUrl={principalOriginalPdfUrl}
        previewPage="first"
        reference={{ kind: "text", label: "Referencia", text: "N/Ref.: protocolo oficial" }}
        onConfirm={(result) => {
          setReferencePosition(result.posicaoReferencia);
          if (hasStampPositionableItems) setPositioning("stamp");
          else onComplete(completeMessage, target, undefined, undefined, result.posicaoReferencia);
        }}
      />
    );
  }

  if (positioning === "stamp" && principalPdfUrl) {
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => !v && setPositioning(null)}
        pdfUrl={principalPdfUrl}
        fallbackPdfUrl={principalOriginalPdfUrl}
        stamp={authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: authorization.stamp.posicaoLivre } : undefined}
        signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: authorization.signature.posicaoLivre } : undefined}
        onConfirm={(result) => onComplete(completeMessage, target, result.posicaoCarimbo, result.posicaoAssinatura, referencePosition)}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{isFirstHop ? "Receber e protocolar" : "Receber nesta unidade"}</DialogTitle>
          <DialogDescription>{expedient.protocolo} · {expedient.assunto}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3.5">
          <div>
            <Label required>Unidade responsável pela análise</Label>
            {isLocked ? (
              <p className="flex items-center gap-1.5 border border-graphite-200 bg-graphite-50 px-3 py-2 text-[13px] text-graphite-700">
                <Building2 className="size-3.5 shrink-0 text-graphite-400" />
                {expedient.destinatario} <span className="text-graphite-400">— definido pelo remetente, não é possível alterar aqui.</span>
              </p>
            ) : (
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger><SelectValue placeholder="Seleccione o serviço" /></SelectTrigger>
                <SelectContent>
                  {childServices.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>Instruções (opcional)</Label>
            <Textarea rows={3} placeholder="Acrescente instruções para a unidade responsável…" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          {isFirstHop && authorization.loading ? (
            <p className="text-[13px] text-graphite-500">A verificar o carimbo e a assinatura da Secretaria…</p>
          ) : !needsStamp ? (
            <p className="text-xs text-graphite-500">
              {isFirstHop
                ? "Este expediente não tem documento principal; o protocolo será registado no processo, sem cópia de protocolo."
                : "Depois de confirmar, terá de criar a nota de encaminhamento (com a sua assinatura e, se aplicável, o carimbo da unidade)."}
            </p>
          ) : readyToStamp ? (
            <p className="text-[13px] text-graphite-600">
              A cópia de protocolo será carimbada com <strong>{authorization.stamp?.nome}</strong> e assinada por {authorization.signature?.proprietario}.
              {needsReference ? " Antes disso, vai posicionar a referencia no cabecalho do documento importado." : ""}
            </p>
          ) : (
            <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              {!authorization.stamp && "A Secretaria ainda não tem um carimbo institucional activo. "}
              {!authorization.signature && "Não tem uma assinatura individual configurada. "}
              Configure em Administração antes de receber este documento.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!ready || (needsStamp && authorization.loading)}
            onClick={() => (hasPositionableItems
              ? setPositioning(needsReference ? "reference" : "stamp")
              : onComplete(completeMessage, target))}
          >
            {hasPositionableItems ? "Posicionar e concluir" : isFirstHop ? "Receber e protocolar" : "Confirmar recepção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AprovarDialog({
  expedient,
  approvalPdfUrls,
  onClose,
  onFinalizar,
  onCobertura,
  onDespacho,
}: {
  expedient: ActionExpedient;
  approvalPdfUrls?: ApprovalPdfUrls;
  onClose: () => void;
  onFinalizar: (alvo: "nota" | "expediente", texto: string, posicoes?: { posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition; posicaoNota?: FreePosition }) => void;
  onCobertura: () => void;
  onDespacho: () => void;
}) {
  const { user } = useSession();
  const [modo, setModo] = React.useState<"finalizar" | "cobertura" | null>(null);
  const [alvo, setAlvo] = React.useState<"nota" | "expediente" | "despacho">("nota");
  const [texto, setTexto] = React.useState("");
  const [authorization, setAuthorization] = React.useState<{ stamp: StampDefinition | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: false });
  const [positioning, setPositioning] = React.useState(false);

  const selectedPdfUrl = alvo === "nota" ? approvalPdfUrls?.nota : approvalPdfUrls?.expediente;
  const checksAuthorization = modo === "finalizar" && alvo !== "despacho";
  const readyToApprove = !checksAuthorization || (!authorization.loading && Boolean(authorization.stamp && authorization.signature));
  const canPositionDecision = checksAuthorization && Boolean(selectedPdfUrl);

  React.useEffect(() => {
    if (!checksAuthorization) return;
    let cancelled = false;
    setAuthorization((current) => ({ ...current, loading: true }));
    void fetch("/api/document-authorizations?purpose=aprovacao", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, [checksAuthorization]);

  React.useEffect(() => {
    setPositioning(false);
  }, [alvo, texto]);

  if (positioning && selectedPdfUrl) {
    const attribution = [user.nome, user.cargo].filter(Boolean).join(" - ");
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => !v && setPositioning(false)}
        pdfUrl={selectedPdfUrl}
        stamp={authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: authorization.stamp.posicaoLivre } : undefined}
        signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: authorization.signature.posicaoLivre } : undefined}
        note={{ kind: "text", label: "Texto da decisao", text: texto.trim(), attribution }}
        onConfirm={(result) => onFinalizar(alvo as "nota" | "expediente", texto.trim(), result)}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Aprovar — {expedient.protocolo}</DialogTitle>
          <DialogDescription>{expedient.assunto}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3.5">
          <div className="grid grid-cols-1 gap-2.5">
            <button
              type="button"
              onClick={() => setModo("finalizar")}
              className={cn(
                "flex items-start gap-3 border px-3.5 py-2.5 text-left transition-colors",
                modo === "finalizar" ? "border-cfm-700 bg-cfm-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "finalizar" ? "border-cfm-300 bg-white text-cfm-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                <CheckCircle2 className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-graphite-900">Finalizar aprovação</span>
                <span className="block text-xs text-graphite-500">Carimba/assina agora e termina — segue para a Secretaria disponibilizar ao remetente.</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setModo("cobertura")}
              className={cn(
                "flex items-start gap-3 border px-3.5 py-2.5 text-left transition-colors",
                modo === "cobertura" ? "border-cfm-700 bg-cfm-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "cobertura" ? "border-cfm-300 bg-white text-cfm-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                <FileEdit className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-graphite-900">Emitir nota de cobertura</span>
                <span className="block text-xs text-graphite-500">A Secretaria prepara uma nota em branco; você carimba e assina ao encaminhar ou pedir parecer a outra unidade.</span>
              </span>
            </button>
          </div>
          {modo === "finalizar" && (
            <div>
              <Label required>Como registar a aprovação</Label>
              <Select value={alvo} onValueChange={(value) => setAlvo(value as "nota" | "expediente" | "despacho")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nota">Carimbar/assinar na nota actual</SelectItem>
                  <SelectItem value="expediente">Carimbar/assinar no expediente original</SelectItem>
                  <SelectItem value="despacho">Criar um despacho novo (carimbo e assinatura)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {modo === "finalizar" && alvo !== "despacho" && (
            <div>
              <Label required>Texto de aprovação</Label>
              <Textarea rows={3} placeholder="Autorizo…" value={texto} onChange={(event) => setTexto(event.target.value)} />
              <p className="mt-1 text-2xs text-graphite-400">Este texto fica visível dentro do documento, junto ao carimbo e à assinatura.</p>
            </div>
          )}
          {checksAuthorization && authorization.loading && (
            <p className="text-[13px] text-graphite-500">A verificar o carimbo e a assinatura...</p>
          )}
          {checksAuthorization && !authorization.loading && !readyToApprove && (
            <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              {!authorization.stamp && "A sua unidade ainda nao tem um carimbo activo. "}
              {!authorization.signature && "Nao tem uma assinatura individual configurada. "}
              Configure antes de aprovar directamente.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!modo || (modo === "finalizar" && alvo !== "despacho" && (!texto.trim() || !readyToApprove))}
            onClick={() => {
              if (modo === "cobertura") return onCobertura();
              if (alvo === "despacho") return onDespacho();
              if (canPositionDecision) return setPositioning(true);
              return onFinalizar(alvo, texto.trim());
            }}
          >
            {modo === "cobertura" ? "Emitir nota de cobertura" : alvo === "despacho" ? "Continuar" : canPositionDecision ? "Posicionar e aprovar" : "Aprovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejeitarDialog({
  expedient,
  approvalPdfUrls,
  onClose,
  onMarcar,
  onDespacho,
}: {
  expedient: ActionExpedient;
  approvalPdfUrls?: ApprovalPdfUrls;
  onClose: () => void;
  onMarcar: (alvo: "nota" | "expediente", motivo: string, posicoes?: { posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition; posicaoNota?: FreePosition }) => void;
  onDespacho: () => void;
}) {
  const { user } = useSession();
  const [alvo, setAlvo] = React.useState<"nota" | "expediente" | "despacho">("expediente");
  const [motivo, setMotivo] = React.useState("");
  const [authorization, setAuthorization] = React.useState<{ stamp: StampDefinition | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: false });
  const [positioning, setPositioning] = React.useState(false);
  const selectedPdfUrl = alvo === "nota" ? approvalPdfUrls?.nota : approvalPdfUrls?.expediente;
  const checksAuthorization = alvo !== "despacho";
  const readyToReject = !checksAuthorization || (!authorization.loading && Boolean(authorization.stamp && authorization.signature));
  const canPositionDecision = checksAuthorization && Boolean(selectedPdfUrl);

  React.useEffect(() => {
    if (!checksAuthorization) return;
    let cancelled = false;
    setAuthorization((current) => ({ ...current, loading: true }));
    void fetch("/api/document-authorizations?purpose=aprovacao", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, [checksAuthorization]);

  React.useEffect(() => {
    setPositioning(false);
  }, [alvo, motivo]);

  if (positioning && selectedPdfUrl) {
    const attribution = [user.nome, user.cargo].filter(Boolean).join(" - ");
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => !v && setPositioning(false)}
        pdfUrl={selectedPdfUrl}
        stamp={authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: authorization.stamp.posicaoLivre } : undefined}
        signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: authorization.signature.posicaoLivre } : undefined}
        note={{ kind: "text", label: "Motivo da rejeição", text: motivo.trim(), attribution }}
        onConfirm={(result) => onMarcar(alvo as "nota" | "expediente", motivo.trim(), result)}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Rejeitar — {expedient.protocolo}</DialogTitle>
          <DialogDescription>{expedient.assunto}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3.5">
          <div>
            <Label required>Como registar a rejeição</Label>
            <Select value={alvo} onValueChange={(value) => setAlvo(value as "nota" | "expediente" | "despacho")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="expediente">Carimbar/assinar no expediente original</SelectItem>
                <SelectItem value="nota">Carimbar/assinar na nota actual</SelectItem>
                <SelectItem value="despacho">Criar um despacho de rejeição (carimbo e assinatura)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {alvo !== "despacho" && (
            <div>
              <Label required>Motivo da rejeição</Label>
              <Textarea rows={4} placeholder="Descreva o motivo da rejeição…" value={motivo} onChange={(event) => setMotivo(event.target.value)} />
            </div>
          )}
          {checksAuthorization && authorization.loading && (
            <p className="text-[13px] text-graphite-500">A verificar o carimbo e a assinatura...</p>
          )}
          {checksAuthorization && !authorization.loading && !readyToReject && (
            <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              {!authorization.stamp && "A sua unidade ainda nao tem um carimbo activo. "}
              {!authorization.signature && "Nao tem uma assinatura individual configurada. "}
              Configure antes de rejeitar directamente.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={alvo !== "despacho" && (!motivo.trim() || !readyToReject)}
            onClick={() => {
              if (alvo === "despacho") return onDespacho();
              if (canPositionDecision) return setPositioning(true);
              return onMarcar(alvo, motivo.trim());
            }}
          >
            {alvo === "despacho" ? "Continuar" : canPositionDecision ? "Posicionar e rejeitar" : "Rejeitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
