"use client";

import { UploadCloud, ScanLine, FileText, CheckCircle2, FolderOpen, RefreshCw } from "lucide-react";
import { Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCatalogs } from "@/lib/catalogs";
import type { StepProps } from "./types";

export function StepDocument({ state, update }: StepProps) {
  const { documentTemplates } = useCatalogs();

  if (state.origemDocumento === "sistema") {
    const template = documentTemplates.find((t) => t.id === state.modeloId);
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <Label required>Modelo de documento</Label>
          <Select value={state.modeloId} onValueChange={(v) => update({ modeloId: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccione um modelo" /></SelectTrigger>
            <SelectContent>
              {documentTemplates.filter((t) => t.estado === "activo").map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {template && <p className="mt-1.5 text-2xs text-graphite-500">{template.descricao} · {template.camposCount} campos</p>}

          <div className="mt-3.5">
            <Label>Conteúdo do documento</Label>
            <Textarea
              className="min-h-[360px] resize-y"
              placeholder="Escreva ou edite o conteúdo do documento…"
              value={state.conteudo}
              onChange={(e) => update({ conteudo: e.target.value })}
            />
          </div>
        </section>

        <section className="lg:col-span-5">
          <Label>Pré-visualização</Label>
          <div className="h-[392px] overflow-y-auto border border-graphite-300 bg-graphite-50 p-3">
            <div className="mx-auto min-h-full max-w-[390px] border border-graphite-200 bg-white px-7 py-6 text-2xs">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-navy-800">CFM — Portos e Caminhos de Ferro de Moçambique</p>
              <p className="mt-1 text-center text-2xs text-graphite-400">{template?.nome ?? "Modelo de documento"}</p>
              <div className="mt-6 whitespace-pre-wrap text-[11px] leading-relaxed text-graphite-700">
                {state.conteudo || "O conteúdo do documento será apresentado nesta área."}
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
                if (file) update({ ficheiroNome: file.name, numPaginas: Math.max(1, Math.round(file.size / 90000)) });
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
              <Button variant="secondary" size="sm" className="justify-self-start sm:justify-self-end" onClick={() => update({ ficheiroNome: "", numPaginas: 0 })}>
                <RefreshCw className="size-3.5" /> Substituir
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state.origemDocumento === "digitalizado") {
    return (
      <div className="w-full">
        {!state.ficheiroNome ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-2.5 border border-graphite-300 bg-graphite-50 px-6 py-10 text-center">
            <span className="flex size-10 items-center justify-center border border-graphite-300 bg-white text-navy-700">
              <ScanLine className="size-5" />
            </span>
            <p className="text-[13px] font-medium text-graphite-800">Digitalizador disponível</p>
            <p className="text-xs text-graphite-500">Coloque o documento no equipamento e inicie a captura.</p>
            <Button variant="secondary" onClick={() => update({ ficheiroNome: "Digitalização_" + new Date().toISOString().slice(0, 10) + ".pdf", numPaginas: 2 })}>
              <ScanLine className="size-3.5" /> Iniciar digitalização
            </Button>
          </div>
        ) : (
          <div className="border border-graphite-200">
            <div className="hidden grid-cols-[minmax(0,1fr)_130px_180px] items-center gap-3 border-b border-graphite-200 bg-graphite-50 px-3 py-2 text-2xs font-semibold uppercase tracking-wide text-graphite-500 sm:grid">
              <span>Documento</span>
              <span>Estado</span>
              <span className="text-right">Acção</span>
            </div>
            <div className="grid grid-cols-1 gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_130px_180px] sm:items-center">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center border border-graphite-200 bg-graphite-50 text-navy-700"><FileText className="size-4" /></span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-graphite-900">{state.ficheiroNome}</p>
                  <p className="text-2xs text-graphite-500">{state.numPaginas} página(s)</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-graphite-600">
                <CheckCircle2 className="size-3.5 text-navy-700" /> Concluído
              </span>
              <Button variant="secondary" size="sm" className="justify-self-start sm:justify-self-end" onClick={() => update({ ficheiroNome: "", numPaginas: 0 })}>
                <RefreshCw className="size-3.5" /> Digitalizar novamente
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
