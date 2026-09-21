import type { OrganizationalUnit, User } from "@/types";

export const organizationalUnits: OrganizationalUnit[] = [
  {
    id: "u-dg",
    nome: "TESTE DIRECCAO GERAL",
    sigla: "TDG",
    codigo: "01",
    tipo: "direccao",
    parentId: null,
    responsavelId: "usr-dionisio-inssica",
    contactos: { email: "direccao.teste@cfm.co.mz" },
    estado: "activo",
  },
  {
    id: "u-doc",
    nome: "TESTE DEPARTAMENTO",
    sigla: "TD",
    codigo: "01.1",
    tipo: "departamento",
    parentId: "u-dg",
    responsavelId: "usr-dionisio-inssica",
    contactos: { email: "departamento.teste@cfm.co.mz" },
    estado: "activo",
  },
];

export const users: User[] = [
  {
    id: "usr-dionisio-inssica",
    nome: "Dionisio Inssica",
    email: "dionisio.inssica@cfm.co.mz",
    cargo: "Administrador do Sistema",
    unidadeId: "u-dg",
    perfilIds: ["p-admin"],
    avatarColor: "graphite",
    estado: "activo",
  },
];

export const currentUser: User = users[0];

export function unitById(id: string) {
  return organizationalUnits.find((u) => u.id === id);
}

export function userById(id: string) {
  return users.find((u) => u.id === id);
}
