"use client";

import { UploadCloud, FileText, CheckCircle2, FolderOpen, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCatalogs } from "@/lib/catalogs";
import type { StepProps } from "./types";
import { LetterEditor } from "@/components/documents/letter-editor";

export function StepDocument({ state, update }: StepProps) {
  const { documentTemplates } = useCatalogs();

  if (state.origemDocumento === "sistema") {
    const template = documentTemplates.find((t) => t.id === state.modeloId);
    const initialHtml = (text: string) => text
      .split(/\r?\n/)
      .map((line) => `<p>${line.replace(/[&<>]/g, (value) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[value] ?? value) || "<br>"}</p>`)
      .join("");
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <Label required>Modelo de documento</Label>
          <Select value={state.modeloId} onValueChange={(v) => {
            const next = documentTemplates.find((item) => item.id === v);
            update({ modeloId: v, ...(!state.conteudo && next?.conteudoInicial ? { conteudo: initialHtml(next.conteudoInicial) } : {}) });
          }}>
            <SelectTrigger><SelectValue placeholder="Seleccione um modelo" /></SelectTrigger>
            <SelectContent>
              {documentTemplates.filter((t) => t.estado === "activo").map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {template && <p className="mt-1.5 text-2xs text-graphite-500">{template.descricao} · {template.camposCount} campos</p>}

          <div className="mt-3.5">
            <Label required>Conteúdo da carta</Label>
            <LetterEditor value={state.conteudo} onChange={(conteudo) => update({ conteudo })} title={template?.nome} template={template} />
          </div>
        </section>

        <section className="lg:col-span-5 lg:sticky lg:top-4 lg:self-start">
          <Label>Pré-visualização</Label>
          <div className="h-[78vh] min-h-[720px] max-h-[920px] overflow-y-auto border border-graphite-300 bg-graphite-50 p-3">
            <div className="mx-auto min-h-[680px] max-w-[520px] border border-graphite-200 bg-white px-9 py-10 text-2xs">
              {template?.logotipo && template.logotipoPosicao === "cabecalho" && <img src={template.logotipo} alt="Logótipo" className="mx-auto mb-3 max-h-16 max-w-36 object-contain" />}
              <p className="whitespace-pre-line text-center text-[11px] font-semibold uppercase tracking-wide text-navy-800">{template?.cabecalho ?? "CFM — Portos e Caminhos de Ferro de Moçambique"}</p>
              <p className="mt-1 text-center text-2xs text-graphite-400">{template?.nome ?? "Modelo de documento"}</p>
              {state.conteudo ? <div className="mt-6 text-[11px] leading-relaxed text-graphite-700" dangerouslySetInnerHTML={{ __html: state.conteudo }} /> : <div className="mt-6 text-[11px] text-graphite-400">O conteúdo do documento será apresentado nesta área.</div>}
              <div className="mt-10 border-t border-graphite-200 pt-3 text-center text-[9px] text-graphite-500">
                {template?.logotipo && template.logotipoPosicao === "rodape" && <img src={template.logotipo} alt="Logótipo" className="mx-auto mb-2 max-h-12 max-w-28 object-contain" />}
                <p className="whitespace-pre-line">{template?.rodape ?? "Correspondência institucional"}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (state.origemDocumento === "importado") {
    return (
      <div className="w-full">
        {!state.ficheiroNome ? (
          <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center gap-2.5 border border-dashed border-graphite-400 bg-graphite-50 px-6 py-10 text-center transition-colors hover:border-navy-600 hover:bg-navy-50/40 focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-navy-500">
            <span className="flex size-10 items-center justify-center border border-graphite-300 bg-white text-navy-700">
              <UploadCloud className="size-5" />
            </span>
            <span className="text-[13px] font-medium text-graphite-700">Clique para carregar ou arraste o ficheiro</span>
            <span className="text-xs text-graphite-500">PDF, DOCX, JPG ou PNG · máximo 20 MB</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) update({ ficheiro: file, ficheiroNome: file.name, numPaginas: Math.max(1, Math.round(file.size / 90000)) });
              }}
            />
          </label>
        ) : (
          <div className="border border-graphite-200">
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_140px] items-center gap-3 border-b border-graphite-200 bg-graphite-50 px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-graphite-500 sm:grid">
              <span>Documento</span>
              <span>Estado</span>
              <span className="text-right">Acção</span>
            </div>
            <div className="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_110px_140px] sm:items-center">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center border border-graphite-200 bg-graphite-50 text-navy-700"><FileText className="size-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-graphite-900">{state.ficheiroNome}</p>
                  <p className="text-2xs text-graphite-500">{state.numPaginas} página(s)</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-graphite-600">
                <CheckCircle2 className="size-3.5 text-navy-700" /> Validado
              </span>
              <Button variant="secondary" size="sm" className="justify-self-start sm:justify-self-end" onClick={() => update({ ficheiro: undefined, ficheiroNome: "", numPaginas: 0 })}>
                <RefreshCw className="size-3.5" /> Substituir
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-40 items-center justify-center gap-3 border border-graphite-300 bg-graphite-50 px-6 py-10 text-center">
      <span className="flex size-10 shrink-0 items-center justify-center border border-graphite-300 bg-white text-graphite-500">
        <FolderOpen className="size-5" />
      </span>
      <div className="text-left">
        <p className="text-[13px] font-medium text-graphite-800">Processo sem documento principal</p>
        <p className="mt-0.5 text-xs text-graphite-500">O documento poderá ser anexado após a submissão.</p>
      </div>
    </div>
  );
}
