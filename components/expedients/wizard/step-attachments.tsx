"use client";

import { Paperclip, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalogs } from "@/lib/catalogs";
import type { Confidentiality } from "@/types";
import type { StepProps, WizardAttachment } from "./types";

export function StepAttachments({ state, update }: StepProps) {
  const { confidentialities } = useCatalogs();
  const availableConfidentialities = [...confidentialities]
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order);
  const defaultConfidentiality =
    availableConfidentialities.find((item) => item.isDefault) ??
    availableConfidentialities[0];

  function addFiles(files: FileList | null) {
    if (!files) return;
    const novos: WizardAttachment[] = Array.from(files).map((f) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: f.name,
      tamanho: `${(f.size / 1024).toFixed(0)} KB`,
      descricao: "",
      confidencialidade: (defaultConfidentiality?.code ?? "") as Confidentiality | "",
      ficheiro: f,
    }));
    update({ anexos: [...state.anexos, ...novos] });
  }

  function updateAnexo(id: string, patch: Partial<WizardAttachment>) {
    update({ anexos: state.anexos.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  }

  function removeAnexo(id: string) {
    update({ anexos: state.anexos.filter((a) => a.id !== id) });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-graphite-500">{state.anexos.length} anexo(s)</span>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <label className="cursor-pointer">
              <Paperclip className="size-3.5" /> Adicionar ficheiros
              <input type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </label>
          </Button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto border border-graphite-200">
        <table className="w-full min-w-[760px] table-fixed text-left text-[13px]">
          <colgroup>
            <col className="w-14" />
            <col className="w-[26%]" />
            <col />
            <col className="w-44" />
            <col className="w-14" />
          </colgroup>
          <thead className="border-b border-graphite-200 bg-graphite-50 text-2xs font-semibold uppercase tracking-wide text-graphite-500">
            <tr>
              <th className="px-3 py-2 text-center">#</th>
              <th className="px-3 py-2">Ficheiro</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2">Confidencialidade</th>
              <th className="px-3 py-2 text-center">Acção</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-graphite-150">
            {state.anexos.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-28 px-4 text-center text-graphite-500">
                  <span className="inline-flex items-center gap-2">
                    <Paperclip className="size-4 text-graphite-400" /> Sem anexos
                  </span>
                </td>
              </tr>
            ) : (
              state.anexos.map((a, i) => (
                <tr key={a.id} className="bg-white">
                  <td className="px-3 py-2 text-center text-xs tabular-nums text-graphite-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center border border-graphite-200 bg-graphite-50 text-navy-700"><FileText className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-graphite-900">{a.nome}</p>
                        <p className="text-2xs text-graphite-500">{a.tamanho}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      aria-label={`Descrição de ${a.nome}`}
                      placeholder="Descrição opcional"
                      value={a.descricao}
                      onChange={(e) => updateAnexo(a.id, { descricao: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={a.confidencialidade} onValueChange={(v) => updateAnexo(a.id, { confidencialidade: v as Confidentiality })}>
                      <SelectTrigger aria-label={`Confidencialidade de ${a.nome}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableConfidentialities.map((item) => (
                          <SelectItem key={item.id} value={item.code}>{item.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-graphite-500 hover:text-crimson-700"
                      onClick={() => removeAnexo(a.id)}
                      aria-label={`Remover ${a.nome}`}
                      title="Remover anexo"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
