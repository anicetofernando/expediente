"use client";

import * as React from "react";
import {
  Archive,
  ArrowRight,
  Copy,
  Eye,
  GitBranch,
  MoreVertical,
  Plus,
  Rocket,
  Workflow as WorkflowIcon,
} from "lucide-react";
import type { Workflow as WorkflowType } from "@/types";
import { workflows as initialWorkflows } from "@/data/workflows";
import { PageHeader } from "@/components/shared/page-header";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input, Label, SearchInput, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const STATUS_LABEL: Record<WorkflowType["estado"], string> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  arquivado: "Arquivado",
};

const STATUS_VARIANT: Record<
  WorkflowType["estado"],
  "success" | "amber" | "neutral"
> = {
  publicado: "success",
  rascunho: "amber",
  arquivado: "neutral",
};

export default function FluxosPage() {
  const { toast } = useToast();
  const [items, setItems] =
    React.useState<WorkflowType[]>(initialWorkflows);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("todos");
  const [documentType, setDocumentType] = React.useState("todos");
  const [selected, setSelected] = React.useState<WorkflowType | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [newDocumentType, setNewDocumentType] = React.useState("");

  const documentTypes = React.useMemo(
    () => Array.from(new Set(items.map((item) => item.tipoDocumento))),
    [items]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((workflow) => {
      const matchesSearch =
        !query ||
        workflow.nome.toLowerCase().includes(query) ||
        workflow.descricao.toLowerCase().includes(query) ||
        workflow.actualizadoPor.toLowerCase().includes(query);
      const matchesStatus =
        status === "todos" || workflow.estado === status;
      const matchesType =
        documentType === "todos" || workflow.tipoDocumento === documentType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [items, search, status, documentType]);

  const publishedCount = items.filter(
    (item) => item.estado === "publicado"
  ).length;
  const draftCount = items.filter((item) => item.estado === "rascunho").length;
  const stepsCount = items.reduce(
    (total, item) => total + item.etapas.length,
    0
  );

  function resetForm() {
    setName("");
    setDescription("");
    setNewDocumentType("");
  }

  function createWorkflow() {
    const workflow: WorkflowType = {
      id: `wf-${Date.now()}`,
      nome: name.trim(),
      descricao: description.trim() || "Fluxo em configuração.",
      tipoDocumento: newDocumentType,
      versao: "0.1",
      estado: "rascunho",
      actualizadoEm: new Date().toISOString(),
      actualizadoPor: "Administrador do Sistema",
      etapas: [
        {
          id: "s1",
          nome: "Recepção e triagem",
          responsavelPerfil: "Secretaria Geral",
          prazoDias: 1,
          accoesPermitidas: ["Receber", "Encaminhar"],
          assinaturaObrigatoria: false,
        },
      ],
    };
    setItems((current) => [workflow, ...current]);
    setCreateOpen(false);
    resetForm();
    toast({
      title: "Fluxo criado como rascunho",
      description: `“${workflow.nome}” está pronto para configuração das etapas.`,
      variant: "success",
    });
  }

  function updateStatus(
    workflow: WorkflowType,
    nextStatus: WorkflowType["estado"]
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === workflow.id
          ? {
              ...item,
              estado: nextStatus,
              actualizadoEm: new Date().toISOString(),
              actualizadoPor: "Administrador do Sistema",
            }
          : item
      )
    );
    setSelected((current) =>
      current?.id === workflow.id
        ? { ...current, estado: nextStatus }
        : current
    );
    toast({
      title:
        nextStatus === "publicado"
          ? "Fluxo publicado"
          : "Fluxo arquivado",
      description: `“${workflow.nome}” foi ${
        nextStatus === "publicado"
          ? "disponibilizado para novos expedientes."
          : "retirado da utilização activa."
      }`,
      variant: nextStatus === "publicado" ? "success" : "warning",
    });
  }

  function duplicate(workflow: WorkflowType) {
    const copy: WorkflowType = {
      ...workflow,
      id: `wf-${Date.now()}`,
      nome: `${workflow.nome} — Cópia`,
      versao: "0.1",
      estado: "rascunho",
      actualizadoEm: new Date().toISOString(),
      actualizadoPor: "Administrador do Sistema",
      etapas: workflow.etapas.map((step, index) => ({
        ...step,
        id: `s${index + 1}`,
      })),
    };
    setItems((current) => [copy, ...current]);
    toast({
      title: "Fluxo duplicado",
      description: `Foi criada uma versão de trabalho de “${workflow.nome}”.`,
      variant: "success",
    });
  }

  return (
    <div>
      <PageHeader
        title="Fluxos"
        description="Configuração dos circuitos de tramitação, responsáveis, prazos e decisões."
        breadcrumb={[{ label: "Administração" }, { label: "Fluxos" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Novo fluxo
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Fluxos publicados"
            value={publishedCount}
            icon="Workflow"
            tone="success"
          />
          <StatCard
            label="Em rascunho"
            value={draftCount}
            icon="FilePenLine"
            tone="amber"
          />
          <StatCard
            label="Etapas configuradas"
            value={stepsCount}
            icon="ListChecks"
            tone="navy"
          />
          <StatCard
            label="Tipos abrangidos"
            value={documentTypes.length}
            icon="FileType2"
            tone="info"
          />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="Pesquisar fluxo, descrição ou responsável…"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="publicado">Publicados</SelectItem>
                <SelectItem value="rascunho">Rascunhos</SelectItem>
                <SelectItem value="arquivado">Arquivados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo documental" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {documentTypes.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-graphite-500">
              {filtered.length} fluxos
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Fluxo</TableHeaderCell>
                    <TableHeaderCell>Tipo documental</TableHeaderCell>
                    <TableHeaderCell>Versão</TableHeaderCell>
                    <TableHeaderCell>Etapas</TableHeaderCell>
                    <TableHeaderCell>Actualização</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell className="w-10" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell className="min-w-[300px]">
                        <div className="flex items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-info-50 text-info-700">
                            <WorkflowIcon className="size-4" />
                          </span>
                          <div>
                            <p className="font-medium text-graphite-900">
                              {workflow.nome}
                            </p>
                            <p className="mt-0.5 max-w-xl text-2xs leading-4 text-graphite-500">
                              {workflow.descricao}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="navy">
                          {workflow.tipoDocumento}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        v{workflow.versao}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelected(workflow)}
                          className="inline-flex items-center gap-1.5 font-medium text-navy-700 hover:underline"
                        >
                          <GitBranch className="size-3.5" />
                          {workflow.etapas.length} etapas
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <p className="tabular-nums">
                          {formatDate(workflow.actualizadoEm)}
                        </p>
                        <p className="mt-0.5 text-2xs text-graphite-500">
                          {workflow.actualizadoPor}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[workflow.estado]}>
                          {STATUS_LABEL[workflow.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Acções para ${workflow.nome}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => setSelected(workflow)}
                            >
                              <Eye className="size-3.5" />
                              Ver etapas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => duplicate(workflow)}
                            >
                              <Copy className="size-3.5" />
                              Duplicar como rascunho
                            </DropdownMenuItem>
                            {workflow.estado !== "publicado" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatus(workflow, "publicado")
                                }
                              >
                                <Rocket className="size-3.5" />
                                Publicar
                              </DropdownMenuItem>
                            )}
                            {workflow.estado !== "arquivado" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  destructive
                                  onClick={() =>
                                    updateStatus(workflow, "arquivado")
                                  }
                                >
                                  <Archive className="size-3.5" />
                                  Arquivar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {filtered.length === 0 && (
              <div className="px-6 py-12 text-center">
                <WorkflowIcon className="mx-auto size-8 text-graphite-300" />
                <p className="mt-3 text-sm font-medium text-graphite-700">
                  Nenhum fluxo encontrado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(value) => !value && setSelected(null)}
      >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{selected?.nome}</DialogTitle>
            <DialogDescription>
              Versão {selected?.versao} · {selected?.tipoDocumento} ·{" "}
              {selected && STATUS_LABEL[selected.estado]}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-3">
              {selected?.etapas.map((step, index) => (
                <div key={step.id} className="relative flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    {index < selected.etapas.length - 1 && (
                      <span className="mt-1 h-full min-h-5 w-px bg-graphite-200" />
                    )}
                  </div>
                  <div className="mb-2 flex-1 rounded-lg border border-graphite-200 p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-graphite-900">
                          {step.nome}
                        </p>
                        <p className="mt-0.5 text-xs text-graphite-500">
                          {step.responsavelPerfil}
                        </p>
                      </div>
                      <Badge variant="info">
                        Prazo: {step.prazoDias}{" "}
                        {step.prazoDias === 1 ? "dia" : "dias"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {step.accoesPermitidas.map((action) => (
                        <Badge key={action}>{action}</Badge>
                      ))}
                      {step.assinaturaObrigatoria && (
                        <Badge variant="amber">Assinatura obrigatória</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Fechar
            </Button>
            {selected?.estado !== "publicado" && selected && (
              <Button onClick={() => updateStatus(selected, "publicado")}>
                <Rocket className="size-4" />
                Publicar fluxo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(value) => {
          setCreateOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Novo fluxo</DialogTitle>
            <DialogDescription>
              Crie a base do circuito. A primeira etapa de recepção será
              adicionada automaticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="workflow-name" required>
                Nome do fluxo
              </Label>
              <Input
                id="workflow-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Contrato — Aprovação"
              />
            </div>
            <div>
              <Label required>Tipo documental</Label>
              <Select
                value={newDocumentType}
                onValueChange={setNewDocumentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workflow-description">Descrição</Label>
              <Textarea
                id="workflow-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Objectivo e âmbito do circuito…"
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!name.trim() || !newDocumentType}
              onClick={createWorkflow}
            >
              <ArrowRight className="size-4" />
              Criar e configurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
