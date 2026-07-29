"use client";

import { Ban, Wand2, MousePointerClick, Check, PenTool, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCatalogs } from "@/lib/catalogs";
import type { StepProps, StampChoice } from "./types";

const STAMP_CHOICE_ICONS: Record<StampChoice, typeof Ban> = {
  nao: Ban,
  automatico: Wand2,
  escolher: MousePointerClick,
};

export function StepStampSignature({ state, update }: StepProps) {
  const { stamps, stampChoices } = useCatalogs();
  const selected = stamps.find((s) => s.id === state.carimboId);
  const options = [...stampChoices]
    .filter((item) => item.active && item.code in STAMP_CHOICE_ICONS)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-xs font-semibold text-graphite-700">Carimbo</legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {options.map((option) => {
            const value = option.code as StampChoice;
            const Icon = STAMP_CHOICE_ICONS[value];
            const active = state.carimbo === value;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => update({ carimbo: value })}
                aria-pressed={active}
                className={cn(
                  "relative flex min-h-16 items-center gap-3 border px-3.5 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-500",
                  active ? "border-navy-700 bg-navy-50" : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50"
                )}
              >
                {active && <span className="absolute right-2 top-2 flex size-4 items-center justify-center bg-navy-800 text-white"><Check className="size-2.5" /></span>}
                <span className={cn("flex size-8 shrink-0 items-center justify-center border", active ? "border-navy-300 bg-white text-navy-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 pr-3">
                  <span className="block text-[13px] font-medium text-graphite-900">{option.label}</span>
                  {option.description && (
                    <span className="block text-xs text-graphite-500">{option.description}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {state.carimbo === "escolher" && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-graphite-200 pt-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Label>Carimbo autorizado</Label>
              <Select value={state.carimboId} onValueChange={(v) => update({ carimboId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccione um carimbo" /></SelectTrigger>
                <SelectContent>
                  {stamps.filter((s) => s.activo).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="mt-3 flex items-center gap-2 border border-graphite-200 bg-graphite-50 px-3 py-2 text-[13px] text-graphite-700">
                <MapPin className="size-3.5 text-graphite-500" />
                <Switch checked={state.posicaoPredefinida} onCheckedChange={(v) => update({ posicaoPredefinida: v })} />
                Posição predefinida
              </label>
            </div>
            <div className="flex min-h-[292px] items-center justify-center border border-graphite-300 bg-graphite-50 p-3 lg:col-span-7">
              <div className="relative flex h-[268px] w-[190px] items-center justify-center border border-graphite-200 bg-white">
                <span className="text-2xs text-graphite-300">Pré-visualização A4</span>
                {selected && (
                  <span
                    className={cn(
                      "absolute rotate-[-8deg] border-2 border-navy-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-700",
                      selected.posicao.includes("superior") ? "top-3" : "bottom-3",
                      selected.posicao.includes("esquerda") ? "left-3" : selected.posicao.includes("direita") ? "right-3" : ""
                    )}
                  >
                    {selected.nome}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </fieldset>

      <div className="border-t border-graphite-200 pt-4">
        <label className="flex items-center gap-3 border border-graphite-200 bg-white px-3.5 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center border border-graphite-200 bg-graphite-50 text-navy-700">
            <PenTool className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium text-graphite-800">Solicitar assinatura digital</span>
            <span className="block text-xs text-graphite-500">Encaminhar para assinatura antes da submissão</span>
          </span>
          <Switch checked={state.solicitarAssinatura} onCheckedChange={(v) => update({ solicitarAssinatura: v })} />
        </label>
      </div>
    </div>
  );
}
