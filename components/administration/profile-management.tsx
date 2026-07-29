"use client";

import * as React from "react";
import { Plus, ShieldCheck, Copy, Pencil, Users2 } from "lucide-react";
import type { Profile, User } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const AMBITO_LABEL: Record<Profile["ambito"], string> = {
  global: "Global",
  unidade: "Unidade",
  sector: "Sector",
};

export function ProfileManagement({ initialProfiles, users }: { initialProfiles: Profile[]; users: User[] }) {
  const { toast } = useToast();
  const [profiles, setProfiles] = React.useState<Profile[]>(initialProfiles);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [permissionsProfile, setPermissionsProfile] = React.useState<Profile | null>(null);

  function handleCreate(values: ProfileFormValues) {
    const novo: Profile = {
      id: `p-${values.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36).slice(-4)}`,
      nome: values.nome,
      descricao: values.descricao,
      nivel: values.nivel,
      ambito: values.ambito,
      utilizadoresCount: 0,
      permissoes: [],
      estado: "activo",
    };
    setProfiles((prev) => [...prev, novo]);
    setCreateOpen(false);
    toast({ title: "Perfil criado", description: `O perfil "${novo.nome}" foi criado. Configure as permissões na matriz de permissões.`, variant: "success" });
  }

  function handleDuplicate(p: Profile) {
    toast({ title: "Perfil duplicado", description: `Foi criada uma cópia de "${p.nome}" para edição.` });
  }

  function handleEdit(p: Profile) {
    toast({ title: "Edição de perfil", description: `A abrir o formulário de edição de "${p.nome}".` });
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
              <dl className="grid grid-cols-2 gap-3 border-t border-graphite-150 pt-3 text-[13px]">
                <div>
                  <dt className="text-2xs uppercase tracking-wide text-graphite-400">Âmbito</dt>
                  <dd className="mt-0.5 font-medium text-graphite-800">{AMBITO_LABEL[p.ambito]}</dd>
                </div>
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
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <ProfileFormDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      <ProfilePermissionsDrawer profile={permissionsProfile} users={users} onOpenChange={(open) => !open && setPermissionsProfile(null)} />
    </div>
  );
}
