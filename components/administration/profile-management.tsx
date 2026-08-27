"use client";

import * as React from "react";
import { Plus, ShieldCheck, Copy, Pencil, Trash2, Users2 } from "lucide-react";
import type { Profile, User } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormDialog, type ProfileFormValues } from "@/components/administration/profile-form-dialog";
import { ProfilePermissionsDrawer } from "@/components/administration/profile-permissions-drawer";

function nivelVariant(nivel: Profile["nivel"]): "neutral" | "info" | "navy" | "crimson" {
  switch (nivel) {
    case "operacional": return "neutral";
    case "supervisao": return "info";
    case "direccao": return "navy";
    case "administracao": return "crimson";
  }
}

const NIVEL_LABEL: Record<Profile["nivel"], string> = {
  operacional: "Operacional",
  supervisao: "Supervisão",
  direccao: "Direcção",
  administracao: "Administração",
};

export function ProfileManagement({ initialProfiles, users }: { initialProfiles: Profile[]; users: User[] }) {
  const { toast } = useToast();
  const [profiles, setProfiles] = React.useState<Profile[]>(initialProfiles);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingProfile, setEditingProfile] = React.useState<Profile | null>(null);
  const [permissionsProfile, setPermissionsProfile] = React.useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Profile | null>(null);

  async function saveProfile(values: ProfileFormValues) {
    const response = await fetch(editingProfile ? `/api/profiles/${editingProfile.id}` : "/api/profiles", {
      method: editingProfile ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast({ title: "Não foi possível guardar", description: result.error ?? "Tente novamente.", variant: "destructive" });
      return;
    }
    if (editingProfile) {
      setProfiles((current) => current.map((profile) => profile.id === editingProfile.id ? { ...profile, ...values } : profile));
    } else if (result.profile) {
      setProfiles((current) => [...current, result.profile]);
    }
    setCreateOpen(false);
    setEditingProfile(null);
    toast({ title: editingProfile ? "Perfil actualizado" : "Perfil criado", description: `As alterações foram guardadas no PostgreSQL.`, variant: "success" });
  }

  async function handleDuplicate(p: Profile) {
    const response = await fetch("/api/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: `${p.nome} (cópia)`, descricao: p.descricao, nivel: p.nivel }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.profile) return toast({ title: "Não foi possível duplicar", description: result.error ?? "Tente novamente.", variant: "destructive" });
    await fetch(`/api/profiles/${result.profile.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissoes: p.permissoes }) });
    const duplicate = { ...result.profile, permissoes: p.permissoes };
    setProfiles((current) => [...current, duplicate]);
    toast({ title: "Perfil duplicado", description: `Foi criada uma cópia persistente de "${p.nome}".`, variant: "success" });
  }

  function handleEdit(p: Profile) {
    setEditingProfile(p);
    setCreateOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const response = await fetch(`/api/profiles/${deleteTarget.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { toast({ title: "Eliminação falhou", description: result.error, variant: "destructive" }); setDeleteTarget(null); return; }
    setProfiles((current) => current.filter((profile) => profile.id !== deleteTarget.id));
    toast({ title: "Perfil eliminado", description: `${deleteTarget.nome} foi removido do sistema.`, variant: "success" });
    setDeleteTarget(null);
  }

  async function savePermissions(profileId: string, permissions: string[]) {
    const response = await fetch(`/api/profiles/${profileId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissoes: permissions }) });
    if (!response.ok) return toast({ title: "Não foi possível guardar", variant: "destructive" });
    setProfiles((current) => current.map((profile) => profile.id === profileId ? { ...profile, permissoes: permissions } : profile));
    setPermissionsProfile((current) => current?.id === profileId ? { ...current, permissoes: permissions } : current);
    toast({ title: "Permissões guardadas", variant: "success" });
  }

  return (
    <div>
      <PageHeader
        title="Perfis"
        description="Perfis de acesso e o respectivo nível de responsabilidade no sistema."
        breadcrumb={[{ label: "Administração" }, { label: "Perfis" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> Novo perfil
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
        {profiles.map((p) => (
          <Card key={p.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{p.nome}</CardTitle>
              <Badge variant={nivelVariant(p.nivel)}>{NIVEL_LABEL[p.nivel]}</Badge>
            </CardHeader>
            <CardContent className="flex-1 space-y-3.5">
              <p className="text-[13px] leading-relaxed text-graphite-600">{p.descricao}</p>
              <dl className="border-t border-graphite-150 pt-3 text-[13px]">
                <div>
                  <dt className="flex items-center gap-1 text-2xs uppercase tracking-wide text-graphite-400"><Users2 className="size-3" /> Utilizadores</dt>
                  <dd className="mt-0.5 font-medium text-graphite-800">{p.utilizadoresCount}</dd>
                </div>
              </dl>
            </CardContent>
            <CardFooter className="justify-between">
              <Badge variant={p.estado === "activo" ? "success" : "neutral"}>{p.estado === "activo" ? "Activo" : "Inactivo"}</Badge>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(p)}>
                  <Copy className="size-3.5" /> Duplicar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                  <Pencil className="size-3.5" /> Editar
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPermissionsProfile(p)}>
                  <ShieldCheck className="size-3.5" /> Ver permissões
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)}>
                  <Trash2 className="size-3.5" /> Eliminar
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <ProfileFormDialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setEditingProfile(null); }} onSubmit={saveProfile} initialProfile={editingProfile} />
      <ProfilePermissionsDrawer profile={permissionsProfile} users={users} onOpenChange={(open) => !open && setPermissionsProfile(null)} onSave={savePermissions} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar perfil"
        description={deleteTarget ? `${deleteTarget.nome} será removido permanentemente. Perfis essenciais do sistema (Remetente, Secretaria, Superior, Administração) não podem ser eliminados, e perfis com utilizadores atribuídos serão recusados.` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
