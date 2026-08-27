"use client";

import * as React from "react";
import type { Profile } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ProfileFormValues {
  nome: string;
  descricao: string;
  nivel: Profile["nivel"];
}

export function ProfileFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProfileFormValues) => void | Promise<void>;
  initialProfile?: Profile | null;
}) {
  const [values, setValues] = React.useState<ProfileFormValues>({ nome: "", descricao: "", nivel: "operacional" });

  React.useEffect(() => {
    if (open) setValues(initialProfile ? { nome: initialProfile.nome, descricao: initialProfile.descricao, nivel: initialProfile.nivel } : { nome: "", descricao: "", nivel: "operacional" });
  }, [open, initialProfile]);

  const isValid = values.nome.trim().length > 0 && values.descricao.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    void onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{initialProfile ? "Editar perfil" : "Novo perfil"}</DialogTitle>
            <DialogDescription>{initialProfile ? "Actualize os dados do perfil de acesso." : "Defina um novo perfil de acesso. As permissões podem ser configuradas de seguida na matriz."}</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="nome-perfil" required>Nome do perfil</Label>
              <Input
                id="nome-perfil"
                placeholder="Ex.: Chefe de Secção"
                value={values.nome}
                onChange={(e) => setValues((v) => ({ ...v, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="descricao-perfil" required>Descrição</Label>
              <Textarea
                id="descricao-perfil"
                placeholder="Descreva o âmbito de responsabilidade e o tipo de acesso deste perfil."
                value={values.descricao}
                onChange={(e) => setValues((v) => ({ ...v, descricao: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label required>Nível</Label>
              <Select value={values.nivel} onValueChange={(v) => setValues((s) => ({ ...s, nivel: v as Profile["nivel"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="supervisao">Supervisão</SelectItem>
                  <SelectItem value="direccao">Direcção</SelectItem>
                  <SelectItem value="administracao">Administração</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-2xs text-graphite-500">Determina o tipo de acesso do perfil: Operacional funciona como Remetente, Supervisão/Direcção como Superior, e Administração como Administrador do Sistema.</p>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!isValid}>{initialProfile ? "Guardar alterações" : "Criar perfil"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
