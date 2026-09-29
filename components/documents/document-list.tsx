"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import type { Expedient } from "@/types";
import { Badge, ConfidentialityBadge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { DocumentViewer } from "@/components/documents/document-viewer";

export function DocumentList({ title, docs }: { title?: string; docs: Expedient["documentos"] }) {
  const [preview, setPreview] = React.useState<Expedient["documentos"][number] | null>(null);

  return (
    <div>
      {title && <p className="mb-2 text-[13px] font-semibold text-graphite-800">{title}</p>}
      <ul className="divide-y divide-graphite-150 border border-graphite-200">
        {docs.map((doc) => (
          <li key={doc.id}>
            <button
              type="button"
              onClick={() => setPreview(doc)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-graphite-50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-graphite-100 text-graphite-500">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="truncate text-[13px] font-medium text-cfm-700">
                  {doc.numero && <span className="mr-1.5 text-graphite-500">{doc.numero} ·</span>}
                  {doc.nome}
                </p>
                <p className="text-2xs text-graphite-400">
                  {doc.paginas} pág. · {doc.tamanho} · {doc.origem} · {formatDate(doc.criadoEm)}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {doc.carimbado && <Badge variant="navy">Carimbado</Badge>}
                  {doc.assinado && <Badge variant="success">Assinado</Badge>}
                  <ConfidentialityBadge level={doc.confidencialidade} />
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent size="lg" className="h-[100dvh] max-h-[100dvh] w-screen max-w-none rounded-none p-0 sm:h-[82vh] sm:w-[90vw] sm:max-w-[1000px] sm:rounded-lg">
          {preview && (
            <div className="flex h-full min-h-0 flex-col pt-8">
              <DocumentViewer document={preview} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
