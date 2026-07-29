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
  ambito: Profile["ambito"];
}

export function ProfileFormDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProfileFormValues) => void;
}) {
  const [values, setValues] = React.useState<ProfileFormValues>({ nome: "", descricao: "", nivel: "operacional", ambito: "unidade" });

  React.useEffect(() => {
    if (open) setValues({ nome: "", descricao: "", nivel: "operacional", ambito: "unidade" });
  }, [open]);

  const isValid = values.nome.trim().length > 0 && values.descricao.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo perfil</DialogTitle>
            <DialogDescription>Defina um novo perfil de acesso. As permissões podem ser configuradas de seguida na matriz de permissões.</DialogDescription>
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>
              <div>
                <Label required>Âmbito</Label>
                <Select value={values.ambito} onValueChange={(v) => setValues((s) => ({ ...s, ambito: v as Profile["ambito"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="sector">Sector</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!isValid}>Criar perfil</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
