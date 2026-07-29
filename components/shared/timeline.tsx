import * as React from "react";
import {
  FilePlus2, Send, Inbox, Stamp, Forward, MessageSquareText, CheckCircle2, XCircle, Undo2,
  PenTool, PackageCheck, ClipboardCheck, Archive, MessageCircle,
} from "lucide-react";
import type { TimelineEvent } from "@/types";
import { cn, formatDate } from "@/lib/utils";

const ICON_MAP: Record<TimelineEvent["tipo"], React.ComponentType<{ className?: string }>> = {
  criacao: FilePlus2,
  submissao: Send,
  recepcao: Inbox,
  protocolo: Stamp,
  encaminhamento: Forward,
  parecer: MessageSquareText,
  aprovacao: CheckCircle2,
  rejeicao: XCircle,
  devolucao: Undo2,
  carimbo: Stamp,
  assinatura: PenTool,
  entrega: PackageCheck,
  confirmacao: ClipboardCheck,
  arquivo: Archive,
  comentario: MessageCircle,
};

const TONE_MAP: Record<TimelineEvent["tipo"], string> = {
  criacao: "bg-graphite-100 text-graphite-600",
  submissao: "bg-info-50 text-info-600",
  recepcao: "bg-info-50 text-info-600",
  protocolo: "bg-navy-50 text-navy-700",
  encaminhamento: "bg-info-50 text-info-600",
  parecer: "bg-amber-50 text-amber-600",
  aprovacao: "bg-success-50 text-success-600",
  rejeicao: "bg-crimson-50 text-crimson-600",
  devolucao: "bg-crimson-50 text-crimson-600",
  carimbo: "bg-navy-50 text-navy-700",
  assinatura: "bg-navy-50 text-navy-700",
  entrega: "bg-success-50 text-success-600",
  confirmacao: "bg-success-50 text-success-600",
  arquivo: "bg-graphite-100 text-graphite-600",
  comentario: "bg-graphite-100 text-graphite-600",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative">
      {events.map((event, i) => {
        const Icon = ICON_MAP[event.tipo];
        const isLast = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3.5 pb-6 last:pb-0">
            {!isLast && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-graphite-200" aria-hidden />}
            <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white", TONE_MAP[event.tipo])}>
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-[13px] font-medium text-graphite-900">{event.titulo}</p>
                <time className="text-2xs text-graphite-400 tabular-nums whitespace-nowrap">{formatDate(event.data, true)}</time>
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-graphite-600">{event.descricao}</p>
              <p className="mt-1 text-2xs text-graphite-400">
                {event.utilizador} · {event.unidade}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
