import type { Expedient, ExpedientStatus, Priority, Confidentiality } from "@/types";

const TIPOS = [
  "Ofício",
  "Memorando",
  "Requisição",
  "Informação técnica",
  "Parecer",
  "Relatório",
  "Despacho",
  "Comunicação interna",
  "Nota de serviço",
];

// ---- Expedientes totalmente detalhados (usados na listagem e na página de detalhe) ----
export const expedients: Expedient[] = [
  {
    id: "exp-2026-0412",
    protocolo: "CFM/DOC/2026/0412",
    assunto: "Solicitação de autorização para intervenção técnica na via férrea entre Ressano Garcia e Moamba",
    tipo: "Ofício",
    descricao:
      "Solicita-se autorização para realização de trabalhos de substituição de travessas e alinhamento de via no troço compreendido entre o km 32 e o km 47, com necessidade de interrupção parcial de tráfego durante 3 dias.",
    estado: "em_analise",
    prioridade: "alta",
    confidencialidade: "interno",
    remetente: { nome: "José Cumbe", tipo: "interno", unidade: "Departamento de Manutenção de Via" },
    destinatario: "Direcção de Infra-estruturas",
    unidadeOrigem: "Departamento de Manutenção de Via",
    responsavelActual: "Fátima Momade",
    responsavelActualId: "usr-fatima-momade",
    dataEntrada: "2026-07-18T09:14:00",
    prazo: "2026-07-28T17:00:00",
    ultimaActualizacao: "2026-07-24T11:32:00",
    proximaEtapa: "Emissão de parecer técnico pela Direcção de Infra-estruturas",
    observacoes: "Coordenar com o Departamento de Operações para minimizar impacto na circulação de comboios de mercadorias.",
    atrasado: false,
    documentos: [
      { id: "doc-1", nome: "Ofício_412_2026.pdf", tipo: "principal", formato: "pdf", paginas: 3, tamanho: "842 KB", criadoEm: "2026-07-18T09:10:00", criadoPor: "José Cumbe", confidencialidade: "interno", carimbado: true, assinado: true, versao: 1, origem: "sistema" },
      { id: "doc-2", nome: "Planta_troço_km32-47.pdf", tipo: "anexo", formato: "pdf", paginas: 2, tamanho: "3.1 MB", criadoEm: "2026-07-18T09:12:00", criadoPor: "José Cumbe", confidencialidade: "interno", carimbado: false, assinado: false, versao: 1, origem: "importado" },
      { id: "doc-3", nome: "Cronograma_intervencao.docx", tipo: "anexo", formato: "docx", paginas: 1, tamanho: "128 KB", criadoEm: "2026-07-18T09:13:00", criadoPor: "José Cumbe", confidencialidade: "interno", carimbado: false, assinado: false, versao: 1, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Criado no sistema com documento principal e 2 anexos.", utilizador: "José Cumbe", unidade: "Departamento de Manutenção de Via", data: "2026-07-18T09:10:00" },
      { id: "t2", tipo: "submissao", titulo: "Submetido à secretaria", descricao: "Enviado para recepção e protocolo.", utilizador: "José Cumbe", unidade: "Departamento de Manutenção de Via", data: "2026-07-18T09:14:00" },
      { id: "t3", tipo: "recepcao", titulo: "Recebido pela secretaria", descricao: "Documento recepcionado e validado.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-18T10:02:00" },
      { id: "t4", tipo: "protocolo", titulo: "Protocolado", descricao: "Número de protocolo CFM/DOC/2026/0412 atribuído.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-18T10:05:00" },
      { id: "t5", tipo: "carimbo", titulo: "Carimbo de protocolo aplicado", descricao: "Carimbo \"Protocolo Geral\" aplicado ao documento principal.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-18T10:06:00" },
      { id: "t6", tipo: "encaminhamento", titulo: "Encaminhado", descricao: "Encaminhado à Direcção de Infra-estruturas para apreciação.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-18T10:20:00" },
      { id: "t7", tipo: "comentario", titulo: "Em análise técnica", descricao: "Processo em avaliação de impacto operacional.", utilizador: "Fátima Momade", unidade: "Direcção de Infra-estruturas", data: "2026-07-24T11:32:00" },
    ],
    comentarios: [
      { id: "c1", autor: "Fátima Momade", cargo: "Chefe do Departamento de Obras e Construção", data: "2026-07-24T11:32:00", texto: "A solicitar disponibilidade ao Departamento de Operações antes de emitir parecer final.", interno: true },
    ],
    processosRelacionados: [{ protocolo: "CFM/DOF/2026/0389", assunto: "Plano de circulação — troço Ressano Garcia" }],
  },
  {
    id: "exp-2026-0455",
    protocolo: "CFM/DAP/2026/0455",
    assunto: "Pedido de aquisição de materiais eléctricos para sinalização ferroviária",
    tipo: "Requisição",
    descricao: "Requisição de cabos, relés e lâmpadas de sinalização para reposição de stock de segurança da Secção de Sinalização.",
    estado: "aguardando_parecer",
    prioridade: "normal",
    confidencialidade: "interno",
    remetente: { nome: "Ricardo Langa", tipo: "interno", unidade: "Departamento de Sinalização e Telecomunicações" },
    destinatario: "Departamento de Aprovisionamento",
    unidadeOrigem: "Departamento de Sinalização e Telecomunicações",
    responsavelActual: "Graça Muianga",
    responsavelActualId: "usr-graca-muianga",
    dataEntrada: "2026-07-20T08:30:00",
    prazo: "2026-07-30T17:00:00",
    ultimaActualizacao: "2026-07-23T14:10:00",
    proximaEtapa: "Parecer orçamental da Direcção Financeira",
    atrasado: false,
    documentos: [
      { id: "doc-4", nome: "Requisicao_455_2026.pdf", tipo: "principal", formato: "pdf", paginas: 2, tamanho: "410 KB", criadoEm: "2026-07-20T08:28:00", criadoPor: "Ricardo Langa", confidencialidade: "interno", carimbado: true, assinado: true, versao: 1, origem: "sistema" },
      { id: "doc-5", nome: "Lista_materiais.xlsx.pdf", tipo: "anexo", formato: "pdf", paginas: 1, tamanho: "96 KB", criadoEm: "2026-07-20T08:29:00", criadoPor: "Ricardo Langa", confidencialidade: "interno", carimbado: false, assinado: false, versao: 1, origem: "importado" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Criado com requisição e lista de materiais.", utilizador: "Ricardo Langa", unidade: "Departamento de Sinalização e Telecomunicações", data: "2026-07-20T08:28:00" },
      { id: "t2", tipo: "protocolo", titulo: "Protocolado", descricao: "Protocolo CFM/DAP/2026/0455 atribuído.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-20T09:15:00" },
      { id: "t3", tipo: "encaminhamento", titulo: "Encaminhado", descricao: "Encaminhado ao Departamento de Aprovisionamento.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-20T09:20:00" },
      { id: "t4", tipo: "parecer", titulo: "Parecer solicitado", descricao: "Solicitado parecer orçamental à Direcção Financeira e Administrativa.", utilizador: "Graça Muianga", unidade: "Departamento de Aprovisionamento", data: "2026-07-23T14:10:00" },
    ],
    comentarios: [],
  },
  {
    id: "exp-2026-0398",
    protocolo: "CFM/DMC/2026/0398",
    assunto: "Informação sobre avaria de equipamento de manobra na Estação de Machava",
    tipo: "Informação técnica",
    descricao: "Reporte técnico de avaria no motor de agulha nº 4 da Estação de Machava, com impacto nas manobras de composições de mercadorias.",
    estado: "atrasado",
    prioridade: "urgente",
    confidencialidade: "interno",
    remetente: { nome: "António Sitoe", tipo: "interno", unidade: "Departamento de Material Circulante" },
    destinatario: "Direcção de Operações Ferroviárias",
    unidadeOrigem: "Departamento de Material Circulante",
    responsavelActual: "Carlos Machava",
    responsavelActualId: "usr-carlos-machava",
    dataEntrada: "2026-07-15T07:45:00",
    prazo: "2026-07-19T17:00:00",
    ultimaActualizacao: "2026-07-22T09:00:00",
    proximaEtapa: "Aprovação de intervenção correctiva urgente",
    observacoes: "Prazo ultrapassado — impacto directo na operação. Requer escalonamento.",
    atrasado: true,
    documentos: [
      { id: "doc-6", nome: "Informacao_avaria_398.pdf", tipo: "principal", formato: "pdf", paginas: 2, tamanho: "560 KB", criadoEm: "2026-07-15T07:40:00", criadoPor: "António Sitoe", confidencialidade: "interno", carimbado: true, assinado: true, versao: 1, origem: "sistema" },
      { id: "doc-7", nome: "Fotos_motor_agulha4.pdf", tipo: "anexo", formato: "pdf", paginas: 4, tamanho: "2.4 MB", criadoEm: "2026-07-15T07:42:00", criadoPor: "António Sitoe", confidencialidade: "interno", carimbado: false, assinado: false, versao: 1, origem: "digitalizado" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Reporte técnico registado com carácter urgente.", utilizador: "António Sitoe", unidade: "Departamento de Material Circulante", data: "2026-07-15T07:40:00" },
      { id: "t2", tipo: "protocolo", titulo: "Protocolado", descricao: "Protocolo CFM/DMC/2026/0398 atribuído com prioridade urgente.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-15T08:10:00" },
      { id: "t3", tipo: "encaminhamento", titulo: "Encaminhado", descricao: "Encaminhado à Direcção de Operações Ferroviárias.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-15T08:15:00" },
      { id: "t4", tipo: "comentario", titulo: "Prazo ultrapassado", descricao: "Sistema assinalou atraso face ao prazo definido.", utilizador: "Sistema", unidade: "—", data: "2026-07-22T09:00:00" },
    ],
    comentarios: [
      { id: "c1", autor: "Carlos Machava", cargo: "Director de Operações Ferroviárias", data: "2026-07-22T09:05:00", texto: "A aguardar orçamento de peça sobressalente junto do fornecedor. Escalar para reunião de direcção.", interno: true },
    ],
  },
  {
    id: "exp-2026-0501",
    protocolo: "CFM/DIN/2026/0501",
    assunto: "Encaminhamento de relatório de manutenção preventiva de locomotivas diesel-eléctricas",
    tipo: "Relatório",
    descricao: "Relatório trimestral de manutenção preventiva da frota de locomotivas diesel-eléctricas em serviço no corredor de Maputo.",
    estado: "aprovado",
    prioridade: "normal",
    confidencialidade: "interno",
    remetente: { nome: "António Sitoe", tipo: "interno", unidade: "Departamento de Material Circulante" },
    destinatario: "Direcção-Geral",
    unidadeOrigem: "Departamento de Material Circulante",
    responsavelActual: "Amélia Nhaca",
    responsavelActualId: "usr-amelia-nhaca",
    dataEntrada: "2026-07-10T10:00:00",
    prazo: "2026-07-20T17:00:00",
    ultimaActualizacao: "2026-07-19T16:40:00",
    proximaEtapa: "Arquivo do processo",
    atrasado: false,
    documentos: [
      { id: "doc-8", nome: "Relatorio_manutencao_T2.pdf", tipo: "principal", formato: "pdf", paginas: 12, tamanho: "4.6 MB", criadoEm: "2026-07-10T09:55:00", criadoPor: "António Sitoe", confidencialidade: "interno", carimbado: true, assinado: true, versao: 2, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Relatório submetido para apreciação da Direcção-Geral.", utilizador: "António Sitoe", unidade: "Departamento de Material Circulante", data: "2026-07-10T09:55:00" },
      { id: "t2", tipo: "protocolo", titulo: "Protocolado", descricao: "Protocolo CFM/DIN/2026/0501 atribuído.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-10T11:00:00" },
      { id: "t3", tipo: "aprovacao", titulo: "Aprovado", descricao: "Relatório aprovado sem reservas.", utilizador: "Amélia Nhaca", unidade: "Direcção Geral", data: "2026-07-19T16:40:00" },
    ],
    comentarios: [],
  },
  {
    id: "exp-2026-0387",
    protocolo: "CFM/DJU/2026/0387",
    assunto: "Solicitação de parecer jurídico sobre contrato de fornecimento de combustível",
    tipo: "Parecer",
    descricao: "Pedido de parecer jurídico sobre minuta de contrato plurianual de fornecimento de gasóleo para locomotivas.",
    estado: "devolvido",
    prioridade: "alta",
    confidencialidade: "restrito",
    remetente: { nome: "Graça Muianga", tipo: "interno", unidade: "Departamento de Aprovisionamento" },
    destinatario: "Direcção Jurídica",
    unidadeOrigem: "Departamento de Aprovisionamento",
    responsavelActual: "Graça Muianga",
    responsavelActualId: "usr-graca-muianga",
    dataEntrada: "2026-07-08T08:00:00",
    prazo: "2026-07-22T17:00:00",
    ultimaActualizacao: "2026-07-21T13:15:00",
    proximaEtapa: "Correcção da minuta contratual e reenvio",
    observacoes: "Devolvido para inclusão de cláusula de revisão de preços em falta.",
    atrasado: false,
    documentos: [
      { id: "doc-9", nome: "Minuta_contrato_combustivel.pdf", tipo: "principal", formato: "pdf", paginas: 18, tamanho: "1.2 MB", criadoEm: "2026-07-08T07:55:00", criadoPor: "Graça Muianga", confidencialidade: "restrito", carimbado: false, assinado: false, versao: 3, origem: "importado" },
      { id: "doc-10", nome: "Parecer_juridico_preliminar.pdf", tipo: "parecer", formato: "pdf", paginas: 3, tamanho: "310 KB", criadoEm: "2026-07-21T13:10:00", criadoPor: "Noémia Machel", confidencialidade: "restrito", carimbado: true, assinado: true, versao: 1, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Minuta contratual submetida para parecer jurídico.", utilizador: "Graça Muianga", unidade: "Departamento de Aprovisionamento", data: "2026-07-08T07:55:00" },
      { id: "t2", tipo: "encaminhamento", titulo: "Encaminhado", descricao: "Encaminhado à Direcção Jurídica.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-08T09:30:00" },
      { id: "t3", tipo: "parecer", titulo: "Parecer emitido", descricao: "Parecer preliminar emitido com ressalvas.", utilizador: "Noémia Machel", unidade: "Direcção Jurídica", data: "2026-07-21T13:10:00" },
      { id: "t4", tipo: "devolucao", titulo: "Devolvido para correcção", descricao: "Devolvido ao Departamento de Aprovisionamento para ajuste de cláusula.", utilizador: "Noémia Machel", unidade: "Direcção Jurídica", data: "2026-07-21T13:15:00" },
    ],
    comentarios: [
      { id: "c1", autor: "Noémia Machel", cargo: "Directora Jurídica", data: "2026-07-21T13:14:00", texto: "Falta cláusula de revisão de preços indexada à cotação internacional. Favor corrigir e reenviar.", interno: true },
    ],
  },
  {
    id: "exp-2026-0470",
    protocolo: "CFM/DRH/2026/0470",
    assunto: "Pedido de transferência de funcionário entre departamentos",
    tipo: "Memorando",
    descricao: "Pedido de transferência do técnico Ricardo Langa do Departamento de Sinalização para o Departamento de Manutenção de Via.",
    estado: "aguardando_esclarecimento",
    prioridade: "baixa",
    confidencialidade: "confidencial",
    remetente: { nome: "Lídia Chissano", tipo: "interno", unidade: "Direcção de Recursos Humanos" },
    destinatario: "Direcção de Operações Ferroviárias",
    unidadeOrigem: "Direcção de Recursos Humanos",
    responsavelActual: "Carlos Machava",
    responsavelActualId: "usr-carlos-machava",
    dataEntrada: "2026-07-19T11:20:00",
    prazo: "2026-08-02T17:00:00",
    ultimaActualizacao: "2026-07-23T10:05:00",
    proximaEtapa: "Aguardar confirmação de vaga disponível",
    atrasado: false,
    documentos: [
      { id: "doc-11", nome: "Memorando_transferencia_470.pdf", tipo: "principal", formato: "pdf", paginas: 1, tamanho: "180 KB", criadoEm: "2026-07-19T11:15:00", criadoPor: "Lídia Chissano", confidencialidade: "confidencial", carimbado: true, assinado: true, versao: 1, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Memorando de transferência submetido.", utilizador: "Lídia Chissano", unidade: "Direcção de Recursos Humanos", data: "2026-07-19T11:15:00" },
      { id: "t2", tipo: "encaminhamento", titulo: "Encaminhado", descricao: "Encaminhado à Direcção de Operações Ferroviárias.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-19T12:00:00" },
      { id: "t3", tipo: "comentario", titulo: "Esclarecimento solicitado", descricao: "Solicitado esclarecimento sobre disponibilidade de vaga na unidade de destino.", utilizador: "Carlos Machava", unidade: "Direcção de Operações Ferroviárias", data: "2026-07-23T10:05:00" },
    ],
    comentarios: [],
  },
  {
    id: "exp-2026-0522",
    protocolo: "CFM/DOF/2026/0522",
    assunto: "Aprovação de trabalhos extraordinários no pátio de manobras do Porto da Beira",
    tipo: "Despacho",
    descricao: "Pedido de autorização para realização de turnos extraordinários durante o pico de exportação de carvão mineral.",
    estado: "aguardando_parecer",
    prioridade: "alta",
    confidencialidade: "interno",
    remetente: { nome: "Carlos Machava", tipo: "interno", unidade: "Direcção de Operações Ferroviárias" },
    destinatario: "Direcção Financeira e Administrativa",
    unidadeOrigem: "Direcção de Operações Ferroviárias",
    responsavelActual: "Armando Bila",
    responsavelActualId: "usr-armando-bila",
    dataEntrada: "2026-07-21T09:00:00",
    prazo: "2026-07-27T17:00:00",
    ultimaActualizacao: "2026-07-24T08:50:00",
    proximaEtapa: "Parecer orçamental sobre encargo de horas extraordinárias",
    atrasado: false,
    documentos: [
      { id: "doc-12", nome: "Despacho_522_2026.pdf", tipo: "principal", formato: "pdf", paginas: 2, tamanho: "300 KB", criadoEm: "2026-07-21T08:55:00", criadoPor: "Carlos Machava", confidencialidade: "interno", carimbado: true, assinado: true, versao: 1, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Pedido de autorização submetido.", utilizador: "Carlos Machava", unidade: "Direcção de Operações Ferroviárias", data: "2026-07-21T08:55:00" },
      { id: "t2", tipo: "encaminhamento", titulo: "Encaminhado", descricao: "Encaminhado à Direcção Financeira e Administrativa.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-21T09:40:00" },
    ],
    comentarios: [],
  },
  {
    id: "exp-2026-0330",
    protocolo: "CFM/SG/2026/0330",
    assunto: "Pedido de credenciais de acesso ao sistema de gestão de expediente",
    tipo: "Nota de serviço",
    descricao: "Solicitação de criação de conta de acesso para novo colaborador do Departamento de Sinalização e Telecomunicações.",
    estado: "arquivado",
    prioridade: "baixa",
    confidencialidade: "interno",
    remetente: { nome: "Ricardo Langa", tipo: "interno", unidade: "Departamento de Sinalização e Telecomunicações" },
    destinatario: "Secretaria Geral",
    unidadeOrigem: "Departamento de Sinalização e Telecomunicações",
    responsavelActual: "Cremilda Nhantumbo",
    responsavelActualId: "usr-cremilda-nhantumbo",
    dataEntrada: "2026-06-30T09:00:00",
    prazo: "2026-07-05T17:00:00",
    ultimaActualizacao: "2026-07-05T15:00:00",
    proximaEtapa: "—",
    atrasado: false,
    documentos: [
      { id: "doc-13", nome: "Pedido_credenciais_330.pdf", tipo: "principal", formato: "pdf", paginas: 1, tamanho: "120 KB", criadoEm: "2026-06-30T08:58:00", criadoPor: "Ricardo Langa", confidencialidade: "interno", carimbado: true, assinado: false, versao: 1, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Pedido submetido.", utilizador: "Ricardo Langa", unidade: "Departamento de Sinalização e Telecomunicações", data: "2026-06-30T08:58:00" },
      { id: "t2", tipo: "aprovacao", titulo: "Aprovado", descricao: "Conta de acesso criada.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-05T14:30:00" },
      { id: "t3", tipo: "arquivo", titulo: "Arquivado", descricao: "Processo concluído e arquivado digitalmente.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-05T15:00:00" },
    ],
    comentarios: [],
  },
  {
    id: "exp-2026-0545",
    protocolo: "CFM/DOC/2026/0545",
    assunto: "Pedido de abertura de concurso público para obras de reabilitação de linha",
    tipo: "Ofício",
    descricao: "Proposta de abertura de concurso público internacional para reabilitação de 24 km de via entre Chimoio e Dondo.",
    estado: "rascunho",
    prioridade: "alta",
    confidencialidade: "interno",
    remetente: { nome: "Fátima Momade", tipo: "interno", unidade: "Departamento de Obras e Construção" },
    destinatario: "Direcção-Geral",
    unidadeOrigem: "Departamento de Obras e Construção",
    responsavelActual: "Fátima Momade",
    responsavelActualId: "usr-fatima-momade",
    dataEntrada: "2026-07-25T08:00:00",
    prazo: "2026-08-15T17:00:00",
    ultimaActualizacao: "2026-07-25T08:40:00",
    proximaEtapa: "Concluir redacção e submeter à secretaria",
    atrasado: false,
    documentos: [
      { id: "doc-14", nome: "Proposta_concurso_reabilitacao.pdf", tipo: "principal", formato: "pdf", paginas: 6, tamanho: "1.1 MB", criadoEm: "2026-07-25T08:00:00", criadoPor: "Fátima Momade", confidencialidade: "interno", carimbado: false, assinado: false, versao: 1, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Rascunho criado", descricao: "Documento em elaboração.", utilizador: "Fátima Momade", unidade: "Departamento de Obras e Construção", data: "2026-07-25T08:00:00" },
    ],
    comentarios: [],
  },
  {
    id: "exp-2026-0299",
    protocolo: "CFM/DMV/2026/0299",
    assunto: "Comunicação de acidente de trabalho na oficina de Machava",
    tipo: "Comunicação interna",
    descricao: "Comunicação formal de acidente de trabalho ligeiro ocorrido na oficina de manutenção de via em Machava.",
    estado: "recebimento_confirmado",
    prioridade: "urgente",
    confidencialidade: "confidencial",
    remetente: { nome: "José Cumbe", tipo: "interno", unidade: "Departamento de Manutenção de Via" },
    destinatario: "Direcção de Recursos Humanos",
    unidadeOrigem: "Departamento de Manutenção de Via",
    responsavelActual: "Lídia Chissano",
    responsavelActualId: "usr-lidia-chissano",
    dataEntrada: "2026-06-22T10:15:00",
    prazo: "2026-06-24T17:00:00",
    ultimaActualizacao: "2026-06-24T16:00:00",
    proximaEtapa: "—",
    atrasado: false,
    documentos: [
      { id: "doc-15", nome: "Comunicacao_acidente_299.pdf", tipo: "principal", formato: "pdf", paginas: 2, tamanho: "290 KB", criadoEm: "2026-06-22T10:10:00", criadoPor: "José Cumbe", confidencialidade: "confidencial", carimbado: true, assinado: true, versao: 1, origem: "sistema" },
    ],
    timeline: [
      { id: "t1", tipo: "criacao", titulo: "Expediente criado", descricao: "Comunicação registada com carácter urgente.", utilizador: "José Cumbe", unidade: "Departamento de Manutenção de Via", data: "2026-06-22T10:10:00" },
      { id: "t2", tipo: "encaminhamento", titulo: "Encaminhado", descricao: "Encaminhado à Direcção de Recursos Humanos.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-06-22T11:00:00" },
      { id: "t3", tipo: "entrega", titulo: "Resposta disponibilizada", descricao: "Nota de acompanhamento disponibilizada ao remetente.", utilizador: "Lídia Chissano", unidade: "Direcção de Recursos Humanos", data: "2026-06-24T15:30:00" },
      { id: "t4", tipo: "confirmacao", titulo: "Recebimento confirmado", descricao: "Remetente confirmou recepção da resposta.", utilizador: "José Cumbe", unidade: "Departamento de Manutenção de Via", data: "2026-06-24T16:00:00" },
    ],
    comentarios: [],
  },
  {
    id: "exp-2026-0480",
    protocolo: "CFM/DAP/2026/0480",
    assunto: "Encaminhamento de proposta de fornecedor para material de via",
    tipo: "Ofício",
    descricao: "Proposta comercial da Electro Ferroviária, Lda para fornecimento de fixações elásticas e placas de assentamento.",
    estado: "rejeitado",
    prioridade: "normal",
    confidencialidade: "interno",
    remetente: { nome: "Electro Ferroviária, Lda", tipo: "externo", contacto: "geral@electroferroviaria.co.mz" },
    destinatario: "Departamento de Aprovisionamento",
    unidadeOrigem: "Externo",
    responsavelActual: "Graça Muianga",
    responsavelActualId: "usr-graca-muianga",
    dataEntrada: "2026-07-05T14:00:00",
    prazo: "2026-07-15T17:00:00",
    ultimaActualizacao: "2026-07-14T09:30:00",
    proximaEtapa: "—",
    observacoes: "Proposta rejeitada por incumprimento das especificações técnicas exigidas no caderno de encargos.",
    atrasado: false,
    documentos: [
      { id: "doc-16", nome: "Proposta_comercial_EF.pdf", tipo: "principal", formato: "pdf", paginas: 8, tamanho: "2.0 MB", criadoEm: "2026-07-05T13:55:00", criadoPor: "—", confidencialidade: "interno", carimbado: true, assinado: false, versao: 1, origem: "digitalizado" },
    ],
    timeline: [
      { id: "t1", tipo: "recepcao", titulo: "Recebido", descricao: "Proposta comercial recepcionada por via física e digitalizada.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-05T13:55:00" },
      { id: "t2", tipo: "protocolo", titulo: "Protocolado", descricao: "Protocolo CFM/DAP/2026/0480 atribuído.", utilizador: "Cremilda Nhantumbo", unidade: "Secretaria Geral", data: "2026-07-05T14:10:00" },
      { id: "t3", tipo: "rejeicao", titulo: "Rejeitado", descricao: "Proposta não cumpre especificações técnicas do caderno de encargos.", utilizador: "Graça Muianga", unidade: "Departamento de Aprovisionamento", data: "2026-07-14T09:30:00" },
    ],
    comentarios: [],
  },
];

// ---- Geração de expedientes adicionais para volume realista nas listagens ----
const ASSUNTOS_EXTRA = [
  "Pedido de aquisição de equipamento de protecção individual",
  "Solicitação de parecer técnico sobre substituição de travessas de madeira",
  "Pedido de autorização para viagem de serviço a Nampula",
  "Solicitação de reparação urgente de sistema de sinalização luminosa",
  "Pedido de esclarecimento sobre factura de fornecimento de energia",
  "Relatório mensal de produtividade do Departamento de Manutenção de Via",
  "Pedido de aquisição de peças sobressalentes para locomotivas diesel-eléctricas",
  "Solicitação de parecer técnico sobre projecto de electrificação do troço Matola-Ressano Garcia",
  "Pedido de renovação de contrato de manutenção de sistemas informáticos",
  "Comunicação de não conformidade em auditoria interna de segurança",
  "Encaminhamento de parecer da Direcção Jurídica sobre litígio contratual",
  "Solicitação de autorização para despesa extraordinária de manutenção",
  "Relatório de avaria em sistema de travagem de composição",
  "Pedido de participação em formação técnica sobre sinalização ferroviária",
  "Solicitação de inspecção técnica à linha Nacala-Cuamba",
  "Pedido de substituição de chefia durante período de férias",
  "Informação sobre resultado de auditoria a armazém de Matola-Gare",
  "Pedido de parecer sobre revisão do regulamento interno de segurança ferroviária",
  "Solicitação de autorização para publicação de aviso de concurso",
  "Encaminhamento de relatório de sinistro em passagem de nível",
  "Pedido de actualização de inventário de material circulante",
  "Solicitação de parecer sobre proposta de tarifário de transporte de carga",
  "Pedido de autorização para abate de material circulante obsoleto",
  "Relatório de desempenho do corredor de Nacala — 1º semestre",
  "Solicitação de reforço de efectivos para campanha de manutenção de Verão",
];

const UNIDADES = [
  "Departamento de Manutenção de Via",
  "Departamento de Material Circulante",
  "Departamento de Obras e Construção",
  "Departamento de Sinalização e Telecomunicações",
  "Direcção de Recursos Humanos",
  "Departamento de Aprovisionamento",
  "Secretaria Geral",
  "Direcção Jurídica",
  "Direcção Financeira e Administrativa",
];

const REMETENTES = [
  "José Cumbe", "Felismina Tembe", "António Sitoe", "Ricardo Langa", "Fátima Momade",
  "Lídia Chissano", "Graça Muianga", "Cremilda Nhantumbo", "Noémia Machel", "Isabel Cuamba",
];

const RESPONSAVEIS: { nome: string; id: string }[] = [
  { nome: "Fátima Momade", id: "usr-fatima-momade" },
  { nome: "Carlos Machava", id: "usr-carlos-machava" },
  { nome: "Graça Muianga", id: "usr-graca-muianga" },
  { nome: "Amélia Nhaca", id: "usr-amelia-nhaca" },
  { nome: "Armando Bila", id: "usr-armando-bila" },
  { nome: "Noémia Machel", id: "usr-noemia-machel" },
  { nome: "Lídia Chissano", id: "usr-lidia-chissano" },
];

const ESTADOS: ExpedientStatus[] = [
  "submetido", "recebido", "protocolado", "encaminhado", "em_analise",
  "aguardando_parecer", "aguardando_esclarecimento", "devolvido", "aprovado",
  "disponivel_remetente", "arquivado", "suspenso",
];

const PRIORIDADES: Priority[] = ["baixa", "normal", "normal", "alta", "urgente"];
const CONFIDENCIALIDADES: Confidentiality[] = ["publico", "interno", "interno", "interno", "restrito", "confidencial"];

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(pseudoRandom(seed) * arr.length)];
}

function generateExtra(count: number): Expedient[] {
  const out: Expedient[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 17.31 + 3;
    const numero = 100 + i * 3 + Math.floor(pseudoRandom(seed) * 20);
    const unidade = pick(UNIDADES, seed + 1);
    const sigla = organizationalSigla(unidade);
    const estado = pick(ESTADOS, seed + 2);
    const prioridade = pick(PRIORIDADES, seed + 3);
    const confidencialidade = pick(CONFIDENCIALIDADES, seed + 4);
    const responsavel = pick(RESPONSAVEIS, seed + 5);
    const diasEntrada = Math.floor(pseudoRandom(seed + 6) * 40) + 1;
    const dataEntrada = new Date(2026, 6, 25 - diasEntrada, 8 + Math.floor(pseudoRandom(seed + 7) * 9), Math.floor(pseudoRandom(seed + 8) * 60));
    const prazoDias = Math.floor(pseudoRandom(seed + 9) * 20) + 3;
    const prazo = new Date(dataEntrada.getTime() + prazoDias * 86400000);
    const atrasado = prazo.getTime() < new Date(2026, 6, 25).getTime() && !["arquivado", "aprovado", "recebimento_confirmado", "cancelado"].includes(estado);
    const tipo = pick(TIPOS, seed + 10);
    const assunto = pick(ASSUNTOS_EXTRA, seed + 11);
    const remetenteNome = pick(REMETENTES, seed + 12);

    out.push({
      id: `exp-2026-gen-${i}`,
      protocolo: `CFM/${sigla}/2026/${String(numero).padStart(4, "0")}`,
      assunto,
      tipo,
      descricao: `${assunto}. Processo em tramitação regular conforme fluxo definido para ${tipo.toLowerCase()}s.`,
      estado: atrasado ? "atrasado" : estado,
      prioridade,
      confidencialidade,
      remetente: { nome: remetenteNome, tipo: "interno", unidade },
      destinatario: pick(UNIDADES, seed + 13),
      unidadeOrigem: unidade,
      responsavelActual: responsavel.nome,
      responsavelActualId: responsavel.id,
      dataEntrada: dataEntrada.toISOString(),
      prazo: prazo.toISOString(),
      ultimaActualizacao: new Date(dataEntrada.getTime() + Math.floor(pseudoRandom(seed + 14) * prazoDias) * 86400000).toISOString(),
      proximaEtapa: "Aguarda acção do responsável actual",
      atrasado,
      documentos: [
        { id: `doc-gen-${i}`, nome: `Documento_${numero}.pdf`, tipo: "principal", formato: "pdf", paginas: 1 + Math.floor(pseudoRandom(seed + 15) * 6), tamanho: `${(200 + pseudoRandom(seed + 16) * 2000).toFixed(0)} KB`, criadoEm: dataEntrada.toISOString(), criadoPor: remetenteNome, confidencialidade, carimbado: pseudoRandom(seed + 17) > 0.4, assinado: pseudoRandom(seed + 18) > 0.5, versao: 1, origem: pick(["sistema", "importado", "digitalizado"] as const, seed + 19) },
      ],
      timeline: [
        { id: `t-gen-${i}-1`, tipo: "criacao", titulo: "Expediente criado", descricao: "Expediente registado no sistema.", utilizador: remetenteNome, unidade, data: dataEntrada.toISOString() },
      ],
      comentarios: [],
    });
  }
  return out;
}

function organizationalSigla(unidade: string): string {
  const map: Record<string, string> = {
    "Departamento de Manutenção de Via": "DMV",
    "Departamento de Material Circulante": "DMC",
    "Departamento de Obras e Construção": "DOC",
    "Departamento de Sinalização e Telecomunicações": "DST",
    "Direcção de Recursos Humanos": "DRH",
    "Departamento de Aprovisionamento": "DAP",
    "Secretaria Geral": "SG",
    "Direcção Jurídica": "DJU",
    "Direcção Financeira e Administrativa": "DFA",
    "Direcção de Operações Ferroviárias": "DOF",
    "Direcção de Infra-estruturas": "DIN",
    "Direcção-Geral": "DG",
  };
  return map[unidade] ?? "SG";
}

export const allExpedients: Expedient[] = [...expedients, ...generateExtra(46)];

export function expedientById(id: string): Expedient | undefined {
  return allExpedients.find((e) => e.id === id);
}

export function expedientByProtocolo(protocolo: string): Expedient | undefined {
  return allExpedients.find((e) => e.protocolo === protocolo);
}
