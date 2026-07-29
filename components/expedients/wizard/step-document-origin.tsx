"use client";

import { FileEdit, Upload, ScanLine, FolderPlus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCatalogs } from "@/lib/catalogs";
import type { StepProps } from "./types";
import type { DocumentOrigin } from "./types";

const ORIGIN_ICONS: Record<DocumentOrigin, typeof FileEdit> = {
  sistema: FileEdit,
  importado: Upload,
  digitalizado: ScanLine,
  "apenas-processo": FolderPlus,
};

export function StepDocumentOrigin({ state, update }: StepProps) {
  const { documentOrigins } = useCatalogs();
  const options = [...documentOrigins]
    .filter((item) => item.active && item.code in ORIGIN_ICONS)
    .sort((a, b) => a.order - b.order);

  return (
    <fieldset>
      <legend className="sr-only">Origem do documento principal</legend>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {options.map((option) => {
          const value = option.code as DocumentOrigin;
          const Icon = ORIGIN_ICONS[value];
          const active = state.origemDocumento === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => update({ origemDocumento: value })}
              aria-pressed={active}
              className={cn(
                "relative flex min-h-20 items-center gap-3 border px-3.5 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-500",
                active
                  ? "border-navy-700 bg-navy-50"
                  : "border-graphite-200 bg-white hover:border-graphite-400 hover:bg-graphite-50"
              )}
            >
              {active && (
                <span className="absolute right-2 top-2 flex size-4 items-center justify-center bg-navy-800 text-white">
                  <Check className="size-2.5" />
                </span>
              )}
              <span className={cn("flex size-8 shrink-0 items-center justify-center border", active ? "border-navy-300 bg-white text-navy-800" : "border-graphite-200 bg-graphite-50 text-graphite-500")}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 pr-2">
                <span className="block text-[13px] font-semibold text-graphite-900">{option.label}</span>
                {option.description && (
                  <span className="mt-0.5 block text-xs leading-4 text-graphite-500">{option.description}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
