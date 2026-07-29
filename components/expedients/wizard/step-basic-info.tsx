"use client";

import { Label, Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCatalogs } from "@/lib/catalogs";
import type { Priority, Confidentiality } from "@/types";
import type { StepProps } from "./types";

export function StepBasicInfo({ state, update }: StepProps) {
  const {
    documentTypes,
    organizationalUnits,
    priorities,
    confidentialities,
  } = useCatalogs();
  const availableTypes = [...documentTypes]
    .filter((item) => item.activo)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt"));
  const availableUnits = [...organizationalUnits]
    .filter((item) => item.estado === "activo")
    .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt", { numeric: true }));
  const availablePriorities = [...priorities]
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order);
  const availableConfidentialities = [...confidentialities]
    .filter((item) => item.active)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <Label required>Tipo de expediente</Label>
        <Select value={state.tipo} onValueChange={(v) => update({ tipo: v })}>
          <SelectTrigger><SelectValue placeholder="Seleccione o tipo" /></SelectTrigger>
          <SelectContent>
            {availableTypes.map((item) => (
              <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="lg:col-span-4">
        <Label required>Unidade de origem</Label>
        <Select value={state.unidadeOrigem} onValueChange={(v) => update({ unidadeOrigem: v })}>
          <SelectTrigger><SelectValue placeholder="Seleccione a unidade" /></SelectTrigger>
          <SelectContent>
            {availableUnits.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>{unit.sigla} — {unit.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="lg:col-span-4">
        <Label required>Prazo de resposta</Label>
        <Input type="date" value={state.prazo} onChange={(e) => update({ prazo: e.target.value })} />
      </div>

      <div className="lg:col-span-6">
        <Label required>Remetente</Label>
        <Input placeholder="Nome do remetente" value={state.remetente} onChange={(e) => update({ remetente: e.target.value })} />
      </div>

      <div className="lg:col-span-6">
        <Label required>Destinatário</Label>
        <Select value={state.destinatario} onValueChange={(v) => update({ destinatario: v })}>
          <SelectTrigger><SelectValue placeholder="Seleccione o destinatário" /></SelectTrigger>
          <SelectContent>
            {availableUnits.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>{unit.sigla} — {unit.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="sm:col-span-2 lg:col-span-12">
        <Label required>Assunto</Label>
        <Input placeholder="Assunto do expediente" value={state.assunto} onChange={(e) => update({ assunto: e.target.value })} />
      </div>

      <div className="lg:col-span-6">
        <Label required>Prioridade</Label>
        <Select value={state.prioridade} onValueChange={(v) => update({ prioridade: v as Priority })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {availablePriorities.map((item) => (
              <SelectItem key={item.id} value={item.code}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="lg:col-span-6">
        <Label required>Confidencialidade</Label>
        <Select value={state.confidencialidade} onValueChange={(v) => update({ confidencialidade: v as Confidentiality })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableConfidentialities.map((item) => (
              <SelectItem key={item.id} value={item.code}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
