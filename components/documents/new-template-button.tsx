"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const CATEGORIAS = ["Correspondência", "Aprovisionamento", "Técnico", "Decisão", "Relatório"];

export function NewTemplateButton() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [nome, setNome] = React.useState("");
  const [categoria, setCategoria] = React.useState("");
  const [descricao, setDescricao] = React.useState("");

  function reset() {
    setNome(""); setCategoria(""); setDescricao("");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> Novo modelo
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Novo modelo de documento</DialogTitle>
            <DialogDescription>Defina os dados base do modelo. Os campos do formulário poderão ser configurados de seguida.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3.5">
            <div>
              <Label required>Nome do modelo</Label>
              <Input placeholder="Ex.: Ofício Institucional" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label required>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Seleccione a categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} placeholder="Descreva a finalidade e o contexto de utilização deste modelo…" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              disabled={!nome.trim() || !categoria}
              onClick={() => {
                toast({ title: "Modelo criado", description: `O modelo "${nome}" foi criado e está disponível para configuração dos campos.`, variant: "success" });
                setOpen(false);
                reset();
              }}
            >
              Criar modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
