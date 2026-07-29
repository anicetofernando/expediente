"use client";

import * as React from "react";
import { Plus, Users2, X, XCircle } from "lucide-react";
import type { User } from "@/types";
import { users } from "@/data/organization";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

type DelegationState = "activa" | "agendada" | "terminada";

interface Delegation {
  id: string;
  delegante: User;
  delegado: User;
  ambito: string;
  dataInicio: string;
  dataFim: string;
  estado: DelegationState;
}

const userByIdSafe = (id: string) => users.find((u) => u.id === id)!;

const INITIAL_DELEGATIONS: Delegation[] = [
  {
    id: "del-1",
    delegante: userByIdSafe("usr-amelia-nhaca"),
    delegado: userByIdSafe("usr-carlos-machava"),
    ambito: "Aprovação de todos os expedientes remetidos à Direcção Geral durante o período de férias.",
    dataInicio: "2026-07-20",
    dataFim: "2026-08-03",
    estado: "activa",
  },
  {
    id: "del-2",
    delegante: userByIdSafe("usr-eduardo-macuacua"),
    delegado: userByIdSafe("usr-fatima-momade"),
    ambito: "Aprovações correntes da Direcção de Infra-estruturas durante deslocação de serviço a Nampula.",
    dataInicio: "2026-07-27",
    dataFim: "2026-08-05",
    estado: "agendada",
  },
  {
    id: "del-3",
    delegante: userByIdSafe("usr-armando-bila"),
    delegado: userByIdSafe("usr-graca-muianga"),
    ambito: "Aprovação de requisições de material de valor até 2.000.000,00 MT.",
    dataInicio: "2026-07-10",
    dataFim: "2026-07-31",
    estado: "activa",
  },
  {
    id: "del-4",
    delegante: userByIdSafe("usr-lidia-chissano"),
    delegado: userByIdSafe("usr-noemia-machel"),
    ambito: "Aprovação de processos de férias e ausências de pessoal.",
    dataInicio: "2026-06-01",
    dataFim: "2026-06-15",
    estado: "terminada",
  },
];

const STATE_META: Record<DelegationState, { label: string; dot: string }> = {
  activa: { label: "Activa", dot: "bg-success-500" },
  agendada: { label: "Agendada", dot: "bg-info-500" },
  terminada: { label: "Terminada", dot: "bg-graphite-400" },
};

