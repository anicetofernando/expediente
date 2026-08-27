"use client";

import * as React from "react";
import type { Profile, TipoBasePerfil } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIPO_BASE_LABELS: Record<TipoBasePerfil, string> = {
  remetente: "Remetente",
  secretaria: "Secretaria",
  superior: "Superior / Chefia",
  administracao: "Administração",
};

export interface ProfileFormValues {
  nome: string;
  descricao: string;
  tipoBase: TipoBasePerfil;
  nivel: Profile["nivel"];
  ambito: Profile["ambito"];
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
  const [values, setValues] = React.useState<ProfileFormValues>({ nome: "", descricao: "", tipoBase: "remetente", nivel: "operacional", ambito: "unidade" });

  React.useEffect(() => {
    if (open) setValues(initialProfile ? { nome: initialProfile.nome, descricao: initialProfile.descricao, tipoBase: initialProfile.tipoBase, nivel: initialProfile.nivel, ambito: initialProfile.ambito } : { nome: "", descricao: "", tipoBase: "remetente", nivel: "operacional", ambito: "unidade" });
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
              <Label required>Tipo base</Label>
              {initialProfile ? (
                <>
                  <Input value={TIPO_BASE_LABELS[values.tipoBase]} disabled readOnly />
                  <FieldHint>O tipo base não pode ser alterado depois de criado — determina o que este perfil pode fazer no sistema.</FieldHint>
                </>
              ) : (
                <>
                  <Select value={values.tipoBase} onValueChange={(v) => setValues((s) => ({ ...s, tipoBase: v as TipoBasePerfil }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TIPO_BASE_LABELS) as TipoBasePerfil[]).map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{TIPO_BASE_LABELS[tipo]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldHint>Determina o que este perfil pode fazer no sistema — as permissões abaixo só afinam dentro deste tipo.</FieldHint>
                </>
              )}
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
            <Button type="submit" disabled={!isValid}>{initialProfile ? "Guardar alterações" : "Criar perfil"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
