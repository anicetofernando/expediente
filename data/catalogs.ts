import { organizationalUnits as organizationSeed } from "@/data/organization";
import { stamps as stampSeed } from "@/data/stamps";
import {
  documentTemplates as documentTemplateSeed,
  documentTypes as documentTypeSeed,
} from "@/data/workflows";
import { CONFIDENTIALITY_META, PRIORITY_META } from "@/lib/status";
import type { Confidentiality, Priority } from "@/types";

export interface CatalogOption {
  id: string;
  code: string;
  label: string;
  description?: string;
  active: boolean;
  order: number;
  isDefault: boolean;
  locked?: boolean;
}

export interface DocumentTypeConfig {
  id: string;
  nome: string;
  numeracaoPrefixo: string;
  exigeCarimbo: boolean;
  exigeAssinatura: boolean;
  workflowId: string;
  activo: boolean;
  ordem: number;
}

export interface CatalogData {
  documentTypes: DocumentTypeConfig[];
  organizationalUnits: CatalogOption[];
  documentTemplates: CatalogOption[];
  stamps: CatalogOption[];
  priorities: CatalogOption[];
  confidentialities: CatalogOption[];
  documentOrigins: CatalogOption[];
  stampChoices: CatalogOption[];
}

const priorityOrder: Priority[] = ["baixa", "normal", "alta", "urgente"];
const confidentialityOrder: Confidentiality[] = [
  "publico",
  "interno",
  "restrito",
  "confidencial",
];

export const catalogSeeds: CatalogData = {
  documentTypes: documentTypeSeed.map((item, index) => ({
    ...item,
    activo: true,
    ordem: index,
  })),
  organizationalUnits: organizationSeed.map((unit, index) => ({
    id: unit.id,
    code: unit.codigo,
    label: unit.nome,
    description: unit.sigla,
    active: unit.estado === "activo",
    order: index,
    isDefault: false,
  })),
  documentTemplates: documentTemplateSeed.map((template, index) => ({
    id: template.id,
    code: template.id,
    label: template.nome,
    description: template.descricao,
    active: template.estado === "activo",
    order: index,
    isDefault: false,
  })),
  stamps: stampSeed.map((stamp, index) => ({
    id: stamp.id,
    code: stamp.id,
    label: stamp.nome,
    description: `${stamp.categoria} · ${stamp.unidade}`,
    active: stamp.activo,
    order: index,
    isDefault: false,
  })),
  priorities: priorityOrder.map((priority, index) => ({
    id: `priority-${priority}`,
    code: priority,
    label: PRIORITY_META[priority].label,
    active: true,
    order: index,
    isDefault: priority === "normal",
    locked: true,
  })),
  confidentialities: confidentialityOrder.map((confidentiality, index) => ({
    id: `confidentiality-${confidentiality}`,
    code: confidentiality,
    label: CONFIDENTIALITY_META[confidentiality].label,
    active: true,
    order: index,
    isDefault: confidentiality === "interno",
    locked: true,
  })),
  documentOrigins: [
    {
      id: "document-origin-system",
      code: "sistema",
      label: "Criar no sistema",
      description: "Redigir a partir de um modelo",
      active: true,
      order: 0,
      isDefault: false,
      locked: true,
    },
    {
      id: "document-origin-import",
      code: "importado",
      label: "Importar documento",
      description: "PDF, DOCX ou imagem",
      active: true,
      order: 1,
      isDefault: false,
      locked: true,
    },
    {
      id: "document-origin-scan",
      code: "digitalizado",
      label: "Digitalizar",
      description: "Capturar documento físico",
      active: true,
      order: 2,
      isDefault: false,
      locked: true,
    },
    {
      id: "document-origin-process-only",
      code: "apenas-processo",
      label: "Apenas processo",
      description: "Anexar o documento depois",
      active: true,
      order: 3,
      isDefault: false,
      locked: true,
    },
  ],
  stampChoices: [
    {
      id: "stamp-choice-none",
      code: "nao",
      label: "Não aplicar",
      description: "Sem carimbo",
      active: true,
      order: 0,
      isDefault: true,
      locked: true,
    },
    {
      id: "stamp-choice-automatic",
      code: "automatico",
      label: "Automático",
      description: "Definido pelo fluxo",
      active: true,
      order: 1,
      isDefault: false,
      locked: true,
    },
    {
      id: "stamp-choice-manual",
      code: "escolher",
      label: "Escolher carimbo",
      description: "Selecção manual",
      active: true,
      order: 2,
      isDefault: false,
      locked: true,
    },
  ],
};

export function createCatalogSeedSnapshot(): CatalogData {
  return {
    documentTypes: catalogSeeds.documentTypes.map((item) => ({ ...item })),
    organizationalUnits: catalogSeeds.organizationalUnits.map((item) => ({
      ...item,
    })),
    documentTemplates: catalogSeeds.documentTemplates.map((item) => ({
      ...item,
    })),
    stamps: catalogSeeds.stamps.map((item) => ({ ...item })),
    priorities: catalogSeeds.priorities.map((item) => ({ ...item })),
    confidentialities: catalogSeeds.confidentialities.map((item) => ({
      ...item,
    })),
    documentOrigins: catalogSeeds.documentOrigins.map((item) => ({ ...item })),
    stampChoices: catalogSeeds.stampChoices.map((item) => ({ ...item })),
  };
}
