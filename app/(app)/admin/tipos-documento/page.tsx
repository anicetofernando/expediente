"use client";

import * as React from "react";
import {
  FileCheck2,
  FileSignature,
  FileType2,
  Plus,
  Route,
  Stamp,
} from "lucide-react";
import { workflows } from "@/data/workflows";
import {
  useCatalogs,
  type DocumentTypeConfig,
} from "@/lib/catalogs";
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

export default function TiposDocumentoPage() {
  const { toast } = useToast();
  const { documentTypes, setDocumentTypes } = useCatalogs();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("todos");
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [prefix, setPrefix] = React.useState("");
  const [workflowId, setWorkflowId] = React.useState("");
  const [requiresStamp, setRequiresStamp] = React.useState(false);
  const [requiresSignature, setRequiresSignature] = React.useState(false);

  const workflowById = React.useCallback(
    (id: string) => workflows.find((workflow) => workflow.id === id),
    []
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return documentTypes.filter((item) => {
      const workflow = workflowById(item.workflowId);
      const matchesSearch =
        !query ||
        item.nome.toLowerCase().includes(query) ||
        item.numeracaoPrefixo.toLowerCase().includes(query) ||
        workflow?.nome.toLowerCase().includes(query);
      const matchesStatus =
        status === "todos" ||
        (status === "activos" ? item.activo : !item.activo);
      return matchesSearch && matchesStatus;
    });
  }, [documentTypes, search, status, workflowById]);

  const activeCount = documentTypes.filter((item) => item.activo).length;
  const withStamp = documentTypes.filter((item) => item.exigeCarimbo).length;
  const withSignature = documentTypes.filter(
    (item) => item.exigeAssinatura
  ).length;
  const configuredFlows = new Set(
    documentTypes.map((item) => item.workflowId)
  ).size;

  const duplicatePrefix = documentTypes.some(
    (item) =>
      item.numeracaoPrefixo.toUpperCase() === prefix.trim().toUpperCase()
  );

  function resetForm() {
    setName("");
    setPrefix("");
    setWorkflowId("");
    setRequiresStamp(false);
    setRequiresSignature(false);
  }

  function createType() {
    const item: DocumentTypeConfig = {
      id: `dt-${Date.now()}`,
      nome: name.trim(),
      numeracaoPrefixo: prefix.trim().toUpperCase(),
      exigeCarimbo: requiresStamp,
      exigeAssinatura: requiresSignature,
      workflowId,
      activo: true,
      ordem:
        Math.max(0, ...documentTypes.map((documentType) => documentType.ordem)) +
        1,
    };
    setDocumentTypes((current) => [item, ...current]);
    setOpen(false);
    resetForm();
    toast({
      title: "Tipo de documento criado",
      description: `${item.nome} usará o prefixo ${item.numeracaoPrefixo}.`,
      variant: "success",
    });
  }

  function updateItem(
    id: string,
    patch: Partial<
      Pick<
        DocumentTypeConfig,
        "activo" | "exigeCarimbo" | "exigeAssinatura"
      >
    >
  ) {
    setDocumentTypes((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  return (
    <div>
      <PageHeader
        title="Tipos de documento"
        description="Regras de identificação, validação e encaminhamento por classe documental."
        breadcrumb={[
          { label: "Administração" },
          { label: "Tipos de documento" },
        ]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Novo tipo
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Tipos activos"
            value={activeCount}
            icon="FileType2"
            tone="navy"
          />
          <StatCard
            label="Exigem carimbo"
            value={withStamp}
            icon="Stamp"
            tone="amber"
          />
          <StatCard
            label="Exigem assinatura"
            value={withSignature}
            icon="FileSignature"
            tone="success"
          />
          <StatCard
            label="Fluxos associados"
            value={configuredFlows}
            icon="Workflow"
            tone="info"
          />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch sm:flex-row sm:items-center sm:justify-start">
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="Pesquisar tipo, prefixo ou fluxo…"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <p className="ml-auto text-xs text-graphite-500">
              Alterações disponíveis em todo o sistema
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Tipo documental</TableHeaderCell>
                    <TableHeaderCell>Prefixo</TableHeaderCell>
                    <TableHeaderCell>Fluxo predefinido</TableHeaderCell>
                    <TableHeaderCell>Carimbo</TableHeaderCell>
                    <TableHeaderCell>Assinatura</TableHeaderCell>
                    <TableHeaderCell>Disponível</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((item) => {
                    const workflow = workflowById(item.workflowId);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-md bg-graphite-100 text-graphite-600">
                              <FileType2 className="size-4" />
                            </span>
                            <div>
                              <p className="font-medium text-graphite-900">
                                {item.nome}
                              </p>
                              <p className="mt-0.5 text-2xs text-graphite-500">
                                Código {item.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="navy">
                            {item.numeracaoPrefixo}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[240px]">
                          <div className="flex items-center gap-2">
                            <Route className="size-3.5 text-graphite-400" />
                            <span>{workflow?.nome ?? "Sem fluxo associado"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.exigeCarimbo}
                              onCheckedChange={(checked) =>
                                updateItem(item.id, {
                                  exigeCarimbo: checked,
                                })
                              }
                              aria-label={`Exigir carimbo em ${item.nome}`}
                            />
                            <span className="text-xs text-graphite-500">
                              {item.exigeCarimbo ? "Obrigatório" : "Opcional"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.exigeAssinatura}
                              onCheckedChange={(checked) =>
                                updateItem(item.id, {
                                  exigeAssinatura: checked,
                                })
                              }
                              aria-label={`Exigir assinatura em ${item.nome}`}
                            />
                            <span className="text-xs text-graphite-500">
                              {item.exigeAssinatura
                                ? "Obrigatória"
                                : "Opcional"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.activo}
                              onCheckedChange={(checked) => {
                                updateItem(item.id, { activo: checked });
                                toast({
                                  title: checked
                                    ? "Tipo activado"
                                    : "Tipo desactivado",
                                  description: `${item.nome} ${
                                    checked
                                      ? "está disponível para novos expedientes."
                                      : "foi ocultado dos formulários de criação."
                                  }`,
                                  variant: checked ? "success" : "warning",
                                });
                              }}
                              aria-label={`Disponibilidade de ${item.nome}`}
                            />
                            <Badge variant={item.activo ? "success" : "neutral"}>
                              {item.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {filtered.length === 0 && (
              <div className="px-6 py-12 text-center">
                <FileCheck2 className="mx-auto size-8 text-graphite-300" />
                <p className="mt-3 text-sm font-medium text-graphite-700">
                  Nenhum tipo de documento encontrado
                </p>
              </div>
            )}
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
            <DialogTitle>Novo tipo de documento</DialogTitle>
            <DialogDescription>
              Configure a identificação e o circuito predefinido do documento.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div>
                <Label htmlFor="document-type-name" required>
                  Designação
                </Label>
                <Input
                  id="document-type-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Acta"
                />
              </div>
              <div>
                <Label htmlFor="document-type-prefix" required>
                  Prefixo
                </Label>
                <Input
                  id="document-type-prefix"
                  value={prefix}
                  onChange={(event) =>
                    setPrefix(event.target.value.toUpperCase().slice(0, 8))
                  }
                  placeholder="ACT"
                  invalid={duplicatePrefix}
                />
                {duplicatePrefix && (
                  <p className="mt-1.5 text-xs text-crimson-600">
                    Este prefixo já está em uso.
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label required>Fluxo predefinido</Label>
              <Select value={workflowId} onValueChange={setWorkflowId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione um fluxo" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-lg border border-graphite-200 p-3">
                <span className="flex items-center gap-2 text-[13px] font-medium text-graphite-700">
                  <Stamp className="size-4 text-graphite-400" />
                  Exigir carimbo
                </span>
                <Switch
                  checked={requiresStamp}
                  onCheckedChange={setRequiresStamp}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-graphite-200 p-3">
                <span className="flex items-center gap-2 text-[13px] font-medium text-graphite-700">
                  <FileSignature className="size-4 text-graphite-400" />
                  Exigir assinatura
                </span>
                <Switch
                  checked={requiresSignature}
                  onCheckedChange={setRequiresSignature}
                />
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !name.trim() ||
                !prefix.trim() ||
                !workflowId ||
                duplicatePrefix
              }
              onClick={createType}
            >
              Criar tipo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
