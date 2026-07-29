"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepDef[];
  current: number;
  onStepChange?: (index: number) => void;
}

export function Stepper({ steps, current, onStepChange }: StepperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeRef = React.useRef<HTMLLIElement>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const activeStep = activeRef.current;
    if (!container || !activeStep || container.scrollWidth <= container.clientWidth) return;

    activeStep.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [current]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto border border-graphite-200 bg-white"
    >
      <ol
        aria-label="Progresso do formulário"
        className="grid min-w-[980px] lg:min-w-0"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const state = i < current ? "done" : i === current ? "active" : "upcoming";
          const stateLabel =
            state === "done" ? "concluída" : state === "active" ? "actual" : "por concluir";
          const isNavigable = state === "done" && Boolean(onStepChange);

          const content = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center border text-[11px] font-semibold tabular-nums",
                  state === "done" && "border-navy-700 bg-navy-700 text-white",
                  state === "active" && "border-navy-700 bg-white text-navy-800",
                  state === "upcoming" && "border-graphite-300 bg-white text-graphite-500",
                  isNavigable &&
                    "group-hover:border-navy-800 group-hover:bg-navy-800 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-navy-300"
                )}
              >
                {state === "done" ? <Check className="size-3.5" strokeWidth={2.25} /> : i + 1}
              </span>

              <span
                title={step.description ?? step.label}
                className={cn(
                  "block min-w-0 overflow-hidden text-left text-[13px] font-medium leading-4 lg:text-center xl:text-left",
                  state === "active" && "font-semibold text-navy-900",
                  state === "done" && "text-graphite-700",
                  state === "upcoming" && "text-graphite-500",
                  isNavigable && "group-hover:text-navy-900"
                )}
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <li
              ref={state === "active" ? activeRef : undefined}
              key={`${i}-${step.label}`}
              aria-current={state === "active" ? "step" : undefined}
              aria-label={`Etapa ${i + 1} de ${steps.length}: ${step.label}, ${stateLabel}`}
              className="relative min-w-0 border-r border-graphite-200 last:border-r-0"
            >
              {isNavigable ? (
                <button
                  type="button"
                  className={cn(
                    "group relative flex min-h-[58px] w-full items-center gap-2.5 px-3 py-2.5 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-navy-600",
                    "lg:min-h-[68px] lg:flex-col lg:justify-center lg:gap-1.5 lg:px-2 xl:min-h-[58px] xl:flex-row xl:justify-start xl:gap-2.5 xl:px-3",
                    state === "done" && "bg-navy-50/50 hover:bg-navy-50"
                  )}
                  aria-label={`Voltar à etapa ${i + 1}: ${step.label}`}
                  onClick={() => onStepChange?.(i)}
                >
                  {content}
                </button>
              ) : (
                <div
                  className={cn(
                    "relative flex min-h-[58px] w-full items-center gap-2.5 px-3 py-2.5",
                    "lg:min-h-[68px] lg:flex-col lg:justify-center lg:gap-1.5 lg:px-2 xl:min-h-[58px] xl:flex-row xl:justify-start xl:gap-2.5 xl:px-3",
                    state === "active" && "bg-white",
                    state === "upcoming" && "bg-graphite-25"
                  )}
                >
                  {content}
                </div>
              )}

              {state === "active" && (
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-navy-700" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
