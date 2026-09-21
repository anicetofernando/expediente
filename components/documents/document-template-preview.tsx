"use client";

import type { DocumentTemplate } from "@/types";

function displayLines(value?: string) {
  const lines = value?.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) ?? [];
  return lines.length ? lines : ["DIRECCAO EXECUTIVA CENTRO", "Departamento XXXXXXXX"];
}

function stripRecipientLine(value?: string) {
  return (value ?? "")
    .replace(/^\s*Exmo\.?\s*Senhor[:,]?\s*/i, "")
    .trim();
}

export function DocumentTemplatePreview({ template }: { template: DocumentTemplate | null }) {
  const headerLines = displayLines(template?.cabecalho);
  const bodyText = stripRecipientLine(template?.conteudoInicial);
  const bodyLines = bodyText ? bodyText.split(/\r?\n/).filter((line) => line.trim()).slice(0, 4) : [];

  return (
    <div className="flex justify-center rounded-lg bg-graphite-50 p-6">
      <div className="flex aspect-[210/297] w-full max-w-sm flex-col border border-graphite-300 bg-white px-8 py-7 text-graphite-900 shadow-card">
        {template?.logotipo && template.logotipoPosicao === "cabecalho" && (
          <img src={template.logotipo} alt="Logotipo do modelo" className="mx-auto mb-2 max-h-14 w-full max-w-52 object-contain" />
        )}

        {(!template?.logotipo || template.logotipoPosicao !== "cabecalho") && (
          <p className="mb-3 whitespace-pre-line text-center text-[10px] font-semibold uppercase leading-tight text-cfm-900">
            {template?.cabecalho ?? "CFM - Portos e Caminhos de Ferro de Mocambique"}
          </p>
        )}

        <div className="text-center text-[10px] font-semibold uppercase leading-tight text-success-700">
          {headerLines.slice(0, 2).map((line) => <p key={line}>{line}</p>)}
        </div>

        <div className="mt-3 grid min-h-20 grid-cols-[1.05fr_.95fr] border border-graphite-700 text-[10px] leading-tight">
          <div className="border-r border-graphite-700 p-2.5 text-left">
            <p className="font-semibold uppercase">EXMO. SENHOR:</p>
            <p className="mt-2 font-semibold uppercase">CHEFE DO STF</p>
            <p className="mt-1 uppercase">CFM-Centro</p>
            <p className="mt-1 uppercase">BEIRA</p>
          </div>
          <div className="p-2.5 text-center font-semibold underline">Despacho</div>
        </div>

        <div className="mt-2 flex justify-between gap-3 text-[10px] text-graphite-700">
          <span>N/Ref.: 0220/DEP-/CFM-C/2025</span>
          <span>Data: 14.09.2025</span>
        </div>
        <p className="mt-1 text-[10px]">
          <strong className="underline">Assunto:</strong> <span className="font-semibold underline">{template?.nome ?? "Modelo institucional"}</span>
        </p>

        <div className="mt-6 space-y-2 text-[10px] leading-relaxed text-graphite-700">
          {bodyLines.length ? bodyLines.map((line) => <p key={line}>{line}</p>) : [84, 96, 78, 90].map((width) => (
            <div key={width} className="h-1.5 rounded bg-graphite-100" style={{ width: `${width}%` }} />
          ))}
        </div>

        <div className="mt-auto border-t border-graphite-200 pt-3 text-center text-[8px] text-graphite-500">
          {template?.logotipo && template.logotipoPosicao === "rodape" && (
            <img src={template.logotipo} alt="Logotipo do modelo" className="mx-auto mb-1 max-h-9 max-w-24 object-contain" />
          )}
          <p className="whitespace-pre-line">{template?.rodape ?? "Correspondencia institucional"}</p>
        </div>
      </div>
    </div>
  );
}
