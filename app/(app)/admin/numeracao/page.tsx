"use client";

import * as React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Hash,
  ListOrdered,
  Plus,
  RotateCcw,
  TicketCheck,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label, SearchInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { useDatabaseSetting } from "@/lib/use-database-setting";

interface NumberingSequence {
  id: string;
  nome: string;
  prefixo: string;
  ano: number;
  actual: number;
  digitos: number;
  separador: "/" | "-" | ".";
  reinicioAnual: boolean;
  activa: boolean;
  ultimaEmissao?: string;
}

const INITIAL_SEQUENCES: NumberingSequence[] = [
  {
    id: "num-oficio",
    nome: "Ofícios",
    prefixo: "OF",
    ano: 2026,
    actual: 1487,
    digitos: 5,
    separador: "/",
    reinicioAnual: true,
    activa: true,
    ultimaEmissao: "2026-07-25T09:14:00",
  },
  {
    id: "num-memorando",
    nome: "Memorandos",
    prefixo: "MEM",
    ano: 2026,
    actual: 836,
    digitos: 4,
    separador: "/",
    reinicioAnual: true,
    activa: true,
    ultimaEmissao: "2026-07-24T16:42:00",
  },
  {
    id: "num-requisicao",
    nome: "Requisições",
    prefixo: "REQ",
    ano: 2026,
    actual: 542,
    digitos: 4,
    separador: "-",
    reinicioAnual: true,
    activa: true,
    ultimaEmissao: "2026-07-25T08:20:00",
  },
  {
    id: "num-parecer",
    nome: "Pareceres",
    prefixo: "PAR",
    ano: 2026,
    actual: 219,
    digitos: 4,
    separador: "/",
    reinicioAnual: true,
    activa: true,
    ultimaEmissao: "2026-07-23T13:10:00",
  },
  {
    id: "num-despacho",
    nome: "Despachos",
    prefixo: "DESP",
    ano: 2026,
    actual: 174,
    digitos: 4,
    separador: "/",
    reinicioAnual: true,
    activa: true,
    ultimaEmissao: "2026-07-24T10:05:00",
  },
  {
    id: "num-relatorio",
    nome: "Relatórios",
    prefixo: "REL",
    ano: 2026,
    actual: 91,
    digitos: 3,
    separador: "-",
    reinicioAnual: true,
    activa: true,
    ultimaEmissao: "2026-07-20T11:45:00",
  },
  {
    id: "num-nota",
    nome: "Notas de serviço",
    prefixo: "NS",
    ano: 2026,
    actual: 66,
    digitos: 3,
    separador: ".",
    reinicioAnual: false,
    activa: false,
    ultimaEmissao: "2026-02-18T09:30:00",
  },
];

function formatNumber(sequence: NumberingSequence, value = sequence.actual) {
  return [
    sequence.prefixo,
    sequence.ano,
    String(value).padStart(sequence.digitos, "0"),
  ].join(sequence.separador);
}

