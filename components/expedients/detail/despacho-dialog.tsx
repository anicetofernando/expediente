"use client";

import * as React from "react";
import { FileEdit, Upload } from "lucide-react";
import type { FreePosition, Signature, Stamp } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LetterEditor } from "@/components/documents/letter-editor";
import { StampPositionPicker } from "@/components/documents/stamp-position-picker";
import { useCatalogs } from "@/lib/catalogs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function DespachoDialog({
  expedientId,
  protocolo,
  onClose,
  onDone,
}: {
  expedientId: string;
  protocolo: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const { documentTemplates } = useCatalogs();
  const [modo, setModo] = React.useState<"sistema" | "importado">("sistema");
  const [modeloId, setModeloId] = React.useState("");
  const [conteudo, setConteudo] = React.useState("");
  const [ficheiro, setFicheiro] = React.useState<File | null>(null);
  const [note, setNote] = React.useState("");
  const [authorization, setAuthorization] = React.useState<{ stamp: Stamp | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: true });
  const [documentId, setDocumentId] = React.useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [positioning, setPositioning] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void fetch("/api/document-authorizations", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, []);

  const template = documentTemplates.find((item) => item.id === modeloId);
  const activeTemplates = documentTemplates.filter((item) => item.estado === "activo");
  const readyToSign = Boolean(authorization.stamp && authorization.signature);
  const hasFreePositionImages = Boolean(authorization.stamp?.imagemUrl || authorization.signature?.imagemUrl);

  async function submitSistema() {
    if (!conteudo.replace(/<[^>]*>/g, "").trim()) {
      toast({ title: "Escreva o conteúdo do despacho.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ modo: "sistema", modeloId, conteudo, note }));
      const response = await fetch(`/api/expedients/${expedientId}/resposta`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível registar o despacho.");
      if (hasFreePositionImages) {
        setDocumentId(result.documentId);
        setPdfUrl(result.pdfUrl);
        setPositioning(true);
      } else {
        toast({ title: "Despacho registado", variant: "success" });
        onDone();
      }
    } catch (error) {
      toast({ title: "Despacho não registado", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitImportado() {
    if (!ficheiro) {
      toast({ title: "Seleccione o ficheiro da resposta.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ modo: "importado", note }));
      form.set("file", ficheiro);
      const response = await fetch(`/api/expedients/${expedientId}/resposta`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível registar o despacho.");
      toast({ title: "Despacho registado", variant: "success" });
      onDone();
    } catch (error) {
      toast({ title: "Despacho não registado", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmPosition(result: { posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition }) {
    if (!documentId) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("data", JSON.stringify({ modo: "sistema", documentId, ...result }));
      const response = await fetch(`/api/expedients/${expedientId}/resposta`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível posicionar o carimbo/assinatura.");
      toast({ title: "Despacho registado", variant: "success" });
      onDone();
    } catch (error) {
      toast({ title: "Despacho não registado", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (positioning && pdfUrl) {
    return (
      <StampPositionPicker
        open
        onOpenChange={(v) => { if (!v) { setPositioning(false); onClose(); } }}
        pdfUrl={pdfUrl}
        stamp={authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: authorization.stamp.posicaoLivre } : undefined}
        signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: authorization.signature.posicaoLivre } : undefined}
        onConfirm={confirmPosition}
      />
    );
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Criar despacho / resposta</DialogTitle>
          <DialogDescription>{protocolo}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setModo("sistema")}
              className={cn(
                "flex items-center gap-3 border px-3.5 py-2.5 text-left transition-colors",
                modo === "sistema" ? "border-navy-700 bg-navy-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "sistema" ? "border-navy-300 bg-white text-navy-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                <FileEdit className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-graphite-900">Escrever no sistema</span>
                <span className="block text-xs text-graphite-500">Carimbo e assinatura aplicados automaticamente</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setModo("importado")}
              className={cn(
                "flex items-center gap-3 border px-3.5 py-2.5 text-left transition-colors",
                modo === "importado" ? "border-navy-700 bg-navy-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50",
              )}
            >
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", modo === "importado" ? "border-navy-300 bg-white text-navy-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                <Upload className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-medium text-graphite-900">Importar já formalizado</span>
                <span className="block text-xs text-graphite-500">Documento já carimbado e assinado fora do sistema</span>
              </span>
            </button>
          </div>

          {modo === "sistema" && (
            <div className="space-y-3.5">
              {!authorization.loading && !readyToSign && (
                <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  {!authorization.stamp && "A sua unidade ainda não tem um carimbo configurado. "}
                  {!authorization.signature && "Não tem uma assinatura configurada. "}
                  Contacte a administração — não é possível escrever despachos no sistema sem os dois.
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
                <Label required>Texto do despacho</Label>
                <LetterEditor value={conteudo} onChange={setConteudo} title="Despacho" template={template} />
              </div>
            </div>
          )}

          {modo === "importado" && (
            <div>
              <Label required>Ficheiro da resposta</Label>
              <input
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={(event) => setFicheiro(event.target.files?.[0] ?? null)}
                className="mt-1 block text-[13px] text-graphite-600 file:mr-3 file:rounded-md file:border-0 file:bg-graphite-100 file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-graphite-700 hover:file:bg-graphite-200"
              />
            </div>
          )}

          <div>
            <Label>Observações (opcional)</Label>
            <Textarea rows={2} placeholder="Notas internas sobre este despacho…" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={submitting || (modo === "sistema" && (!readyToSign || authorization.loading))}
            loading={submitting}
            onClick={() => (modo === "sistema" ? submitSistema() : submitImportado())}
          >
            {modo === "sistema" && hasFreePositionImages ? "Continuar e posicionar" : "Registar despacho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
