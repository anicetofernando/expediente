import { PageHeader } from "@/components/shared/page-header";
import { TemplateGallery } from "@/components/documents/template-gallery";
import { NewTemplateButton } from "@/components/documents/new-template-button";
import { documentTemplates } from "@/data/workflows";

export const metadata = { title: "Modelos" };

export default function ModelosPage() {
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
