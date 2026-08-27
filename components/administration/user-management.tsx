"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, MoreVertical, KeyRound, Pencil, Ban, CheckCircle2, Trash2, Users } from "lucide-react";
import type { OrganizationalUnit, Profile, User } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { UserFormDialog, type UserFormValues } from "@/components/administration/user-form-dialog";

function nivelVariant(nivel: Profile["nivel"]): "neutral" | "info" | "navy" | "crimson" {
  switch (nivel) {
    case "operacional": return "neutral";
    case "supervisao": return "info";
    case "direccao": return "navy";
    case "administracao": return "crimson";
  }
}

function estadoVariant(estado: User["estado"]): "success" | "neutral" | "amber" {
  if (estado === "activo") return "success";
  if (estado === "suspenso") return "amber";
  return "neutral";
}

export function UserManagement({
  initialUsers,
  units,
  profiles,
}: {
  initialUsers: User[];
  units: OrganizationalUnit[];
  profiles: Profile[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [search, setSearch] = React.useState("");
  const [unidadeFilter, setUnidadeFilter] = React.useState("todas");
  const [perfilFilter, setPerfilFilter] = React.useState("todos");
  const [estadoFilter, setEstadoFilter] = React.useState("todos");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<User | null>(null);

  const profileById = React.useCallback((id: string) => profiles.find((p) => p.id === id), [profiles]);

  const filtered = React.useMemo(() => {
    let list = users;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.cargo.toLowerCase().includes(q)
      );
    }
    if (unidadeFilter !== "todas") list = list.filter((u) => u.unidadeId === unidadeFilter);
    if (perfilFilter !== "todos") list = list.filter((u) => u.perfilIds.includes(perfilFilter));
    if (estadoFilter !== "todos") list = list.filter((u) => u.estado === estadoFilter);
    return list;
  }, [users, search, unidadeFilter, perfilFilter, estadoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const stats = React.useMemo(() => {
    const activos = users.filter((u) => u.estado === "activo").length;
    const inactivosOuSuspensos = users.filter((u) => u.estado !== "activo").length;
    const perfisDistintos = new Set(users.flatMap((u) => u.perfilIds)).size;
    return { total: users.length, activos, inactivosOuSuspensos, perfisDistintos };
  }, [users]);

  async function handleCreate(values: UserFormValues) {
    try {
      const response=await fetch("/api/users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(values)});const result=await response.json();if(!response.ok)throw new Error(result.error??"Não foi possível criar o utilizador.");
      setUsers((prev) => [result.user, ...prev]);
      setCreateOpen(false);
      toast({ title: "Utilizador criado", description: `A conta de ${result.user.nome} foi criada com palavra-passe temporária.`, variant: "success" });
    } catch(error) { toast({title:"Utilizador não criado",description:error instanceof Error?error.message:"Erro inesperado.",variant:"destructive"}); }
  }

  async function handleEdit(values: UserFormValues) {
    if (!editingUser) return;
    const response=await fetch(`/api/users/${editingUser.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(values)});const result=await response.json();if(!response.ok){toast({title:"Alterações não guardadas",description:result.error,variant:"destructive"});return;}
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, nome: values.nome, email: values.email, cargo: values.cargo, unidadeId: values.unidadeId, perfilIds: [values.perfilId], estado: values.estado, telefone: values.telefone || undefined }
          : u
      )
    );
    toast({ title: "Utilizador actualizado", description: `Os dados de ${values.nome} foram guardados.`, variant: "success" });
    setEditingUser(null);
  }

  async function handleResetPassword(u: User) {
    const response=await fetch(`/api/users/${u.id}/reset-password`,{method:"POST"});const result=await response.json();
    toast(response.ok?{ title: "Palavra-passe redefinida", description: `${u.nome} deverá alterar a palavra-passe temporária no próximo acesso.`,variant:"success" }:{title:"Redefinição falhou",description:result.error,variant:"destructive"});
  }

  async function handleActivate(u: User) {
    const response=await fetch(`/api/users/${u.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({estado:"activo"})});if(!response.ok){const result=await response.json();toast({title:"Activação falhou",description:result.error,variant:"destructive"});return;}
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, estado: "activo" } : x)));
    toast({ title: "Utilizador activado", description: `${u.nome} pode agora aceder ao sistema.`, variant: "success" });
  }

  async function handleDeactivateConfirmed() {
    if (!deactivateTarget) return;
    const response=await fetch(`/api/users/${deactivateTarget.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({estado:"inactivo"})});if(!response.ok){const result=await response.json();toast({title:"Desactivação falhou",description:result.error,variant:"destructive"});return;}
    setUsers((prev) => prev.map((x) => (x.id === deactivateTarget.id ? { ...x, estado: "inactivo" } : x)));
    toast({ title: "Utilizador desactivado", description: `${deactivateTarget.nome} perdeu o acesso ao sistema.`, variant: "warning" });
    setDeactivateTarget(null);
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const response = await fetch(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { toast({ title: "Eliminação falhou", description: result.error, variant: "destructive" }); setDeleteTarget(null); return; }
    setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id));
    toast({ title: "Utilizador eliminado", description: `${deleteTarget.nome} foi removido do sistema.`, variant: "success" });
    setDeleteTarget(null);
  }

  const activeFilterCount = (unidadeFilter !== "todas" ? 1 : 0) + (perfilFilter !== "todos" ? 1 : 0) + (estadoFilter !== "todos" ? 1 : 0);

  return (
    <div>
      <PageHeader
        title="Utilizadores"
        description="Gestão de contas de acesso, unidades orgânicas e perfis atribuídos."
        breadcrumb={[{ label: "Administração" }, { label: "Utilizadores" }]}
        actions={
          <Button onClick={() => { router.refresh(); setCreateOpen(true); }}>
            <UserPlus className="size-4" /> Novo utilizador
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total de utilizadores" value={stats.total} icon="Users" tone="navy" />
          <StatCard label="Activos" value={stats.activos} icon="UserCheck" tone="success" />
          <StatCard label="Inactivos / Suspensos" value={stats.inactivosOuSuspensos} icon="UserX" tone="crimson" />
          <StatCard label="Perfis distintos" value={stats.perfisDistintos} icon="IdCard" tone="info" />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Pesquisar por nome, e-mail ou cargo…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                onClear={() => setSearch("")}
              />
            </div>
            <Select value={unidadeFilter} onValueChange={(v) => { setUnidadeFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[190px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as unidades</SelectItem>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.sigla} — {u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={perfilFilter} onValueChange={(v) => { setPerfilFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[170px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os perfis</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setUnidadeFilter("todas"); setPerfilFilter("todos"); setEstadoFilter("todos"); }}
              >
                Limpar filtros
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState icon={Users} title="Nenhum utilizador encontrado" description="Ajuste os filtros ou crie um novo utilizador." />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="min-w-[240px]">Utilizador</TableHeaderCell>
                      <TableHeaderCell>Cargo</TableHeaderCell>
                      <TableHeaderCell>Unidade</TableHeaderCell>
                      <TableHeaderCell>Perfil(is)</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell>Último acesso</TableHeaderCell>
                      <TableHeaderCell className="w-10" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((u) => {
                      const unidade = units.find((unit) => unit.id === u.unidadeId);
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <UserAvatar name={u.nome} color={u.avatarColor} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-graphite-900">{u.nome}</p>
                                <p className="truncate text-2xs text-graphite-500">{u.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{u.cargo}</TableCell>
                          <TableCell className="whitespace-nowrap">{unidade ? `${unidade.sigla} — ${unidade.nome}` : "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {u.perfilIds.map((pid) => {
                                const p = profileById(pid);
                                if (!p) return null;
                                return <Badge key={pid} variant={nivelVariant(p.nivel)}>{p.nome}</Badge>;
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={estadoVariant(u.estado)}>{u.estado === "activo" ? "Activo" : u.estado === "suspenso" ? "Suspenso" : "Inactivo"}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">
                            {u.ultimoAcesso ? formatDate(u.ultimoAcesso, true) : "Nunca acedeu"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8" aria-label={`Acções para ${u.nome}`}>
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { router.refresh(); setEditingUser(u); }}>
                                  <Pencil className="size-3.5" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(u)}>
                                  <KeyRound className="size-3.5" /> Redefinir palavra-passe
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {u.estado === "activo" ? (
                                  <DropdownMenuItem destructive onClick={() => setDeactivateTarget(u)}>
                                    <Ban className="size-3.5" /> Desactivar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleActivate(u)}>
                                    <CheckCircle2 className="size-3.5" /> Activar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem destructive onClick={() => setDeleteTarget(u)}>
                                  <Trash2 className="size-3.5" /> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
          {filtered.length > 0 && (
            <Pagination page={pageSafe} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          )}
        </Card>
      </div>

      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" units={units} profiles={profiles} onSubmit={handleCreate} />
      <UserFormDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        mode="edit"
        initialUser={editingUser}
        units={units}
        profiles={profiles}
        onSubmit={handleEdit}
      />
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Desactivar utilizador"
        description={deactivateTarget ? `${deactivateTarget.nome} perderá imediatamente o acesso ao sistema. Esta acção pode ser revertida a qualquer momento.` : undefined}
        confirmLabel="Desactivar"
        destructive
        onConfirm={handleDeactivateConfirmed}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar utilizador"
        description={deleteTarget ? `${deleteTarget.nome} será removido permanentemente do sistema. Se tiver expedientes, documentos ou histórico associado, a eliminação será recusada — desactive a conta nesse caso.` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
