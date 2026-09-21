"use client";

import * as React from "react";
import type { DocumentTemplate, OrganizationalUnit, Stamp } from "@/types";
import { organizationalUnits as defaultOrganizationalUnits } from "@/data/organization";
import { documentTemplates as defaultDocumentTemplates, documentTypes as defaultDocumentTypesRaw } from "@/data/workflows";
import { stamps as defaultStamps } from "@/data/stamps";
import { useSession } from "@/lib/session";

export interface CatalogOption {
  id: string;
  code: string;
  label: string;
  description: string;
  order: number;
  active: boolean;
  isDefault: boolean;
}

export interface DocumentTypeConfig {
  id: string;
  nome: string;
  numeracaoPrefixo: string;
  exigeCarimbo: boolean;
  exigeAssinatura: boolean;
  exigeAprovacaoDirector: boolean;
  workflowId: string;
  activo: boolean;
  ordem: number;
}

const defaultDocumentTypes: DocumentTypeConfig[] = defaultDocumentTypesRaw.map((item, index) => ({ ...item, activo: true, ordem: index + 1 }));

const defaultPriorities: CatalogOption[] = [
  { id: "prio-baixa", code: "baixa", label: "Baixa", description: "Sem impacto directo em prazos operacionais.", order: 1, active: true, isDefault: false },
  { id: "prio-normal", code: "normal", label: "Normal", description: "Tramitação dentro dos prazos regulares.", order: 2, active: true, isDefault: true },
  { id: "prio-alta", code: "alta", label: "Alta", description: "Requer tratamento antecipado face à fila regular.", order: 3, active: true, isDefault: false },
  { id: "prio-urgente", code: "urgente", label: "Urgente", description: "Impacto operacional imediato — tratamento prioritário.", order: 4, active: true, isDefault: false },
];

const defaultConfidentialities: CatalogOption[] = [
  { id: "conf-publico", code: "publico", label: "Público", description: "Sem restrição de consulta dentro e fora da instituição.", order: 1, active: true, isDefault: false },
  { id: "conf-interno", code: "interno", label: "Interno", description: "Consulta restrita a colaboradores da instituição.", order: 2, active: true, isDefault: true },
  { id: "conf-restrito", code: "restrito", label: "Restrito", description: "Consulta limitada às unidades envolvidas no processo.", order: 3, active: true, isDefault: false },
  { id: "conf-confidencial", code: "confidencial", label: "Confidencial", description: "Consulta limitada a utilizadores explicitamente autorizados.", order: 4, active: true, isDefault: false },
];

const defaultDocumentOrigins: CatalogOption[] = [
  { id: "orig-sistema", code: "sistema", label: "Criar dentro do sistema", description: "Redigir uma carta directamente no editor institucional.", order: 1, active: true, isDefault: true },
  { id: "orig-importado", code: "importado", label: "Importar documento", description: "Carregar um ficheiro PDF, DOCX ou imagem já existente.", order: 2, active: true, isDefault: false },
  { id: "orig-processo", code: "apenas-processo", label: "Criar apenas o processo", description: "Abrir o processo e anexar o documento principal mais tarde.", order: 3, active: true, isDefault: false },
];

const defaultStampChoices: CatalogOption[] = [
  { id: "carimbo-nao", code: "nao", label: "Não aplicar", description: "Prosseguir sem aplicar carimbo neste momento.", order: 1, active: true, isDefault: false },
  { id: "carimbo-auto", code: "automatico", label: "Aplicar automaticamente", description: "Utilizar o carimbo predefinido para este tipo de documento.", order: 2, active: true, isDefault: true },
  { id: "carimbo-escolher", code: "escolher", label: "Escolher carimbo", description: "Seleccionar manualmente um carimbo autorizado.", order: 3, active: true, isDefault: false },
];

