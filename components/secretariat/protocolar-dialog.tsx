"use client";

import * as React from "react";
import { Stamp, X } from "lucide-react";
import type { Expedient } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { documentTypes } from "@/data/workflows";
import { users, organizationalUnits } from "@/data/organization";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

function pseudoNumero(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return String(1000 + (hash % 9000)).padStart(4, "0");
}

function siglaFor(unidadeOrigem: string): string {
  return organizationalUnits.find((u) => u.nome === unidadeOrigem)?.sigla ?? "SG";
}

export function ProtocolarDialog({
  expedient,
  iconTrigger = false,
}: {
  expedient: Expedient;
  iconTrigger?: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [categoria, setCategoria] = React.useState(
    documentTypes.find((d) => d.nome === expedient.tipo)?.id ?? documentTypes[0].id
  );
  const [responsavelId, setResponsavelId] = React.useState(
    users.some((u) => u.id === expedient.responsavelActualId) ? expedient.responsavelActualId : "usr-cremilda-nhantumbo"
  );
  const [aplicarCarimbo, setAplicarCarimbo] = React.useState(true);
  const [encaminharImediato, setEncaminharImediato] = React.useState(false);

  const numero = React.useMemo(
    () => `CFM/${siglaFor(expedient.unidadeOrigem)}/2026/${pseudoNumero(expedient.id)}`,
    [expedient]
  );

  function handleConfirm() {
    toast({
      title: "Expediente protocolado",
      description: `${numero} atribuído a "${expedient.assunto}".${
        encaminharImediato ? " Encaminhado de imediato à unidade responsável." : " Aguarda encaminhamento posterior."
      }`,
      variant: "success",
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={iconTrigger ? "ghost" : "secondary"}
          size={iconTrigger ? "icon-sm" : "sm"}
          aria-label={iconTrigger ? `Protocolar expediente ${expedient.protocolo}` : undefined}
          title={iconTrigger ? "Protocolar" : undefined}
        >
          <Stamp className="size-3.5" aria-hidden="true" />
          {!iconTrigger && "Protocolar"}
        </Button>
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Atribuir número de protocolo</DialogTitle>
          <DialogDescription>Confirme os dados do protocolo.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="rounded-md border border-graphite-150 bg-graphite-25 px-3.5 py-3 text-[13px]">
            <p className="font-medium text-graphite-900">{expedient.assunto}</p>
            <p className="mt-1 text-graphite-500">
              {expedient.remetente.nome} · {expedient.unidadeOrigem} · Entrada em {formatDate(expedient.dataEntrada)}
            </p>
            <p className="mt-2 flex items-center gap-1.5 font-medium text-cfm-800">
              <Stamp className="size-3.5" /> Número previsto: <span className="font-semibold">{numero}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Livro</Label>
              <Select value="livro-geral-2026" onValueChange={() => {}}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livro-geral-2026">Livro Geral 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Responsável pela recepção</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome} — {u.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-graphite-150 px-3.5 py-3">
            <label className="flex items-center gap-2.5 text-[13px] text-graphite-700">
              <Checkbox checked={aplicarCarimbo} onCheckedChange={(v) => setAplicarCarimbo(!!v)} />
              Aplicar carimbo de protocolo ao documento principal
            </label>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-graphite-800">Encaminhar imediatamente</p>
              </div>
              <Switch checked={encaminharImediato} onCheckedChange={setEncaminharImediato} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            <X className="size-3.5" aria-hidden="true" />
            Cancelar
          </Button>
          <Button variant="secondary" onClick={handleConfirm}>
            <Stamp className="size-3.5" aria-hidden="true" />
            Confirmar protocolo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
