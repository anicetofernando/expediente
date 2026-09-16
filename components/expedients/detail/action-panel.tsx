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

type ActionExpedient = Pick<Expedient, "id" | "estado" | "protocolo" | "assunto" | "precisaEscalarDirector" | "exigeCarimbo" | "exigeAssinatura" | "responsavelActualId" | "destinatario" | "destinatarioId" | "destinatarioTipo" | "confidencialidade" | "pendingNextStatus">;

const PROFILE_ACTIONS: Record<string, Set<string>> = {
  remetente: new Set(["confirmar", "resposta"]),
  secretaria: new Set(["receber_encaminhar", "criar_nota", "devolver", "disponibilizar", "notificar"]),
  // "disponibilizar"/"notificar" so' se aplicam ao superior quando o processo e'
  // confidencial (a Secretaria nunca chega a ve-lo nesse caso) -- ver o filtro
  // allowSuperiorConfidentialHandoff mais abaixo.
  superior: new Set(["encaminhar", "parecer", "aprovar", "aprovar_nota", "rejeitar", "devolver", "resposta", "retomar", "escalar", "disponibilizar", "notificar"]),
  administracao: new Set(Object.values(ACTIONS_BY_STATUS).flat().map((action) => action.key)),
};

export function ActionPanel({ expedient, principalPdfUrl }: { expedient: ActionExpedient; principalPdfUrl?: string }) {
  const { toast } = useToast();
  const { perfilNavegacao, profile, user } = useSession();
  const router = useRouter();
  const blockDirectApproval = perfilNavegacao === "superior" && expedient.precisaEscalarDirector;
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
    .filter((action) => !(blockDirectApproval && action.key === "aprovar"))
    .filter((action) => !(blockSecretaryReturn && action.key === "devolver"))
    .filter((action) => !(blockNonResponsibleHandoff && (action.key === "resposta" || action.key === "esclarecimento")))
    .filter((action) => !(perfilNavegacao === "superior" && (action.key === "disponibilizar" || action.key === "notificar") && !allowSuperiorConfidentialHandoff))
    .map((action) => action.key === "resposta" && perfilNavegacao === "remetente"
      ? { ...action, label: "Responder" }
      : action.key === "criar_nota"
        ? { ...action, label: expedient.pendingNextStatus === "nota_cobertura" ? "Criar nota de cobertura" : "Criar nota" }
        : action);
  const [activeAction, setActiveAction] = React.useState<ActionDef | null>(null);

  async function complete(action: ActionDef, message: string, target?: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition, alvo?: string) {
    try {
      const response = await fetch(`/api/expedients/${expedient.id}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: action.key, note: message, target, posicaoCarimbo, posicaoAssinatura, alvo }),
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

  if (actions.length === 0 && !["rascunho", "devolvido"].includes(expedient.estado)) {
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
      {["rascunho", "devolvido"].includes(expedient.estado) && perfilNavegacao === "remetente" && (
        <Button asChild className="w-full justify-start">
          <Link href={`/expedientes/novo?rascunho=${expedient.id}`}>
            <FileEdit className="size-3.5" /> {expedient.estado === "devolvido" ? "Corrigir e voltar a submeter" : "Continuar edição"}
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
          onComplete={(msg, target, posicaoCarimbo, posicaoAssinatura, actionKeyOverride, alvo) =>
            complete(actionKeyOverride ? { ...activeAction, key: actionKeyOverride } : activeAction, msg, target, posicaoCarimbo, posicaoAssinatura, alvo)}
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
  onComplete: (message: string, target?: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition, actionKeyOverride?: string, alvo?: string) => void;
}) {
  const { organizationalUnits } = useCatalogs();
  const { perfilNavegacao } = useSession();
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [aprovarDespacho, setAprovarDespacho] = React.useState(false);

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
        onClose={onClose}
        onFinalizar={(alvo) => onComplete(`Expediente aprovado (${alvo === "nota" ? "assinado na nota" : "assinado no expediente"}).`, undefined, undefined, undefined, "aprovar", alvo)}
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
    const targetName = organizationalUnits.find((u) => u.id === target)?.nome;
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
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button disabled={!target} onClick={() => onComplete(`Encaminhado para ${targetName}.`, target)}>
              {action.label}
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
        onClose={onClose}
        onComplete={(message, destination, posicaoCarimbo, posicaoAssinatura) => onComplete(message, destination, posicaoCarimbo, posicaoAssinatura)}
      />
    );
  }

  if (action.kind === "nota") {
    return (
      <DespachoDialog
        expedientId={expedient.id}
        protocolo={expedient.protocolo}
        onClose={onClose}
        onDone={() => { onClose(); router.refresh(); }}
        endpoint="nota"
        dialogTitle={expedient.pendingNextStatus === "nota_cobertura" ? "Criar nota de cobertura" : "Criar nota"}
        requireStamp={false}
        submitLabel={expedient.pendingNextStatus === "nota_cobertura" ? "Registar nota de cobertura" : "Registar nota"}
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
  onClose,
  onComplete,
}: {
  expedient: ActionExpedient;
  principalPdfUrl?: string;
  onClose: () => void;
  onComplete: (message: string, target: string, posicaoCarimbo?: FreePosition, posicaoAssinatura?: FreePosition) => void;
}) {
  const { organizationalUnits } = useCatalogs();
  const [authorization, setAuthorization] = React.useState<{ stamp: StampDefinition | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: true });
  const [positioning, setPositioning] = React.useState(false);
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
    void fetch("/api/document-authorizations", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, []);

  const needsStamp = isFirstHop && Boolean(principalPdfUrl);
  const readyToStamp = Boolean(authorization.stamp && authorization.signature);
  const ready = Boolean(target && (!needsStamp || readyToStamp));
  const hasPositionableItems = isFirstHop && Boolean(principalPdfUrl && (authorization.stamp?.imagemUrl || authorization.signature?.imagemUrl));
  const targetName = organizationalUnits.find((unit) => unit.id === target)?.nome ?? "a unidade seleccionada";

  if (positioning && principalPdfUrl) {
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => !v && setPositioning(false)}
        pdfUrl={principalPdfUrl}
        stamp={authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: authorization.stamp.posicaoLivre } : undefined}
        signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: authorization.signature.posicaoLivre } : undefined}
        onConfirm={(result) => onComplete(`Recebido em ${targetName}. ${note}`.trim(), target, result.posicaoCarimbo, result.posicaoAssinatura)}
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
              ? setPositioning(true)
              : onComplete(`Recebido em ${targetName}. ${note}`.trim(), target))}
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
  onClose,
  onFinalizar,
  onCobertura,
  onDespacho,
}: {
  expedient: ActionExpedient;
  onClose: () => void;
  onFinalizar: (alvo: "nota" | "expediente") => void;
  onCobertura: () => void;
  onDespacho: () => void;
}) {
  const [modo, setModo] = React.useState<"finalizar" | "cobertura" | null>(null);
  const [alvo, setAlvo] = React.useState<"nota" | "expediente" | "despacho">("nota");

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
                modo === "finalizar" ? "border-navy-700 bg-navy-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "finalizar" ? "border-navy-300 bg-white text-navy-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
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
                modo === "cobertura" ? "border-navy-700 bg-navy-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "cobertura" ? "border-navy-300 bg-white text-navy-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
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
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!modo}
            onClick={() => {
              if (modo === "cobertura") return onCobertura();
              if (alvo === "despacho") return onDespacho();
              return onFinalizar(alvo);
            }}
          >
            {modo === "cobertura" ? "Emitir nota de cobertura" : alvo === "despacho" ? "Continuar" : "Aprovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