const defaultPositions: CatalogOption[] = [
  { id: "cargo-admin-sistema", code: "administrador-sistema", label: "Administrador do Sistema", description: "Gestão técnica e funcional da plataforma.", order: 1, active: true, isDefault: false },
  { id: "cargo-director-geral", code: "director-geral", label: "Director Geral", description: "Responsável máximo pela direcção geral.", order: 2, active: true, isDefault: false },
  { id: "cargo-director", code: "director", label: "Director", description: "Responsável por uma direcção ou unidade superior.", order: 3, active: true, isDefault: false },
  { id: "cargo-chefe-departamento", code: "chefe-departamento", label: "Chefe de Departamento", description: "Responsável por departamento.", order: 4, active: true, isDefault: false },
  { id: "cargo-chefe-servico", code: "chefe-servico", label: "Chefe de Serviço", description: "Responsável por serviço ou sector.", order: 5, active: true, isDefault: false },
  { id: "cargo-secretaria", code: "secretaria", label: "Secretaria", description: "Recepção, protocolo e tramitação de expedientes.", order: 6, active: true, isDefault: false },
  { id: "cargo-tecnico-superior", code: "tecnico-superior", label: "Técnico Superior", description: "Execução e análise técnica de processos.", order: 7, active: true, isDefault: true },
  { id: "cargo-remetente", code: "remetente", label: "Remetente", description: "Utilizador que submete expedientes.", order: 8, active: true, isDefault: false },
];

interface CatalogsSnapshot {
  organizationalUnits: OrganizationalUnit[];
  priorities: CatalogOption[];
  confidentialities: CatalogOption[];
  documentOrigins: CatalogOption[];
  stampChoices: CatalogOption[];
  positions: CatalogOption[];
  documentTypes: DocumentTypeConfig[];
  documentTemplates: DocumentTemplate[];
  stamps: Stamp[];
}

let catalogsRequest: Promise<Partial<CatalogsSnapshot> | null> | undefined;

function loadCatalogs() {
  if (!catalogsRequest) {
    catalogsRequest = fetch("/api/settings/catalogs", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Nao foi possivel carregar os catalogos.");
        const result = await response.json() as { catalogs: Partial<CatalogsSnapshot> | null };
        return result.catalogs;
      })
      .finally(() => { catalogsRequest = undefined; });
  }
  return catalogsRequest;
}

function buildDefaults(): CatalogsSnapshot {
  return { organizationalUnits: defaultOrganizationalUnits, priorities: defaultPriorities, confidentialities: defaultConfidentialities, documentOrigins: defaultDocumentOrigins, stampChoices: defaultStampChoices, positions: defaultPositions, documentTypes: defaultDocumentTypes, documentTemplates: defaultDocumentTemplates, stamps: defaultStamps };
}

function supportedDocumentOrigins(origins: CatalogOption[]) {
  return origins
    .filter((origin) => origin.code !== "digitalizado")
    .map((origin, index) => ({ ...origin, order: index + 1 }));
}

interface CatalogsContextValue extends CatalogsSnapshot {
  catalogReady: boolean;
  setOrganizationalUnits: React.Dispatch<React.SetStateAction<OrganizationalUnit[]>>;
  setPriorities: React.Dispatch<React.SetStateAction<CatalogOption[]>>;
  setConfidentialities: React.Dispatch<React.SetStateAction<CatalogOption[]>>;
  setDocumentOrigins: React.Dispatch<React.SetStateAction<CatalogOption[]>>;
  setStampChoices: React.Dispatch<React.SetStateAction<CatalogOption[]>>;
  setPositions: React.Dispatch<React.SetStateAction<CatalogOption[]>>;
  setDocumentTypes: React.Dispatch<React.SetStateAction<DocumentTypeConfig[]>>;
  setDocumentTemplates: React.Dispatch<React.SetStateAction<DocumentTemplate[]>>;
  setStamps: React.Dispatch<React.SetStateAction<Stamp[]>>;
  resetCatalogs: () => void;
}

const CatalogsContext = React.createContext<CatalogsContextValue | null>(null);

