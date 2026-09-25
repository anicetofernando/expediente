"use client";

import * as React from "react";
import { FileEdit, Upload } from "lucide-react";
import type { FreePosition, Signature, Stamp } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LetterEditor } from "@/components/documents/letter-editor";
import { StampPositionPicker } from "@/components/documents/stamp-position-picker";
import { useCatalogs } from "@/lib/catalogs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/session";
import { deleteBrowserDraft, readBrowserDraft, writeBrowserDraft, type BrowserDraft } from "@/lib/browser-drafts";

interface DespachoLocalDraftValue {
  modo: "sistema" | "importado";
  modeloId: string;
  conteudo: string;
  assunto: string;
  note: string;
  incluirCarimbo: boolean;
  ficheiro: File | null;
}

function textFromHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

function hasMeaningfulDraft(value: DespachoLocalDraftValue) {
  return Boolean(
    value.assunto.trim() ||
    value.note.trim() ||
    value.modeloId ||
    textFromHtml(value.conteudo) ||
    value.ficheiro,
  );
}

function formatDraftTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function DespachoDialog({
  expedientId,
  protocolo,
  onClose,
  onDone,
  endpoint = "resposta",
  dialogTitle = "Criar despacho / resposta",
  submitLabel = "Registar despacho",
  intent,
  isCobertura = false,
}: {
  expedientId: string;
  protocolo: string;
  onClose: () => void;
  onDone: () => void;
  /** Endpoint irmao "/resposta" (despacho, com carimbo/assinatura obrigatorios
   * de quem decide) ou "/nota" (nota de encaminhamento da Secretaria -- a
   * primeira de cada salto leva a assinatura dela, obrigatoria, e o carimbo,
   * opcional; a nota de cobertura fica sempre em branco). */
  endpoint?: "resposta" | "nota";
  dialogTitle?: string;
  submitLabel?: string;
  /** So' para o endpoint "resposta" a partir de "encaminhado": decide se o
   * despacho, ao ficar pronto, aprova ou rejeita o expediente. */
  intent?: "aprovar" | "rejeitar";
  /** So' para o endpoint "nota": indica que esta e' a nota de cobertura --
   * nunca leva carimbo nem assinatura da Secretaria, so' o chefe/director a
   * marca mais tarde, ao encaminhar ou pedir parecer. */
  isCobertura?: boolean;
}) {
  const { toast } = useToast();
  const { user } = useSession();
  const { documentTemplates } = useCatalogs();
  const isDespacho = endpoint === "resposta";
  // Precisa de carimbo/assinatura de quem esta a criar o documento em ambos os
  // casos -- despacho (sempre) e a primeira nota de cada salto (assinatura
  // obrigatoria, carimbo opcional). So' a nota de cobertura fica em branco.
  const needsAuthorization = isDespacho || !isCobertura;
  const requireStamp = isDespacho;
  const [modo, setModo] = React.useState<"sistema" | "importado">("sistema");
  const [modeloId, setModeloId] = React.useState("");
  const [conteudo, setConteudo] = React.useState("");
  // A referencia ao expediente original fica sempre fixa no cabecalho do
  // documento (gerada pelo sistema) -- nunca e' texto editavel no corpo.
  const [assunto, setAssunto] = React.useState("");
  const [ficheiro, setFicheiro] = React.useState<File | null>(null);
  const [note, setNote] = React.useState("");
  const [incluirCarimbo, setIncluirCarimbo] = React.useState(true);
  const [authorization, setAuthorization] = React.useState<{ stamp: Stamp | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: needsAuthorization });
  const [documentId, setDocumentId] = React.useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [positioning, setPositioning] = React.useState(false);
  const [referencePositioning, setReferencePositioning] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [localDraftReady, setLocalDraftReady] = React.useState(false);
  const [localDraftRestored, setLocalDraftRestored] = React.useState<BrowserDraft<DespachoLocalDraftValue> | null>(null);
  const [localSaveStatus, setLocalSaveStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const draftKey = React.useMemo(
    () => `document-editor:${user.id}:${expedientId}:${endpoint}:${intent ?? "normal"}:${isCobertura ? "cobertura" : "regular"}`,
    [endpoint, expedientId, intent, isCobertura, user.id],
  );

  React.useEffect(() => {
    // A nota de cobertura nunca leva carimbo/assinatura da Secretaria -- nao
    // ha nada a verificar aqui, ela pode sempre escrever.
    if (!needsAuthorization) return;
    let cancelled = false;
    void fetch(`/api/document-authorizations?purpose=${isDespacho ? "aprovacao" : "secretaria"}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, [isDespacho, needsAuthorization]);

  const template = documentTemplates.find((item) => item.id === modeloId);
  const activeTemplates = documentTemplates.filter((item) => item.estado === "activo");
  const readyToSign = !needsAuthorization || Boolean((!requireStamp || authorization.stamp) && authorization.signature);
  // No despacho o carimbo e' sempre obrigatorio; na primeira nota, so' entra
  // se a Secretaria escolher explicitamente inclui-lo -- nunca automaticamente.
  const applyStamp = needsAuthorization && (requireStamp || incluirCarimbo);
  const hasFreePositionImages = Boolean((applyStamp && authorization.stamp?.imagemUrl) || (needsAuthorization && authorization.signature?.imagemUrl));
  const successLabel = isDespacho ? "Despacho registado" : "Nota registada";
  const failureLabel = isDespacho ? "Despacho não registado" : "Nota não registada";
  const localDraftStatusText =
    localSaveStatus === "saving"
      ? "A guardar rascunho local..."
      : localSaveStatus === "saved"
        ? "Rascunho local guardado"
        : localSaveStatus === "error"
          ? "Rascunho local não guardado"
          : "";

  const currentDraftValue = React.useCallback((): DespachoLocalDraftValue => ({
    modo,
    modeloId,
    conteudo,
    assunto,
    note,
    incluirCarimbo,
    ficheiro,
  }), [assunto, conteudo, ficheiro, incluirCarimbo, modeloId, modo, note]);

  const clearLocalDraft = React.useCallback(async () => {
    try {
      await deleteBrowserDraft(draftKey);
    } finally {
      setLocalDraftRestored(null);
      setLocalSaveStatus("idle");
    }
  }, [draftKey]);

  const saveLocalDraft = React.useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (submitting) return;
    const value = currentDraftValue();
    try {
      if (!hasMeaningfulDraft(value)) {
        await deleteBrowserDraft(draftKey);
        if (!silent) setLocalSaveStatus("idle");
        return;
      }
      if (!silent) setLocalSaveStatus("saving");
      await writeBrowserDraft<DespachoLocalDraftValue>({
        key: draftKey,
        version: 1,
        updatedAt: new Date().toISOString(),
        value,
      });
      if (!silent) setLocalSaveStatus("saved");
    } catch {
      if (!silent) setLocalSaveStatus("error");
    }
  }, [currentDraftValue, draftKey, submitting]);

  React.useEffect(() => {
    let cancelled = false;
    setLocalDraftReady(false);
    void readBrowserDraft<DespachoLocalDraftValue>(draftKey)
      .then((draft) => {
        if (cancelled) return;
        if (draft && hasMeaningfulDraft(draft.value)) {
          setModo(draft.value.modo ?? "sistema");
          setModeloId(draft.value.modeloId ?? "");
          setConteudo(draft.value.conteudo ?? "");
          setAssunto(draft.value.assunto ?? "");
          setNote(draft.value.note ?? "");
          setIncluirCarimbo(draft.value.incluirCarimbo ?? true);
          setFicheiro(draft.value.ficheiro ?? null);
          setLocalDraftRestored(draft);
          setLocalSaveStatus("saved");
          toast({
            title: "Rascunho local recuperado",
            description: `Última edição: ${formatDraftTimestamp(draft.updatedAt) || "há pouco"}.`,
            variant: "success",
          });
          return;
        }
        setLocalDraftRestored(null);
        setLocalSaveStatus("idle");
      })
      .catch(() => {
        if (!cancelled) setLocalSaveStatus("error");
      })
      .finally(() => {
        if (!cancelled) setLocalDraftReady(true);
      });
    return () => { cancelled = true; };
  }, [draftKey, toast]);

  React.useEffect(() => {
    if (!localDraftReady || positioning || referencePositioning || submitting) return;
    const timer = window.setTimeout(() => {
      void saveLocalDraft();
    }, 600);
    return () => window.clearTimeout(timer);
  }, [assunto, conteudo, ficheiro, incluirCarimbo, localDraftReady, modeloId, modo, note, positioning, referencePositioning, saveLocalDraft, submitting]);

  React.useEffect(() => {
    if (!localDraftReady) return;
    const persistSilently = () => {
      void saveLocalDraft({ silent: true });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistSilently();
    };
    window.addEventListener("pagehide", persistSilently);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", persistSilently);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [localDraftReady, saveLocalDraft]);

  async function discardRecoveredLocalDraft() {
    await clearLocalDraft();
    setModo("sistema");
    setModeloId("");
    setConteudo("");
    setAssunto("");
    setNote("");
    setIncluirCarimbo(true);
    setFicheiro(null);
  }

  async function submitSistema() {
    if (!isDespacho && !assunto.trim()) {
      toast({ title: "Escreva o assunto da nota.", variant: "destructive" });
      return;
    }
    if (!conteudo.replace(/<[^>]*>/g, "").trim()) {
      toast({ title: isDespacho ? "Escreva o conteúdo do despacho." : "Escreva o conteúdo da nota.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ modo: "sistema", modeloId, conteudo, note, incluirCarimbo: applyStamp, assunto: !isDespacho ? assunto : undefined, intent }));
      const response = await fetch(`/api/expedients/${expedientId}/${endpoint}`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? `Não foi possível registar ${isDespacho ? "o despacho" : "a nota"}.`);
      if (hasFreePositionImages) {
        setDocumentId(result.documentId);
        setPdfUrl(result.pdfUrl);
        setPositioning(true);
      } else {
        await clearLocalDraft();
        toast({ title: successLabel, variant: "success" });
        onDone();
      }
    } catch (error) {
      toast({ title: failureLabel, description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitImportado() {
    if (!isDespacho && !assunto.trim()) {
      toast({ title: "Escreva o assunto da nota.", variant: "destructive" });
      return;
    }
    if (!ficheiro) {
      toast({ title: isDespacho ? "Seleccione o ficheiro da resposta." : "Seleccione o ficheiro da nota.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ modo: "importado", note, assunto: !isDespacho ? assunto : undefined, intent }));
      form.set("file", ficheiro);
      const response = await fetch(`/api/expedients/${expedientId}/${endpoint}`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? `Não foi possível registar ${isDespacho ? "o despacho" : "a nota"}.`);
      if (!isDespacho) {
        setDocumentId(result.documentId);
        setPdfUrl(result.pdfUrl);
        setReferencePositioning(true);
        return;
      }
      await clearLocalDraft();
      toast({ title: successLabel, variant: "success" });
      onDone();
    } catch (error) {
      toast({ title: failureLabel, description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmPosition(result: { posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition }) {
    if (!documentId) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ modo: "sistema", documentId, incluirCarimbo: applyStamp, intent, ...result }));
      const response = await fetch(`/api/expedients/${expedientId}/${endpoint}`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível posicionar o carimbo/assinatura.");
      await clearLocalDraft();
      toast({ title: successLabel, variant: "success" });
      onDone();
    } catch (error) {
      toast({ title: failureLabel, description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmReferencePosition(result: { posicaoReferencia?: FreePosition }) {
    if (!documentId) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ modo: "importado", documentId, posicaoReferencia: result.posicaoReferencia, intent }));
      const response = await fetch(`/api/expedients/${expedientId}/${endpoint}`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível posicionar a referência.");
      await clearLocalDraft();
      toast({ title: successLabel, variant: "success" });
      onDone();
    } catch (error) {
      toast({ title: failureLabel, description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (referencePositioning && pdfUrl) {
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => { if (!v) { setReferencePositioning(false); onClose(); } }}
        pdfUrl={pdfUrl}
        fallbackPdfUrl={documentId ? `/api/documents/${documentId}` : undefined}
        previewPage="first"
        reference={{ kind: "text", label: "Referencia", text: "N/Ref.: referencia oficial" }}
        onConfirm={confirmReferencePosition}
      />
    );
  }

  if (positioning && pdfUrl) {
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => { if (!v) { setPositioning(false); onClose(); } }}
        pdfUrl={pdfUrl}
        stamp={applyStamp && authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: authorization.stamp.posicaoLivre } : undefined}
        signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: authorization.signature.posicaoLivre } : undefined}
        onConfirm={confirmPosition}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="xl" className="max-h-[94vh]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{protocolo}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {localDraftRestored && (
            <Alert
              variant="success"
              title="Rascunho local recuperado"
              action={
                <Button type="button" variant="secondary" size="sm" onClick={discardRecoveredLocalDraft}>
                  Descartar
                </Button>
              }
            >
              O editor voltou à última edição guardada neste navegador
              {formatDraftTimestamp(localDraftRestored.updatedAt) ? ` em ${formatDraftTimestamp(localDraftRestored.updatedAt)}.` : "."}
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setModo("sistema")}
              className={cn(
                "flex items-center gap-3 border px-3.5 py-2.5 text-left transition-colors",
                modo === "sistema" ? "border-cfm-700 bg-cfm-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "sistema" ? "border-cfm-300 bg-white text-cfm-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                <FileEdit className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-graphite-900">Escrever no sistema</span>
                <span className="block text-xs text-graphite-500">
                  {isDespacho ? "Carimbo e assinatura aplicados automaticamente" : isCobertura ? "Sem carimbo nem assinatura da Secretaria" : "Assinatura da Secretaria aplicada automaticamente"}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setModo("importado")}
              className={cn(
                "flex items-center gap-3 border px-3.5 py-2.5 text-left transition-colors",
                modo === "importado" ? "border-cfm-700 bg-cfm-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "importado" ? "border-cfm-300 bg-white text-cfm-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                <Upload className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-graphite-900">Importar já formalizado</span>
                <span className="block text-xs text-graphite-500">Documento já carimbado e assinado fora do sistema</span>
              </span>
            </button>
          </div>

          {!isDespacho && (
            <div>
              <Label required>Assunto da nota</Label>
              <input
                type="text"
                value={assunto}
                onChange={(event) => setAssunto(event.target.value)}
                placeholder="Escreva o assunto desta nota…"
                className="mt-1 block w-full border border-graphite-300 px-3 py-1.5 text-[13px] text-graphite-800 outline-none focus:border-cfm-500"
              />
            </div>
          )}

          {modo === "sistema" && (
            <div className="space-y-3.5">
              {needsAuthorization && !authorization.loading && !readyToSign && (
                <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  {requireStamp && !authorization.stamp && "A sua unidade ainda não tem um carimbo configurado. "}
                  {!authorization.signature && "Não tem uma assinatura configurada. "}
                  Contacte a administração — não é possível escrever {isDespacho ? "despachos" : "notas"} no sistema sem {requireStamp ? "os dois" : "assinatura"}.
                </p>
              )}
              {needsAuthorization && !authorization.loading && readyToSign && !authorization.signature?.imagemUrl && (
                <p className="border border-info-200 bg-info-50 px-3 py-2 text-xs leading-relaxed text-info-800">
                  A sua assinatura ainda não tem uma imagem carregada, por isso vai ser aplicada como texto num local fixo do documento — não pode ser arrastada para uma posição específica. Peça a um administrador para carregar a imagem em Administração → Assinaturas.
                </p>
              )}
              <div>
                <Label>Modelo</Label>
                <Select value={modeloId} onValueChange={setModeloId}>
                  <SelectTrigger><SelectValue placeholder="Seleccione um modelo" /></SelectTrigger>
                  <SelectContent>
                    {activeTemplates.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label required>{isDespacho ? "Texto do despacho" : "Texto da nota"}</Label>
                <LetterEditor
                  value={conteudo}
                  onChange={setConteudo}
                  title={isDespacho ? "Despacho" : "Nota"}
                  template={template}
                  compact
                  header={{
                    subject: isDespacho ? "Despacho" : assunto,
                    reference: "gerada no protocolo",
                  }}
                />
              </div>
              {needsAuthorization && !requireStamp && authorization.stamp && (
                <label className="flex items-center gap-2 text-[13px] text-graphite-700">
                  <input type="checkbox" checked={incluirCarimbo} onChange={(event) => setIncluirCarimbo(event.target.checked)} className="size-3.5" />
                  Incluir também o carimbo da unidade (além da assinatura)
                </label>
              )}
            </div>
          )}

          {modo === "importado" && (
            <div>
              <Label required>{isDespacho ? "Ficheiro da resposta" : "Ficheiro da nota"}</Label>
              <input
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={(event) => setFicheiro(event.target.files?.[0] ?? null)}
                className="mt-1 block text-[13px] text-graphite-600 file:mr-3 file:rounded-md file:border-0 file:bg-graphite-100 file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-graphite-700 hover:file:bg-graphite-200"
              />
              {ficheiro && (
                <p className="mt-1 text-2xs text-graphite-500">Seleccionado: {ficheiro.name}</p>
              )}
            </div>
          )}

          <div>
            <Label>Observações (opcional)</Label>
            <Textarea rows={2} placeholder="Notas internas sobre este despacho…" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
        </DialogBody>
        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          {submitting && modo === "sistema" && (
            <p className="text-2xs text-graphite-400 sm:mr-auto">A gerar o documento — pode demorar alguns segundos...</p>
          )}
          {!submitting && localDraftStatusText && (
            <p className="text-2xs text-graphite-400 sm:mr-auto">{localDraftStatusText}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button
              disabled={submitting || (modo === "sistema" && (!readyToSign || authorization.loading)) || (!isDespacho && !assunto.trim())}
              loading={submitting}
              onClick={() => (modo === "sistema" ? submitSistema() : submitImportado())}
            >
              {modo === "sistema" && hasFreePositionImages ? "Continuar e posicionar" : modo === "importado" && !isDespacho ? "Continuar e posicionar referencia" : submitLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
