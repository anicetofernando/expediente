import type { Workflow, DocumentTemplate } from "@/types";

export const workflows: Workflow[] = [
  {
    id: "wf-oficio-padrao",
    nome: "Ofício — Fluxo Padrão",
    descricao: "Fluxo geral aplicável a ofícios internos e externos, da submissão ao arquivo.",
    tipoDocumento: "Ofício",
    versao: "3.1",
    estado: "publicado",
    actualizadoEm: "2026-06-02T10:00:00",
    actualizadoPor: "Amélia Nhaca",
    etapas: [
      { id: "s1", nome: "Recepção", responsavelPerfil: "Secretaria Geral", prazoDias: 1, accoesPermitidas: ["Receber", "Protocolar"], carimbo: "Recebido", assinaturaObrigatoria: false, proximaEtapaAprovado: "s2" },
      { id: "s2", nome: "Protocolo", responsavelPerfil: "Secretaria Geral", prazoDias: 1, accoesPermitidas: ["Protocolar", "Encaminhar"], carimbo: "Protocolo Geral", assinaturaObrigatoria: false, proximaEtapaAprovado: "s3" },
      { id: "s3", nome: "Análise da unidade responsável", responsavelPerfil: "Chefia de Departamento", prazoDias: 5, accoesPermitidas: ["Analisar", "Solicitar parecer", "Devolver"], assinaturaObrigatoria: false, proximaEtapaAprovado: "s4", proximaEtapaRejeitado: "s6" },
      { id: "s4", nome: "Aprovação superior", responsavelPerfil: "Direcção", prazoDias: 3, accoesPermitidas: ["Aprovar", "Rejeitar", "Devolver"], assinaturaObrigatoria: true, proximaEtapaAprovado: "s5", proximaEtapaRejeitado: "s6" },
      { id: "s5", nome: "Entrega e arquivo", responsavelPerfil: "Secretaria Geral", prazoDias: 2, accoesPermitidas: ["Entregar", "Confirmar recebimento", "Arquivar"], assinaturaObrigatoria: false },
      { id: "s6", nome: "Devolução ao remetente", responsavelPerfil: "Secretaria Geral", prazoDias: 2, accoesPermitidas: ["Notificar remetente"], assinaturaObrigatoria: false },
    ],
  },
  {
    id: "wf-requisicao-material",
    nome: "Requisição de Material",
    descricao: "Fluxo específico para requisições de material técnico com parecer orçamental obrigatório.",
    tipoDocumento: "Requisição",
    versao: "2.0",
    estado: "publicado",
    actualizadoEm: "2026-05-14T09:00:00",
    actualizadoPor: "Graça Muianga",
    etapas: [
      { id: "s1", nome: "Recepção e protocolo", responsavelPerfil: "Secretaria Geral", prazoDias: 1, accoesPermitidas: ["Receber", "Protocolar", "Encaminhar"], carimbo: "Protocolo Geral", assinaturaObrigatoria: false, proximaEtapaAprovado: "s2" },
      { id: "s2", nome: "Parecer orçamental", responsavelPerfil: "Departamento de Aprovisionamento", prazoDias: 5, accoesPermitidas: ["Emitir parecer", "Devolver"], assinaturaObrigatoria: false, proximaEtapaAprovado: "s3", proximaEtapaRejeitado: "s5" },
      { id: "s3", nome: "Aprovação financeira", responsavelPerfil: "Direcção Financeira e Administrativa", prazoDias: 3, accoesPermitidas: ["Aprovar", "Rejeitar"], assinaturaObrigatoria: true, proximaEtapaAprovado: "s4", proximaEtapaRejeitado: "s5" },
      { id: "s4", nome: "Emissão de nota de encomenda", responsavelPerfil: "Departamento de Aprovisionamento", prazoDias: 2, accoesPermitidas: ["Emitir", "Arquivar"], assinaturaObrigatoria: false },
      { id: "s5", nome: "Comunicação de indeferimento", responsavelPerfil: "Departamento de Aprovisionamento", prazoDias: 1, accoesPermitidas: ["Notificar remetente"], assinaturaObrigatoria: false },
    ],
  },
  {
    id: "wf-parecer-juridico",
    nome: "Parecer Jurídico",
    descricao: "Fluxo para solicitação e emissão de pareceres jurídicos sobre contratos e litígios.",
    tipoDocumento: "Parecer",
    versao: "1.4",
    estado: "publicado",
    actualizadoEm: "2026-04-20T09:00:00",
    actualizadoPor: "Noémia Machel",
    etapas: [
      { id: "s1", nome: "Recepção", responsavelPerfil: "Secretaria Geral", prazoDias: 1, accoesPermitidas: ["Receber", "Encaminhar"], assinaturaObrigatoria: false, proximaEtapaAprovado: "s2" },
      { id: "s2", nome: "Análise jurídica", responsavelPerfil: "Direcção Jurídica", prazoDias: 10, accoesPermitidas: ["Emitir parecer", "Devolver", "Solicitar esclarecimento"], assinaturaObrigatoria: true, proximaEtapaAprovado: "s3", proximaEtapaRejeitado: "s3" },
      { id: "s3", nome: "Entrega ao solicitante", responsavelPerfil: "Secretaria Geral", prazoDias: 1, accoesPermitidas: ["Entregar", "Arquivar"], assinaturaObrigatoria: false },
    ],
  },
  {
    id: "wf-relatorio-incidente",
    nome: "Relatório de Incidente Operacional",
    descricao: "Fluxo acelerado para reportes de avaria ou incidente com impacto operacional.",
    tipoDocumento: "Informação técnica",
    versao: "1.0",
    estado: "rascunho",
    actualizadoEm: "2026-07-12T15:00:00",
    actualizadoPor: "Carlos Machava",
    etapas: [
      { id: "s1", nome: "Registo urgente", responsavelPerfil: "Chefia de Departamento", prazoDias: 1, accoesPermitidas: ["Registar", "Escalar"], assinaturaObrigatoria: false, proximaEtapaAprovado: "s2" },
      { id: "s2", nome: "Decisão de intervenção", responsavelPerfil: "Direcção", prazoDias: 1, accoesPermitidas: ["Aprovar intervenção", "Solicitar mais dados"], assinaturaObrigatoria: false },
    ],
  },
];

