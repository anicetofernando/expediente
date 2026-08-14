import type { Notification, AuditEntry } from "@/types";

export const notifications: Notification[] = [
  { id: "n1", tipo: "aprovacao", titulo: "Aprovação pendente", descricao: "O processo CFM/DOC/2026/0412 aguarda o seu parecer há 6 dias.", data: "2026-07-25T07:30:00", lida: false, protocolo: "CFM/DOC/2026/0412", urgente: true },
  { id: "n2", tipo: "prazo", titulo: "Prazo a expirar", descricao: "O expediente CFM/DAP/2026/0455 expira em 5 dias.", data: "2026-07-25T06:00:00", lida: false, protocolo: "CFM/DAP/2026/0455" },
  { id: "n3", tipo: "tarefa", titulo: "Novo encaminhamento", descricao: "Recebeu um novo expediente encaminhado pela Secretaria Geral.", data: "2026-07-24T16:45:00", lida: false, protocolo: "CFM/DOF/2026/0522" },
  { id: "n4", tipo: "mencao", titulo: "Foi mencionado num comentário", descricao: "Carlos Machava mencionou-o no processo CFM/DMC/2026/0398.", data: "2026-07-22T09:10:00", lida: true, protocolo: "CFM/DMC/2026/0398" },
  { id: "n5", tipo: "sistema", titulo: "Manutenção programada", descricao: "O sistema estará indisponível a 28/07 entre as 22h00 e as 23h00 para manutenção.", data: "2026-07-21T12:00:00", lida: true },
  { id: "n6", tipo: "aprovacao", titulo: "Parecer solicitado", descricao: "Foi-lhe solicitado parecer técnico sobre o processo CFM/DJU/2026/0387.", data: "2026-07-21T13:15:00", lida: true, protocolo: "CFM/DJU/2026/0387" },
  { id: "n7", tipo: "prazo", titulo: "Processo atrasado", descricao: "O expediente CFM/DMC/2026/0398 ultrapassou o prazo definido.", data: "2026-07-22T09:00:00", lida: true, protocolo: "CFM/DMC/2026/0398", urgente: true },
];

export const auditEntries: AuditEntry[] = [
  { id: "a1", data: "2026-07-25T08:41:00", utilizador: "Armando Bila", accao: "Acesso autenticado", entidade: "Acesso", entidadeId: "access-8841", detalhes: "Autenticação por palavra-passe bem-sucedida.", ip: "196.28.10.44", resultado: "sucesso" },
  { id: "a2", data: "2026-07-24T11:32:00", utilizador: "Fátima Momade", accao: "Comentário adicionado", entidade: "Expediente", entidadeId: "CFM/DOC/2026/0412", detalhes: "Comentário interno adicionado ao processo.", ip: "196.28.10.51", resultado: "sucesso" },
  { id: "a3", data: "2026-07-23T14:10:00", utilizador: "Graça Muianga", accao: "Parecer solicitado", entidade: "Expediente", entidadeId: "CFM/DAP/2026/0455", detalhes: "Parecer orçamental solicitado à DFA.", ip: "196.28.10.22", resultado: "sucesso" },
  { id: "a4", data: "2026-07-22T09:05:00", utilizador: "Carlos Machava", accao: "Comentário adicionado", entidade: "Expediente", entidadeId: "CFM/DMC/2026/0398", detalhes: "Registo de escalonamento por atraso.", ip: "196.28.10.19", resultado: "sucesso" },
  { id: "a5", data: "2026-07-21T13:15:00", utilizador: "Noémia Machel", accao: "Expediente devolvido", entidade: "Expediente", entidadeId: "CFM/DJU/2026/0387", detalhes: "Devolvido para correcção de cláusula contratual.", ip: "196.28.10.33", resultado: "sucesso" },
  { id: "a6", data: "2026-07-20T18:02:00", utilizador: "Desconhecido", accao: "Tentativa de acesso", entidade: "Sessão", entidadeId: "sess-8790", detalhes: "3 tentativas de palavra-passe inválidas para o utilizador isabel.cuamba@cfm.co.mz.", ip: "154.66.201.12", resultado: "bloqueado" },
  { id: "a7", data: "2026-07-19T16:40:00", utilizador: "Amélia Nhaca", accao: "Expediente aprovado", entidade: "Expediente", entidadeId: "CFM/DIN/2026/0501", detalhes: "Aprovação final com assinatura digital.", ip: "196.28.10.10", resultado: "sucesso" },
  { id: "a8", data: "2026-07-18T10:06:00", utilizador: "Cremilda Nhantumbo", accao: "Carimbo aplicado", entidade: "Documento", entidadeId: "doc-1", detalhes: "Carimbo \"Protocolo Geral\" aplicado.", ip: "196.28.10.15", resultado: "sucesso" },
  { id: "a9", data: "2026-07-17T09:12:00", utilizador: "Isabel Cuamba", accao: "Exportação de relatório", entidade: "Relatório", entidadeId: "rel-produtividade-jun", detalhes: "Exportação em PDF do relatório de produtividade de Junho.", ip: "196.28.10.60", resultado: "sucesso" },
  { id: "a10", data: "2026-07-16T15:20:00", utilizador: "Ricardo Langa", accao: "Tentativa de acesso a expediente confidencial", entidade: "Expediente", entidadeId: "CFM/DRH/2026/0470", detalhes: "Acesso negado por falta de permissão de confidencialidade.", ip: "196.28.10.41", resultado: "bloqueado" },
];