export function DelegationsPanel() {
  const { toast } = useToast();
  const [delegations, setDelegations] = React.useState<Delegation[]>(INITIAL_DELEGATIONS);
  const [newOpen, setNewOpen] = React.useState(false);
  const [closingId, setClosingId] = React.useState<string | null>(null);

  function endDelegation(id: string) {
    setDelegations((prev) => prev.map((d) => (d.id === id ? { ...d, estado: "terminada" } : d)));
    const target = delegations.find((d) => d.id === id);
    toast({ title: "Delegação encerrada", description: target ? `A delegação de ${target.delegante.nome} para ${target.delegado.nome} foi encerrada.` : undefined, variant: "success" });
    setClosingId(null);
  }

  function createDelegation(d: Omit<Delegation, "id" | "estado">) {
    const today = new Date().toISOString().slice(0, 10);
    const estado: DelegationState = d.dataInicio > today ? "agendada" : "activa";
    setDelegations((prev) => [{ id: `del-${prev.length + 1}-${Date.now()}`, estado, ...d }, ...prev]);
    toast({ title: "Delegação criada", description: `${d.delegante.nome} delegou poderes de aprovação a ${d.delegado.nome}.`, variant: "success" });
    setNewOpen(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-end border-b border-graphite-200 bg-graphite-50 px-4 py-1.5">
        <Button
          variant="toolbar"
          size="icon-sm"
          onClick={() => setNewOpen(true)}
          aria-label="Nova delegação"
          title="Nova delegação"
        >
          <Plus className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {delegations.length === 0 ? (
          <EmptyState icon={Users2} title="Sem delegações registadas" />
        ) : (
          <TableContainer className="border border-graphite-200 bg-white">
            <Table className="min-w-[1060px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Delegante</TableHeaderCell>
                  <TableHeaderCell>Delegado</TableHeaderCell>
                  <TableHeaderCell className="min-w-[260px]">Âmbito</TableHeaderCell>
                  <TableHeaderCell>Período</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell className="w-[58px] text-center">Acções</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {delegations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="py-1.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={d.delegante.nome} color={d.delegante.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-graphite-800">{d.delegante.nome}</p>
                          <p className="truncate text-2xs text-graphite-400">{d.delegante.cargo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={d.delegado.nome} color={d.delegado.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-graphite-800">{d.delegado.nome}</p>
                          <p className="truncate text-2xs text-graphite-400">{d.delegado.cargo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[320px] py-1.5 text-graphite-600" title={d.ambito}>
                      <span className="block max-w-[320px] truncate">{d.ambito}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5 tabular-nums text-graphite-500">
                      {formatDate(d.dataInicio)} – {formatDate(d.dataFim)}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-graphite-700">
                        <span className={`size-1.5 rounded-full ${STATE_META[d.estado].dot}`} aria-hidden />
                        {STATE_META[d.estado].label}
                      </span>
                    </TableCell>
                    <TableCell className="py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                      {d.estado !== "terminada" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setClosingId(d.id)}
                          aria-label={`Encerrar delegação de ${d.delegante.nome}`}
                          title="Encerrar delegação"
                        >
                          <XCircle className="size-3.5" aria-hidden />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>

      <NewDelegationDialog open={newOpen} onOpenChange={setNewOpen} onCreate={createDelegation} />

      <ConfirmDialog
        open={closingId !== null}
        onOpenChange={(v) => !v && setClosingId(null)}
        title="Encerrar delegação"
        description="A delegação será encerrada imediatamente."
        confirmLabel="Encerrar delegação"
        destructive
        onConfirm={() => closingId && endDelegation(closingId)}
      />
    </div>
  );
}

function NewDelegationDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (d: { delegante: User; delegado: User; ambito: string; dataInicio: string; dataFim: string }) => void;
}) {
  const [delegante, setDelegante] = React.useState("");
  const [delegado, setDelegado] = React.useState("");
  const [dataInicio, setDataInicio] = React.useState("");
  const [dataFim, setDataFim] = React.useState("");
  const [ambito, setAmbito] = React.useState("");

  function reset() {
    setDelegante(""); setDelegado(""); setDataInicio(""); setDataFim(""); setAmbito("");
  }

  const canSubmit = delegante && delegado && delegante !== delegado && dataInicio && dataFim && ambito.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Nova delegação de aprovação</DialogTitle>
          <DialogDescription>Atribua temporariamente a competência de aprovação a outro colaborador.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label required>Delegante</Label>
              <Select value={delegante} onValueChange={setDelegante}>
                <SelectTrigger><SelectValue placeholder="Quem delega" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome} — {u.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label required>Delegado</Label>
              <Select value={delegado} onValueChange={setDelegado}>
                <SelectTrigger><SelectValue placeholder="Quem recebe" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome} — {u.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <Label required>Início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label required>Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>
          <div>
            <Label required>Âmbito da delegação</Label>
            <Textarea rows={3} placeholder="Descreva as matérias ou o tipo de expediente abrangido por esta delegação…" value={ambito} onChange={(e) => setAmbito(e.target.value)} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="size-3.5" aria-hidden />
            Cancelar
          </Button>
          <Button
            variant="secondary"
            disabled={!canSubmit}
            onClick={() => {
              const dObj = users.find((u) => u.id === delegante)!;
              const gObj = users.find((u) => u.id === delegado)!;
              onCreate({ delegante: dObj, delegado: gObj, ambito, dataInicio, dataFim });
              reset();
            }}
          >
            <Plus className="size-3.5" aria-hidden />
            Criar delegação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
