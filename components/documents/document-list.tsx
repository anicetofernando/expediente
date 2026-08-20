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
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-graphite-50"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-graphite-100 text-graphite-500">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-navy-700">{doc.nome}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-2xs text-graphite-400">
                  <span>{doc.paginas} pág.</span><span>·</span><span>{doc.tamanho}</span><span>·</span>
                  <span>{doc.origem}</span><span>·</span>
                  <span>{formatDate(doc.criadoEm)}</span>
                  {doc.carimbado && <Badge variant="navy">Carimbado</Badge>}
                  {doc.assinado && <Badge variant="success">Assinado</Badge>}
                </p>
              </div>
              <ConfidentialityBadge level={doc.confidencialidade} />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent size="xl" className="h-[94vh] w-[96vw] max-w-[1600px] p-0">
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