export default function NumeracaoPage() {
  const { toast } = useToast();
  const [sequences, setSequences] = useDatabaseSetting<NumberingSequence[]>("numbering", INITIAL_SEQUENCES);
  const [deleteTarget, setDeleteTarget] = React.useState<NumberingSequence | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("todas");
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [prefix, setPrefix] = React.useState("");
  const [digits, setDigits] = React.useState("4");
  const [separator, setSeparator] =
    React.useState<NumberingSequence["separador"]>("/");
  const [annualReset, setAnnualReset] = React.useState(true);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return sequences.filter((sequence) => {
      const matchesSearch =
        !query ||
        sequence.nome.toLowerCase().includes(query) ||
        sequence.prefixo.toLowerCase().includes(query) ||
        formatNumber(sequence).toLowerCase().includes(query);
      const matchesStatus =
        status === "todas" ||
        (status === "activas" ? sequence.activa : !sequence.activa);
      return matchesSearch && matchesStatus;
    });
  }, [sequences, search, status]);

  const activeCount = sequences.filter((item) => item.activa).length;
  const issuedCount = sequences.reduce((total, item) => total + item.actual, 0);
  const annualCount = sequences.filter((item) => item.reinicioAnual).length;

  const duplicatePrefix = sequences.some(
    (item) => item.prefixo === prefix.trim().toUpperCase()
  );

  function resetForm() {
    setName("");
    setPrefix("");
    setDigits("4");
    setSeparator("/");
    setAnnualReset(true);
  }

  function createSequence() {
    const sequence: NumberingSequence = {
      id: `num-${Date.now()}`,
      nome: name.trim(),
      prefixo: prefix.trim().toUpperCase(),
      ano: new Date().getFullYear(),
      actual: 0,
      digitos: Number(digits),
      separador: separator,
      reinicioAnual: annualReset,
      activa: true,
    };
    setSequences((current) => [sequence, ...current]);
    setOpen(false);
    resetForm();
    toast({
      title: "Sequência criada",
      description: `A próxima referência será ${formatNumber(sequence, 1)}.`,
      variant: "success",
    });
  }

  function reserveNext(sequence: NumberingSequence) {
    const next = sequence.actual + 1;
    setSequences((current) =>
      current.map((item) =>
        item.id === sequence.id
          ? {
              ...item,
              actual: next,
              ultimaEmissao: new Date().toISOString(),
            }
          : item
      )
    );
    toast({
      title: "Número reservado",
      description: `${formatNumber(
        sequence,
        next
      )} foi reservado e guardado no PostgreSQL.`,
      variant: "success",
    });
  }

  function toggleSequence(sequence: NumberingSequence, active: boolean) {
    setSequences((current) =>
      current.map((item) =>
        item.id === sequence.id ? { ...item, activa: active } : item
      )
    );
    toast({
      title: active ? "Sequência activada" : "Sequência suspensa",
      description: `${sequence.nome} ${
        active
          ? "pode voltar a emitir números."
          : "deixou de emitir novas referências."
      }`,
      variant: active ? "success" : "warning",
    });
  }

  function deleteSequenceConfirmed() {
    if (!deleteTarget) return;
    setSequences((current) => current.filter((item) => item.id !== deleteTarget.id));
    toast({ title: "Sequência eliminada", description: `${deleteTarget.nome} foi removida.`, variant: "success" });
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Numeração"
        description="Sequências automáticas, formatos e reinícios anuais das referências documentais."
        breadcrumb={[{ label: "Administração" }, { label: "Numeração" }]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Nova sequência
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Sequências activas"
            value={activeCount}
            icon="ListOrdered"
            tone="success"
          />
          <StatCard
            label="Números emitidos"
            value={issuedCount.toLocaleString("pt-PT")}
            icon="Hash"
            tone="navy"
          />
          <StatCard
            label="Reinício anual"
            value={annualCount}
            icon="CalendarDays"
            tone="info"
          />
          <StatCard
            label="Ano corrente"
            value={new Date().getFullYear()}
            icon="CalendarCheck2"
            tone="graphite"
          />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch sm:flex-row sm:items-center sm:justify-start">
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="Pesquisar sequência ou prefixo…"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="activas">Activas</SelectItem>
                <SelectItem value="inactivas">Inactivas</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-graphite-500">
              {filtered.length} sequências configuradas
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Sequência</TableHeaderCell>
                    <TableHeaderCell>Formato</TableHeaderCell>
                    <TableHeaderCell>Último número</TableHeaderCell>
                    <TableHeaderCell>Próximo número</TableHeaderCell>
                    <TableHeaderCell>Reinício</TableHeaderCell>
                    <TableHeaderCell>Última emissão</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell className="w-32" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((sequence) => (
                    <TableRow key={sequence.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                            <ListOrdered className="size-4" />
                          </span>
                          <div>
                            <p className="font-medium text-graphite-900">
                              {sequence.nome}
                            </p>
                            <p className="mt-0.5 text-2xs text-graphite-500">
                              Prefixo {sequence.prefixo}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-graphite-100 px-2 py-1 text-xs text-graphite-700">
                          {sequence.prefixo}
                          {sequence.separador}
                          AAAA
                          {sequence.separador}
                          {"0".repeat(sequence.digitos)}
                        </code>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium tabular-nums text-graphite-900">
                        {sequence.actual
                          ? formatNumber(sequence)
                          : "Ainda não emitido"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">
                          {formatNumber(sequence, sequence.actual + 1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sequence.reinicioAnual ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            <RotateCcw className="size-3.5 text-info-600" />
                            Anual
                          </span>
                        ) : (
                          <span className="text-xs text-graphite-500">
                            Contínuo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {sequence.ultimaEmissao
                          ? formatDate(sequence.ultimaEmissao, true)
                          : "Nunca"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={sequence.activa}
                            onCheckedChange={(checked) =>
                              toggleSequence(sequence, checked)
                            }
                            aria-label={`Estado de ${sequence.nome}`}
                          />
                          <Badge
                            variant={sequence.activa ? "success" : "neutral"}
                          >
                            {sequence.activa ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!sequence.activa}
                            onClick={() => reserveNext(sequence)}
                          >
                            <TicketCheck className="size-3.5" />
                            Reservar
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${sequence.nome}`} onClick={() => setDeleteTarget(sequence)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Nova sequência de numeração</DialogTitle>
            <DialogDescription>
              Configure o padrão que será usado para gerar referências únicas.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="sequence-name" required>
                Nome
              </Label>
              <Input
                id="sequence-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Contratos"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="sequence-prefix" required>
                  Prefixo
                </Label>
                <Input
                  id="sequence-prefix"
                  value={prefix}
                  onChange={(event) =>
                    setPrefix(event.target.value.toUpperCase().slice(0, 8))
                  }
                  placeholder="CONT"
                  invalid={duplicatePrefix}
                />
              </div>
              <div>
                <Label>Dígitos</Label>
                <Select value={digits} onValueChange={setDigits}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 dígitos</SelectItem>
                    <SelectItem value="4">4 dígitos</SelectItem>
                    <SelectItem value="5">5 dígitos</SelectItem>
                    <SelectItem value="6">6 dígitos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Separador</Label>
                <Select
                  value={separator}
                  onValueChange={(value) =>
                    setSeparator(value as NumberingSequence["separador"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/">Barra /</SelectItem>
                    <SelectItem value="-">Hífen -</SelectItem>
                    <SelectItem value=".">Ponto .</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {prefix.trim() && (
              <div className="rounded-lg border border-info-200 bg-info-50 p-3">
                <p className="text-xs font-medium text-info-800">
                  Pré-visualização
                </p>
                <p className="mt-1 font-mono text-sm text-info-900">
                  {prefix.trim().toUpperCase()}
                  {separator}
                  {new Date().getFullYear()}
                  {separator}
                  {"1".padStart(Number(digits), "0")}
                </p>
              </div>
            )}
            <label className="flex items-center justify-between rounded-lg border border-graphite-200 p-3.5">
              <div>
                <p className="text-[13px] font-medium text-graphite-800">
                  Reiniciar no início de cada ano
                </p>
                <p className="mt-0.5 text-xs text-graphite-500">
                  A contagem regressa a 1 mantendo o ano na referência.
                </p>
              </div>
              <Switch
                checked={annualReset}
                onCheckedChange={setAnnualReset}
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!name.trim() || !prefix.trim() || duplicatePrefix}
              onClick={createSequence}
            >
              <CheckCircle2 className="size-4" />
              Criar sequência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar sequência"
        description={deleteTarget ? `${deleteTarget.nome} será removida permanentemente.` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={deleteSequenceConfirmed}
      />
    </div>
  );
}
