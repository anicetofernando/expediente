"use client";

import * as React from "react";
import type { OrganizationalUnit, Profile, User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface UserFormValues {
  nome: string;
  email: string;
  cargo: string;
  unidadeId: string;
  perfilId: string;
  estado: User["estado"];
  telefone?: string;
}

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  initialUser,
  units,
  profiles,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialUser?: User | null;
  units: OrganizationalUnit[];
  profiles: Profile[];
  onSubmit: (values: UserFormValues) => void;
}) {
  const [values, setValues] = React.useState<UserFormValues>(emptyValues());
  const departamentos = units.filter((u) => u.tipo === "direccao");
  const [departamentoId, setDepartamentoId] = React.useState("");
  const servicos = units.filter((u) => u.parentId === departamentoId);

  React.useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialUser) {
      setValues({
        nome: initialUser.nome,
        email: initialUser.email,
        cargo: initialUser.cargo,
        unidadeId: initialUser.unidadeId,
        perfilId: initialUser.perfilIds[0] ?? "",
        estado: initialUser.estado,
        telefone: initialUser.telefone ?? "",
      });
      const current = units.find((u) => u.id === initialUser.unidadeId);
      setDepartamentoId(current ? (current.tipo === "direccao" ? current.id : current.parentId ?? "") : "");
    } else {
      setValues(emptyValues());
      setDepartamentoId("");
    }
  }, [open, mode, initialUser, units]);

  function emptyValues(): UserFormValues {
    return { nome: "", email: "", cargo: "", unidadeId: "", perfilId: "", estado: "activo", telefone: "" };
  }

  function selectDepartamento(id: string) {
    setDepartamentoId(id);
    setValues((s) => ({ ...s, unidadeId: id }));
  }

  const isValid = values.nome.trim() && values.email.trim() && values.cargo.trim() && values.unidadeId && values.perfilId;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Novo utilizador" : "Editar utilizador"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Preencha os dados para criar uma nova conta de acesso ao sistema."
                : `A actualizar os dados de ${initialUser?.nome ?? "utilizador"}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nome" required>Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Ex.: Guilherme Zunguza"
                  value={values.nome}
                  onChange={(e) => setValues((v) => ({ ...v, nome: e.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email" required>E-mail institucional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome.apelido@cfm.co.mz"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="cargo" required>Cargo</Label>
                <Input
                  id="cargo"
                  placeholder="Ex.: Técnico Superior de Via e Obras"
                  value={values.cargo}
                  onChange={(e) => setValues((v) => ({ ...v, cargo: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label required>Departamento</Label>
                <Select value={departamentoId} onValueChange={selectDepartamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.sigla} — {u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serviço</Label>
                <Select
                  value={servicos.some((u) => u.id === values.unidadeId) ? values.unidadeId : "sem-servico"}
                  onValueChange={(v) => setValues((s) => ({ ...s, unidadeId: v === "sem-servico" ? departamentoId : v }))}
                  disabled={!departamentoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-servico">Fica no departamento (sem serviço específico)</SelectItem>
                    {servicos.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.sigla} — {u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label required>Perfil de acesso</Label>
                <Select value={values.perfilId} onValueChange={(v) => setValues((s) => ({ ...s, perfilId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  placeholder="+258 8x xxx xxxx"
                  value={values.telefone}
                  onChange={(e) => setValues((v) => ({ ...v, telefone: e.target.value }))}
                />
              </div>
              <div>
                <Label required>Estado</Label>
                <Select value={values.estado} onValueChange={(v) => setValues((s) => ({ ...s, estado: v as User["estado"] }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!isValid}>{mode === "create" ? "Criar utilizador" : "Guardar alterações"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
