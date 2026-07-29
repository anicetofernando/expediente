"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, FileStack, LayoutTemplate } from "lucide-react";
import type { DocumentTemplate } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export function TemplateGallery({ templates }: { templates: DocumentTemplate[] }) {
  const [preview, setPreview] = React.useState<DocumentTemplate | null>(null);

  if (templates.length === 0) {
    return <EmptyState icon={LayoutTemplate} title="Sem modelos de documento" description="Ainda não foi criado nenhum modelo de documento institucional." />;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{t.nome}</CardTitle>
              <Badge variant="navy">{t.categoria}</Badge>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-[13px] leading-relaxed text-graphite-600">{t.descricao}</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-graphite-400">
                <span className="flex items-center gap-1"><FileStack className="size-3" /> {t.camposCount} campos</span>
                <span>{t.utilizacoes} utilizações</span>
                <span>Actualizado em {formatDate(t.actualizadoEm)}</span>
              </div>
              <div className="mt-2.5">
                <Badge variant={t.estado === "activo" ? "success" : "neutral"}>{t.estado === "activo" ? "Activo" : "Inactivo"}</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" size="sm" onClick={() => setPreview(t)}>
                <Eye className="size-3.5" /> Pré-visualizar
              </Button>
              <Button size="sm" asChild>
                <Link href="/expedientes/novo">Usar modelo</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={preview !== null} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{preview?.nome}</DialogTitle>
            <DialogDescription>{preview?.categoria} · {preview?.camposCount} campos · versão actualizada em {preview && formatDate(preview.actualizadoEm)}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex justify-center bg-graphite-50 p-6">
              <div className="flex aspect-[210/297] w-full max-w-sm flex-col items-center justify-center gap-2 border border-graphite-300 bg-white p-8 text-center shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-800">CFM — Portos e Caminhos de Ferro de Moçambique</p>
                <div className="mt-6 h-px w-16 bg-graphite-200" />
                <p className="mt-6 text-sm font-semibold text-graphite-800">{preview?.nome}</p>
                <p className="text-2xs text-graphite-400">Modelo institucional · {preview?.categoria}</p>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
