"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FilePlus2,
  FileStack,
  FolderOpen,
  Save,
  Send,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Stepper } from "@/components/shared/stepper";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { CatalogsProvider, useCatalogs } from "@/lib/catalogs";
import { useSession } from "@/lib/session";
import type { Confidentiality, Priority } from "@/types";
import {
  initialWizardState,
  type WizardState,
} from "@/components/expedients/wizard/types";
import { StepBasicInfo } from "@/components/expedients/wizard/step-basic-info";
import { StepDocumentOrigin } from "@/components/expedients/wizard/step-document-origin";
import { StepDocument } from "@/components/expedients/wizard/step-document";
import { StepAttachments } from "@/components/expedients/wizard/step-attachments";
import { StepStampSignature } from "@/components/expedients/wizard/step-stamp-signature";
import { StepReview } from "@/components/expedients/wizard/step-review";
import { addDaysToDate, isValidFutureOrTodayDate, todayInMaputo } from "@/lib/date-only";

const STEPS = [
  { label: "Dados", description: "Dados gerais" },
  { label: "Origem", description: "Origem do documento" },
  { label: "Documento", description: "Documento principal" },
  { label: "Anexos", description: "Documentos anexos" },
  { label: "Assinatura", description: "Carimbo e assinatura" },
  { label: "Revisão", description: "Revisão dos dados" },
  { label: "Concluir", description: "Confirmação" },
];

function canProceed(step: number, state: WizardState) {
  switch (step) {
    case 0:
      return !!(
        state.tipo &&
        state.unidadeOrigem &&
        state.remetente &&
        state.destinatario &&
        state.assunto &&
        state.prioridade &&
        state.confidencialidade &&
        state.prazo &&
        isValidFutureOrTodayDate(state.prazo)
      );
    case 1:
      return !!state.origemDocumento;
    case 2:
      if (state.origemDocumento === "sistema") return !!state.modeloId && !!state.conteudo.replace(/<[^>]*>/g, "").trim();
      if (state.origemDocumento === "importado") {
        return !!state.ficheiroNome;
      }
      return state.origemDocumento === "apenas-processo";
    default:
      return true;
  }
}

function WizardProgress({
  current,
  onStepChange,
}: {
  current: number;
  onStepChange?: (index: number) => void;
}) {
  return (
    <div className="border-b border-graphite-200 bg-graphite-50 px-4 py-3 sm:px-5 lg:px-7">
      <Stepper steps={STEPS} current={current} onStepChange={onStepChange} />
    </div>
  );
}

function NovoExpedienteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("rascunho") ?? "";
  const { toast } = useToast();
  const { user } = useSession();
  const {
    priorities,
    confidentialities,
    documentTypes,
  } = useCatalogs();
  const [step, setStep] = React.useState(0);
  const [state, setState] = React.useState<WizardState>(initialWizardState);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<null | { id: string; protocolo: string; rascunho: boolean }>(null);
  const [saving, setSaving] = React.useState(false);
  const [draftLoading, setDraftLoading] = React.useState(Boolean(draftId));
  const [effectiveDraftId, setEffectiveDraftId] = React.useState(draftId);
  const [defaultDeadlineDays, setDefaultDeadlineDays] = React.useState<number | null>(null);
  const [workflows, setWorkflows] = React.useState<Array<{ id: string; estado: string; etapas: { prazoDias: number }[] }>>([]);
  const autoFilledPrazo = React.useRef<string | null>(null);
  const defaultsApplied = React.useRef(false);

  const createInitialState = React.useCallback((): WizardState => {
    const priority =
      priorities.find((item) => item.active && item.isDefault) ??
      priorities.find((item) => item.active);
    const confidentiality =
      confidentialities.find((item) => item.active && item.isDefault) ??
      confidentialities.find((item) => item.active);

    return {
      ...initialWizardState,
      remetente: user.nome,
      unidadeOrigem: user.unidadeId,
      prioridade: (priority?.code ?? "") as Priority | "",
      confidencialidade: (confidentiality?.code ?? "") as Confidentiality | "",
    };
  }, [confidentialities, priorities, user.nome, user.unidadeId]);

  React.useEffect(() => {
    if (defaultsApplied.current) return;
    defaultsApplied.current = true;
    setState((current) => {
      const defaults = createInitialState();
      return {
        ...current,
        remetente: current.remetente || defaults.remetente,
        unidadeOrigem: defaults.unidadeOrigem,
        prioridade: current.prioridade || defaults.prioridade,
        confidencialidade: current.confidencialidade || defaults.confidencialidade,
      };
    });
  }, [createInitialState]);

  React.useEffect(() => {
    if (draftId) return;
    let cancelled = false;
    void Promise.all([
      fetch("/api/admin/settings/general-configuration", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { value: null })),
      fetch("/api/admin/settings/workflows-ui", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { value: null })),
    ]).then(([configResult, workflowsResult]) => {
      if (cancelled) return;
      const days = Number((configResult.value as { defaultDeadlineDays?: string } | null)?.defaultDeadlineDays);
      if (Number.isFinite(days) && days > 0) setDefaultDeadlineDays(days);
      if (Array.isArray(workflowsResult.value)) setWorkflows(workflowsResult.value);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [draftId]);

  /**
   * Sugere um prazo: o SLA do fluxo publicado associado ao tipo de documento
   * escolhido (soma dos prazos das suas etapas), com o prazo por omissão das
   * Configurações Gerais como recurso. Só actualiza o campo enquanto o
   * utilizador não o tiver editado manualmente (a partir daí, deixa de mexer).
   */
  React.useEffect(() => {
    if (draftId) return;
    const documentType = documentTypes.find((item) => item.id === state.tipo);
    const workflow = documentType?.workflowId ? workflows.find((item) => item.id === documentType.workflowId && item.estado === "publicado") : undefined;
    const workflowDays = workflow?.etapas.reduce((total, step) => total + (Number(step.prazoDias) || 0), 0);
    const days = workflowDays && workflowDays > 0 ? workflowDays : defaultDeadlineDays;
    if (!days) return;
    const suggested = addDaysToDate(todayInMaputo(), days);
    setState((current) => {
      if (current.prazo && current.prazo !== autoFilledPrazo.current) return current;
      autoFilledPrazo.current = suggested;
      return { ...current, prazo: suggested };
    });
  }, [draftId, state.tipo, documentTypes, workflows, defaultDeadlineDays]);

  React.useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    setDraftLoading(true);
    void fetch(`/api/expedients/${draftId}/draft`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Nao foi possivel abrir o rascunho.");
        if (!cancelled) setState({ ...initialWizardState, ...result.draft });
      })
      .catch((error) => {
        toast({ title: "Rascunho indisponivel", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
        router.replace("/expedientes/meus");
      })
      .finally(() => { if (!cancelled) setDraftLoading(false); });
    return () => { cancelled = true; };
  }, [draftId, router, toast]);

  function update(patch: Partial<WizardState>) {
    setState((previous) => ({ ...previous, ...patch }));
  }

  async function persist(rascunho: boolean) {
    setSaving(true);
    try {
      const form = new FormData();
      const { ficheiro, anexos, ...fields } = state;
      form.set("data", JSON.stringify({ ...fields, rascunho, anexos: anexos.map(({ ficheiro: _file, ...meta }) => meta) }));
      if (ficheiro) form.set("mainFile", ficheiro);
      anexos.forEach((anexo) => { if (anexo.ficheiro) form.append("attachments", anexo.ficheiro); });
      const response = await fetch(effectiveDraftId ? `/api/expedients/${effectiveDraftId}/draft` : "/api/expedients", { method: effectiveDraftId ? "PUT" : "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível guardar o expediente.");
      if (!effectiveDraftId) setEffectiveDraftId(result.id);
      toast({ title: rascunho ? "Rascunho guardado" : "Expediente submetido", variant: "success" });
      setSubmitted({ id: result.id, protocolo: result.protocolo, rascunho });
      setStep(6);
    } catch (error) {
      toast({ title: "Expediente não guardado", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Guarda silenciosamente um rascunho (sem navegar nem mostrar "submetido") só para
   * obter um PDF real do documento actual, usado pelo posicionador de carimbo/assinatura.
   */
  async function ensurePreview(): Promise<{ pdfUrl: string | null } | null> {
    try {
      const form = new FormData();
      const { ficheiro, anexos, ...fields } = state;
      form.set("data", JSON.stringify({ ...fields, rascunho: true, anexos: anexos.map(({ ficheiro: _file, ...meta }) => meta) }));
      if (ficheiro) form.set("mainFile", ficheiro);
      anexos.forEach((anexo) => { if (anexo.ficheiro) form.append("attachments", anexo.ficheiro); });
      const response = await fetch(effectiveDraftId ? `/api/expedients/${effectiveDraftId}/draft` : "/api/expedients", { method: effectiveDraftId ? "PUT" : "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível guardar o rascunho.");
      if (!effectiveDraftId) setEffectiveDraftId(result.id);
      return { pdfUrl: result.pdfUrl ?? null };
    } catch (error) {
      toast({ title: "Não foi possível pré-visualizar", description: error instanceof Error ? error.message : "Erro inesperado.", variant: "destructive" });
      return null;
    }
  }

  if (draftLoading) {
    return <div className="flex min-h-[520px] items-center justify-center text-sm text-graphite-500">A abrir o rascunho…</div>;
  }

  if (submitted) {
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader
          title={draftId ? "Rascunho actualizado" : "Novo expediente"}
          breadcrumb={[{ label: "Expediente" }, { label: draftId ? "Editar rascunho" : "Novo expediente" }]}
        />

        <div className="mx-auto flex w-full max-w-[1600px] flex-1 px-3 py-3 sm:px-4 lg:px-5 lg:py-4 2xl:px-6">
          <section className="flex min-h-[520px] w-full flex-col border border-graphite-300 bg-white">
            <WizardProgress current={6} />

            <div className="flex flex-1 items-center justify-center px-5 py-10">
              <div className="w-full max-w-xl text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center border border-navy-200 bg-navy-50 text-navy-800">
                  <CheckCircle2 className="size-6" />
                </div>
                <h2 className="text-lg font-semibold text-graphite-900">
                  {submitted.rascunho ? "Rascunho guardado" : "Expediente submetido"}
                </h2>
                <p className="mt-1.5 text-[13px] text-graphite-500">
                  {submitted.rascunho
                    ? "Pode continuar a edição em Meus expedientes."
                    : "O processo foi encaminhado para recepção e protocolo."}
                </p>
                <div className="mx-auto mt-5 inline-flex items-center gap-2 border border-graphite-200 bg-graphite-50 px-4 py-2.5">
                  <FileStack className="size-4 text-graphite-500" />
                  <span className="text-[13px] font-semibold tabular-nums text-graphite-800">
                    {submitted.protocolo}
                  </span>
                </div>
                <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (draftId) {
                        router.push("/expedientes/novo");
                        return;
                      }
                      setState(createInitialState());
                      setSubmitted(null);
                      setStep(0);
                    }}
                  >
                    <FilePlus2 className="size-3.5" />
                    Criar outro
                  </Button>
                  <Button asChild>
                    <Link href="/expedientes/meus">
                      <FolderOpen className="size-3.5" />
                      Meus expedientes
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
          title={draftId ? "Editar rascunho" : "Novo expediente"}
          breadcrumb={[{ label: "Expediente" }, { label: draftId ? "Editar rascunho" : "Novo expediente" }]}
        actions={
          <Button variant="toolbar" size="sm" onClick={() => setCancelOpen(true)}>
            <X className="size-3.5" />
            Cancelar
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 px-3 py-3 sm:px-4 lg:px-5 lg:py-4 2xl:px-6">
        <section className="flex min-h-[520px] w-full flex-col border border-graphite-300 bg-white">
          <WizardProgress current={step} onStepChange={setStep} />

          <div className="flex-1 px-5 py-5 sm:px-6 lg:px-8 lg:py-6 xl:px-10">
            {step === 0 && <StepBasicInfo state={state} update={update} />}
            {step === 1 && <StepDocumentOrigin state={state} update={update} />}
            {step === 2 && <StepDocument state={state} update={update} />}
            {step === 3 && <StepAttachments state={state} update={update} />}
            {step === 4 && <StepStampSignature state={state} update={update} ensurePreview={ensurePreview} />}
            {step === 5 && <StepReview state={state} update={update} />}
          </div>

          <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-graphite-200 bg-white/95 px-5 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <Button
              variant="secondary"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <ArrowLeft className="size-3.5" />
              Anterior
            </Button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {effectiveDraftId && step < 5 && (
                <Button variant="secondary" onClick={() => persist(true)} loading={saving} disabled={saving || !isValidFutureOrTodayDate(state.prazo)}>
                  <Save className="size-3.5" />
                  Guardar alterações
                </Button>
              )}
              {step === 5 ? (
                <>
                  <Button variant="secondary" onClick={() => persist(true)} loading={saving} disabled={saving}>
                    <Save className="size-3.5" />
                    Guardar rascunho
                  </Button>
                  <Button onClick={() => persist(false)} loading={saving} disabled={saving}>
                    <Send className="size-3.5" />
                    Submeter expediente
                  </Button>
                </>
              ) : (
                <Button
                  disabled={!canProceed(step, state)}
                  onClick={() => setStep((current) => Math.min(5, current + 1))}
                >
                  Seguinte
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
          </footer>
        </section>
      </div>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar novo expediente"
        description="Os dados não guardados serão perdidos."
        confirmLabel="Cancelar expediente"
        destructive
        onConfirm={() => router.push(draftId ? `/expedientes/${draftId}` : "/expedientes")}
      />
    </div>
  );
}

export default function NovoExpedientePage() {
  return <CatalogsProvider><NovoExpedienteContent /></CatalogsProvider>;
}