export const documentTemplates: DocumentTemplate[] = [
  { id: "tpl-oficio", nome: "Ofício Institucional", categoria: "Correspondência", descricao: "Modelo padrão para ofícios internos e externos com cabeçalho institucional.", camposCount: 8, utilizacoes: 412, actualizadoEm: "2026-06-01", estado: "activo" },
  { id: "tpl-memorando", nome: "Memorando Interno", categoria: "Correspondência", descricao: "Comunicação interna entre unidades orgânicas.", camposCount: 6, utilizacoes: 289, actualizadoEm: "2026-05-20", estado: "activo" },
  { id: "tpl-requisicao", nome: "Requisição de Material", categoria: "Aprovisionamento", descricao: "Formulário de requisição de bens e materiais com lista de itens.", camposCount: 10, utilizacoes: 201, actualizadoEm: "2026-06-15", estado: "activo" },
  { id: "tpl-parecer", nome: "Parecer Técnico", categoria: "Técnico", descricao: "Modelo estruturado para emissão de pareceres técnicos e jurídicos.", camposCount: 7, utilizacoes: 134, actualizadoEm: "2026-04-18", estado: "activo" },
  { id: "tpl-despacho", nome: "Despacho", categoria: "Decisão", descricao: "Modelo para registo formal de decisões e despachos de direcção.", camposCount: 5, utilizacoes: 98, actualizadoEm: "2026-06-22", estado: "activo" },
  { id: "tpl-relatorio", nome: "Relatório de Actividades", categoria: "Relatório", descricao: "Estrutura padrão para relatórios periódicos de unidades orgânicas.", camposCount: 9, utilizacoes: 156, actualizadoEm: "2026-05-30", estado: "activo" },
  { id: "tpl-nota-servico", nome: "Nota de Serviço", categoria: "Correspondência", descricao: "Comunicação administrativa breve de carácter interno.", camposCount: 4, utilizacoes: 67, actualizadoEm: "2026-03-11", estado: "inactivo" },
];

export const documentTypes = [
  { id: "dt-oficio", nome: "Ofício", numeracaoPrefixo: "OF", exigeCarimbo: true, exigeAssinatura: true, workflowId: "wf-oficio-padrao" },
  { id: "dt-memorando", nome: "Memorando", numeracaoPrefixo: "MEM", exigeCarimbo: false, exigeAssinatura: true, workflowId: "wf-oficio-padrao" },
  { id: "dt-requisicao", nome: "Requisição", numeracaoPrefixo: "REQ", exigeCarimbo: true, exigeAssinatura: false, workflowId: "wf-requisicao-material" },
  { id: "dt-informacao", nome: "Informação técnica", numeracaoPrefixo: "INF", exigeCarimbo: false, exigeAssinatura: false, workflowId: "wf-relatorio-incidente" },
  { id: "dt-parecer", nome: "Parecer", numeracaoPrefixo: "PAR", exigeCarimbo: true, exigeAssinatura: true, workflowId: "wf-parecer-juridico" },
  { id: "dt-relatorio", nome: "Relatório", numeracaoPrefixo: "REL", exigeCarimbo: true, exigeAssinatura: true, workflowId: "wf-oficio-padrao" },
  { id: "dt-despacho", nome: "Despacho", numeracaoPrefixo: "DESP", exigeCarimbo: true, exigeAssinatura: true, workflowId: "wf-oficio-padrao" },
  { id: "dt-nota-servico", nome: "Nota de serviço", numeracaoPrefixo: "NS", exigeCarimbo: false, exigeAssinatura: false, workflowId: "wf-oficio-padrao" },
];