export function CatalogsProvider({ children }: { children: React.ReactNode }) {
  const { perfilNavegacao } = useSession();
  const defaults = React.useMemo(buildDefaults, []);
  const [organizationalUnits, setOrganizationalUnits] = React.useState(defaults.organizationalUnits);
  const [priorities, setPriorities] = React.useState(defaults.priorities);
  const [confidentialities, setConfidentialities] = React.useState(defaults.confidentialities);
  const [documentOrigins, setDocumentOrigins] = React.useState(defaults.documentOrigins);
  const [stampChoices, setStampChoices] = React.useState(defaults.stampChoices);
  const [positions, setPositions] = React.useState(defaults.positions);
  const [documentTypes, setDocumentTypes] = React.useState(defaults.documentTypes);
  const [documentTemplates, setDocumentTemplates] = React.useState(defaults.documentTemplates);
  const [stamps, setStamps] = React.useState(defaults.stamps);
  const [catalogReady, setCatalogReady] = React.useState(false);
  const persistedSnapshot = React.useRef("");

  React.useEffect(() => {
    let cancelled = false;
    void loadCatalogs()
      .then((parsed) => {
        if (cancelled || !parsed) return;
        const merged: CatalogsSnapshot = { ...defaults, ...parsed };
        const snapshot: CatalogsSnapshot = {
          ...merged,
          documentOrigins: supportedDocumentOrigins(merged.documentOrigins),
          positions: Array.isArray(merged.positions) ? merged.positions : defaults.positions,
        };
        setOrganizationalUnits(snapshot.organizationalUnits);
        setPriorities(snapshot.priorities);
        setConfidentialities(snapshot.confidentialities);
        setDocumentOrigins(snapshot.documentOrigins);
        setStampChoices(snapshot.stampChoices);
        setPositions(snapshot.positions);
        setDocumentTypes(snapshot.documentTypes);
        setDocumentTemplates(snapshot.documentTemplates);
        setStamps(snapshot.stamps);
        persistedSnapshot.current = JSON.stringify(snapshot);
      })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setCatalogReady(true); });
    return () => { cancelled = true; };
  }, [defaults]);

  React.useEffect(() => {
    if (!catalogReady || perfilNavegacao !== "administracao") return;
    const snapshot: CatalogsSnapshot = { organizationalUnits, priorities, confidentialities, documentOrigins: supportedDocumentOrigins(documentOrigins), stampChoices, positions, documentTypes, documentTemplates, stamps };
    const serialized = JSON.stringify(snapshot);
    if (serialized === persistedSnapshot.current) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/settings/catalogs", { method: "PUT", headers: { "Content-Type": "application/json" }, body: serialized })
        .then((response) => {
          if (!response.ok) return;
          persistedSnapshot.current = serialized;
        });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [catalogReady, perfilNavegacao, organizationalUnits, priorities, confidentialities, documentOrigins, stampChoices, positions, documentTypes, documentTemplates, stamps]);

  const resetCatalogs = React.useCallback(() => {
    const fresh = buildDefaults();
    setOrganizationalUnits(fresh.organizationalUnits);
    setPriorities(fresh.priorities);
    setConfidentialities(fresh.confidentialities);
    setDocumentOrigins(fresh.documentOrigins);
    setStampChoices(fresh.stampChoices);
    setPositions(fresh.positions);
    setDocumentTypes(fresh.documentTypes);
    setDocumentTemplates(fresh.documentTemplates);
    setStamps(fresh.stamps);
  }, []);

  return <CatalogsContext.Provider value={{ catalogReady, organizationalUnits, priorities, confidentialities, documentOrigins, stampChoices, positions, documentTypes, documentTemplates, stamps, setOrganizationalUnits, setPriorities, setConfidentialities, setDocumentOrigins, setStampChoices, setPositions, setDocumentTypes, setDocumentTemplates, setStamps, resetCatalogs }}>{children}</CatalogsContext.Provider>;
}

export function useCatalogs() {
  const context = React.useContext(CatalogsContext);
  if (!context) throw new Error("useCatalogs deve ser utilizado dentro de CatalogsProvider");
  return context;
}
