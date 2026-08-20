"use client";

import * as React from "react";
import { PenTool } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { StampPositionPicker } from "@/components/documents/stamp-position-picker";
import type { FreePosition, Signature, Stamp } from "@/types";
import type { StepProps } from "./types";

export function StepStampSignature({
  state,
  update,
  ensurePreview,
}: StepProps & { ensurePreview: () => Promise<{ pdfUrl: string | null } | null> }) {
  const [authorization, setAuthorization] = React.useState<{ stamp: Stamp | null; signature: Signature | null; loading: boolean }>({ stamp: null, signature: null, loading: true });
  const [positioning, setPositioning] = React.useState(false);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [preparing, setPreparing] = React.useState(false);

  React.useEffect(() => {
    if (state.origemDocumento !== "sistema" || !state.unidadeOrigem) return;
    let cancelled = false;
    setAuthorization((current) => ({ ...current, loading: true }));
    void fetch(`/api/document-authorizations?unidadeId=${state.unidadeOrigem}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setAuthorization({ stamp: data.stamp ?? null, signature: data.signature ?? null, loading: false }); })
      .catch(() => { if (!cancelled) setAuthorization({ stamp: null, signature: null, loading: false }); });
    return () => { cancelled = true; };
  }, [state.origemDocumento, state.unidadeOrigem]);

  if (state.origemDocumento !== "sistema") {
    return (
      <div className="rounded-lg border border-graphite-200 bg-graphite-50 px-4 py-6 text-center text-[13px] text-graphite-600">
        Este documento já vem formalizado fora do sistema — não é necessário aplicar carimbo nem assinatura aqui.
      </div>
    );
  }

  const readyToSign = Boolean(authorization.stamp && authorization.signature);
  const hasFreePositionImages = Boolean(authorization.stamp?.imagemUrl || authorization.signature?.imagemUrl);
  const hasPosition = Boolean(state.posicaoCarimbo || state.posicaoAssinatura);

  async function openPositioning() {
    setPreparing(true);
    const result = await ensurePreview();
    setPreparing(false);
    if (!result?.pdfUrl) return;
    setPdfUrl(result.pdfUrl);
    setPositioning(true);
  }

  function confirmPosition(result: { posicaoCarimbo?: FreePosition; posicaoAssinatura?: FreePosition }) {
    update({ posicaoCarimbo: result.posicaoCarimbo, posicaoAssinatura: result.posicaoAssinatura });
    setPositioning(false);
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 border border-graphite-200 bg-white px-3.5 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center border border-graphite-200 bg-graphite-50 text-navy-700">
          <PenTool className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-graphite-800">Usar carimbo e assinatura</span>
          <span className="block text-xs text-graphite-500">
            {authorization.loading
              ? "A verificar o carimbo e a assinatura da sua unidade…"
              : readyToSign
                ? `Carimbo de ${authorization.stamp?.unidade} + assinatura de ${authorization.signature?.proprietario}`
                : "Indisponível — veja o aviso abaixo"}
          </span>
        </span>
        <Switch
          checked={state.usarCarimboAssinatura}
          onCheckedChange={(value) => update({ usarCarimboAssinatura: value, posicaoCarimbo: undefined, posicaoAssinatura: undefined })}
          disabled={!readyToSign || authorization.loading}
        />
      </label>

      {!authorization.loading && !readyToSign && (
        <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          {!authorization.stamp && "Esta unidade ainda não tem um carimbo configurado. "}
          {!authorization.signature && "Não tem uma assinatura configurada. "}
          Contacte a administração — não é possível submeter apenas com um dos dois.
        </p>
      )}

      {state.usarCarimboAssinatura && hasFreePositionImages && (
        <div className="border border-graphite-200 bg-graphite-50 px-3.5 py-3">
          <p className="text-[13px] text-graphite-700">
            {hasPosition ? "Posição definida." : "Escolha onde o carimbo e a assinatura devem aparecer no documento."}
          </p>
          <Button type="button" variant="secondary" className="mt-2" loading={preparing} onClick={openPositioning}>
            {hasPosition ? "Ajustar posição" : "Posicionar carimbo e assinatura"}
          </Button>
        </div>
      )}

      {positioning && pdfUrl && (
        <StampPositionPicker
          open
          onOpenChange={(v) => !v && setPositioning(false)}
          pdfUrl={pdfUrl}
          stamp={authorization.stamp?.imagemUrl ? { imageUrl: authorization.stamp.imagemUrl, label: authorization.stamp.nome, initialPosition: state.posicaoCarimbo ?? authorization.stamp.posicaoLivre } : undefined}
          signature={authorization.signature?.imagemUrl ? { imageUrl: authorization.signature.imagemUrl, label: authorization.signature.proprietario, initialPosition: state.posicaoAssinatura ?? authorization.signature.posicaoLivre } : undefined}
          onConfirm={confirmPosition}
        />
      )}
    </div>
  );
}
