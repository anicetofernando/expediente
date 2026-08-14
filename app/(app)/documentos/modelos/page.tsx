"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TemplateGallery } from "@/components/documents/template-gallery";
import { NewTemplateButton } from "@/components/documents/new-template-button";
import { useCatalogs } from "@/lib/catalogs";

export default function ModelosPage() {
  const { documentTemplates } = useCatalogs();
  return (
    <div>
      <PageHeader
        title="Modelos"
        description="Modelos institucionais de documento disponíveis para utilização na criação de novos expedientes"
        breadcrumb={[{ label: "Documentos", href: "/documentos" }, { label: "Modelos" }]}
        actions={<NewTemplateButton />}
      />
      <div className="p-6">
        <TemplateGallery templates={documentTemplates} />
      </div>
    </div>
  );
}
