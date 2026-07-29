"use client";

import type { ReactNode } from "react";
import { FileText, Paperclip, Stamp, PenTool } from "lucide-react";
import { PriorityBadge, ConfidentialityBadge } from "@/components/ui/badge";
import { useCatalogs } from "@/lib/catalogs";
import { formatDate } from "@/lib/utils";
import type { Confidentiality, Priority } from "@/types";
import type { StepProps } from "./types";

export function StepReview({ state }: StepProps) {
  const {
    documentTypes,
    organizationalUnits,
    priorities,
    confidentialities,
    documentOrigins,
    documentTemplates,
    stamps,
    stampChoices,
  } = useCatalogs();
  const documentType = documentTypes.find((item) => item.id === state.tipo);
  const originUnit = organizationalUnits.find((item) => item.id === state.unidadeOrigem);
  const recipientUnit = organizationalUnits.find((item) => item.id === state.destinatario);
  const priority = priorities.find((item) => item.code === state.prioridade);
  const confidentiality = confidentialities.find((item) => item.code === state.confidencialidade);
  const documentOrigin = documentOrigins.find((item) => item.code === state.origemDocumento);
  const template = documentTemplates.find((item) => item.id === state.modeloId);
  const carimbo = stamps.find((s) => s.id === state.carimboId);
  const stampChoice = stampChoices.find((item) => item.code === state.carimbo);

  return (
    <div className="space-y-4">
      <ReviewSection title="Informação básica">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <tbody className="divide-y divide-graphite-150">
              <tr>
                <ReviewLabel>Tipo</ReviewLabel>
                <ReviewValue>{documentType?.nome ?? "—"}</ReviewValue>
                <ReviewLabel>Unidade de origem</ReviewLabel>
                <ReviewValue>{originUnit?.nome ?? "—"}</ReviewValue>
                <ReviewLabel>Prazo</ReviewLabel>
                <ReviewValue>{state.prazo ? formatDate(state.prazo) : "Não definido"}</ReviewValue>
              </tr>
              <tr>
                <ReviewLabel>Remetente</ReviewLabel>
                <ReviewValue colSpan={2}>{state.remetente || "—"}</ReviewValue>
                <ReviewLabel>Destinatário</ReviewLabel>
                <ReviewValue colSpan={2}>{recipientUnit?.nome ?? "—"}</ReviewValue>
              </tr>
              <tr>
                <ReviewLabel>Assunto</ReviewLabel>
                <ReviewValue colSpan={5}>{state.assunto || "—"}</ReviewValue>
              </tr>
              <tr>
                <ReviewLabel>Prioridade</ReviewLabel>
                <ReviewValue>
                  {state.prioridade ? (
                    <PriorityBadge
                      priority={state.prioridade as Priority}
                      label={priority?.label}
                    />
                  ) : "—"}
                </ReviewValue>
                <ReviewLabel>Confidencialidade</ReviewLabel>
                <ReviewValue>
                  {state.confidencialidade ? (
                    <ConfidentialityBadge
                      level={state.confidencialidade as Confidentiality}
                      label={confidentiality?.label}
                    />
                  ) : "—"}
                </ReviewValue>
                <ReviewLabel>Origem</ReviewLabel>
                <ReviewValue>{documentOrigin?.label ?? "Não definido"}</ReviewValue>
              </tr>
            </tbody>
          </table>
        </div>
      </ReviewSection>

      <ReviewSection title="Documento principal" icon={FileText}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-[13px]">
            <thead className="border-b border-graphite-200 bg-graphite-50 text-left text-2xs font-semibold uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="px-3 py-2">Origem</th>
                <th className="px-3 py-2">Documento / modelo</th>
                <th className="w-28 px-3 py-2">Páginas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2.5 text-graphite-700">{documentOrigin?.label ?? "Não definido"}</td>
                <td className="px-3 py-2.5 font-medium text-graphite-800">
                  {state.ficheiroNome || template?.nome || "—"}
                </td>
                <td className="px-3 py-2.5 tabular-nums text-graphite-600">{state.numPaginas || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReviewSection>

      <ReviewSection title={`Anexos (${state.anexos.length})`} icon={Paperclip}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] table-fixed text-[13px]">
            <thead className="border-b border-graphite-200 bg-graphite-50 text-left text-2xs font-semibold uppercase tracking-wide text-graphite-500">
              <tr>
                <th className="w-12 px-3 py-2 text-center">#</th>
                <th className="px-3 py-2">Ficheiro</th>
                <th className="w-[35%] px-3 py-2">Descrição</th>
                <th className="w-36 px-3 py-2">Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-150">
              {state.anexos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-5 text-center text-graphite-500">Sem anexos</td>
                </tr>
              ) : (
                state.anexos.map((a, index) => (
                  <tr key={a.id}>
                    <td className="px-3 py-2 text-center tabular-nums text-graphite-500">{index + 1}</td>
                    <td className="truncate px-3 py-2 font-medium text-graphite-800">{a.nome}</td>
                    <td className="truncate px-3 py-2 text-graphite-600">{a.descricao || "—"}</td>
                    <td className="px-3 py-2">
                      {a.confidencialidade ? (
                        <ConfidentialityBadge
                          level={a.confidencialidade as Confidentiality}
                          label={confidentialities.find((item) => item.code === a.confidencialidade)?.label}
                        />
                      ) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ReviewSection>

      <ReviewSection title="Carimbo e assinatura" icon={Stamp}>
        <div className="grid grid-cols-1 divide-y divide-graphite-150 text-[13px] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-2 px-3 py-3">
            <Stamp className="size-3.5 text-navy-700" />
            <span className="text-graphite-500">Carimbo</span>
            <span className="font-medium text-graphite-800">
              {state.carimbo === "escolher"
                ? carimbo?.nome ?? "Não seleccionado"
                : stampChoice?.label ?? "Não definido"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-3">
            <PenTool className="size-3.5 text-navy-700" />
            <span className="font-medium text-graphite-800">
              {state.solicitarAssinatura ? "Assinatura digital solicitada" : "Sem assinatura digital"}
            </span>
          </div>
        </div>
      </ReviewSection>
    </div>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof FileText;
  children: ReactNode;
}) {
  return (
    <section className="border border-graphite-200">
      <h3 className="flex h-9 items-center gap-2 border-b border-graphite-200 bg-graphite-50 px-3 text-[13px] font-semibold text-graphite-800">
        {Icon && <Icon className="size-3.5 text-navy-700" />}
        {title}
      </h3>
      {children}
    </section>
  );
}

function ReviewLabel({ children }: { children: ReactNode }) {
  return <th className="w-28 bg-graphite-50 px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-graphite-500">{children}</th>;
}

function ReviewValue({ children, colSpan }: { children: ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="min-w-36 px-3 py-2 text-graphite-800">{children}</td>;
}
