import type { PermissionModule } from "@/types";

export const permissionModules: PermissionModule[] = [
  {
    modulo: "Expedientes",
    permissoes: [
      { id: "expedientes.criar", label: "Criar expediente", descricao: "Iniciar novos processos de expediente." },
      { id: "expedientes.encaminhar", label: "Encaminhar", descricao: "Enviar o processo para outra unidade ou responsável." },
      { id: "expedientes.parecer", label: "Emitir parecer", descricao: "Registar parecer técnico sobre o processo." },
      { id: "expedientes.aprovar", label: "Aprovar / Rejeitar", descricao: "Tomar decisão final sobre o processo." },
      { id: "expedientes.devolver", label: "Devolver", descricao: "Devolver o processo para correcção." },
      { id: "expedientes.arquivar", label: "Arquivar", descricao: "Marcar o processo como concluído e arquivado." },
    ],
  },
  {
    modulo: "Documentos",
    permissoes: [
      { id: "documentos.anexar", label: "Anexar ficheiros", descricao: "Adicionar anexos a um processo." },
      { id: "documentos.imprimir", label: "Imprimir", descricao: "Imprimir documentos do sistema." },
      { id: "documentos.exportar", label: "Exportar", descricao: "Descarregar documentos originais ou carimbados." },
      { id: "documentos.modelos.gerir", label: "Gerir modelos", descricao: "Criar e editar modelos de documento." },
    ],
  },
  {
    modulo: "Secretaria",
    permissoes: [
      { id: "secretaria.receber", label: "Receber expediente", descricao: "Registar a recepção de documentos." },
      { id: "secretaria.protocolar", label: "Protocolar", descricao: "Atribuir número de protocolo e aplicar o carimbo/assinatura da unidade." },
      { id: "secretaria.encaminhar", label: "Encaminhar", descricao: "Distribuir processos às unidades responsáveis." },
      { id: "livro.gerir", label: "Gerir livro de expediente", descricao: "Consultar o livro digital de expediente." },
    ],
  },
  {
    modulo: "Carimbos e assinaturas",
    permissoes: [
      { id: "carimbos.aplicar", label: "Aplicar carimbo", descricao: "Utilizar carimbos autorizados em documentos." },
      { id: "carimbos.gerir", label: "Gerir carimbos", descricao: "Criar, editar e desactivar carimbos." },
      { id: "assinaturas.aplicar", label: "Aplicar assinatura", descricao: "Assinar digitalmente documentos." },
      { id: "assinaturas.gerir", label: "Gerir assinaturas", descricao: "Registar, revogar e substituir assinaturas." },
    ],
  },
  {
    modulo: "Relatórios e auditoria",
    permissoes: [
      { id: "relatorios.ver", label: "Ver relatórios", descricao: "Consultar relatórios estatísticos e de produtividade." },
      { id: "relatorios.exportar", label: "Exportar relatórios", descricao: "Exportar relatórios em PDF ou folha de cálculo." },
      { id: "auditoria.ver", label: "Ver auditoria", descricao: "Consultar o registo completo de auditoria do sistema." },
    ],
  },
  {
    modulo: "Administração",
    permissoes: [
      { id: "admin.utilizadores", label: "Gerir utilizadores", descricao: "Criar, editar e desactivar contas de utilizador." },
      { id: "admin.perfis", label: "Gerir perfis e permissões", descricao: "Definir perfis e a respectiva matriz de permissões." },
      { id: "admin.estrutura", label: "Gerir estrutura organizacional", descricao: "Criar e reorganizar unidades orgânicas." },
      { id: "admin.fluxos", label: "Gerir fluxos", descricao: "Criar e publicar fluxos de tramitação." },
      { id: "admin.configuracoes", label: "Gerir configurações do sistema", descricao: "Alterar parâmetros globais e identidade visual." },
    ],
  },
];
