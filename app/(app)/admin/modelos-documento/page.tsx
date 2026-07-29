"use client";

import * as React from "react";
import {
  Copy,
  Eye,
  FileStack,
  LayoutTemplate,
  MoreVertical,
  Pencil,
  Plus,
  Power,
} from "lucide-react";
import type { DocumentTemplate } from "@/types";
import { useCatalogs } from "@/lib/catalogs";
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

const CATEGORIES = [
  "Correspondência",
  "Aprovisionamento",
  "Técnico",
  "Decisão",
  "Relatório",
];

export default function ModelosDocumentoPage() {
  const { toast } = useToast();
  const {
    documentTemplates: templates,
    setDocumentTemplates: setTemplates,
  } = useCatalogs();
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("todas");
  const [status, setStatus] = React.useState("todos");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<DocumentTemplate | null>(null);
  const [name, setName] = React.useState("");
  const [newCategory, setNewCategory] = React.useState("");
  const [description, setDescription] = React.useState("");

  const categories = React.useMemo(
    () => Array.from(new Set([...CATEGORIES, ...templates.map((item) => item.categoria)])),
    [templates]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesSearch =
        !query ||
        template.nome.toLowerCase().includes(query) ||
        template.descricao.toLowerCase().includes(query);
      const matchesCategory =
        category === "todas" || template.categoria === category;
      const matchesStatus =
        status === "todos" || template.estado === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [templates, search, category, status]);

  const activeCount = templates.filter((item) => item.estado === "activo").length;
  const usageCount = templates.reduce(
    (total, item) => total + item.utilizacoes,
    0
  );
  const averageFields = templates.length
    ? Math.round(
        templates.reduce((total, item) => total + item.camposCount, 0) /
          templates.length
      )
    : 0;

  function resetForm() {
    setName("");
    setNewCategory("");
    setDescription("");
  }

  function createTemplate() {
    const template: DocumentTemplate = {
      id: `tpl-${Date.now()}`,
      nome: name.trim(),
      categoria: newCategory,
      descricao: description.trim() || "Modelo institucional configurável.",
      camposCount: 0,
      utilizacoes: 0,
      actualizadoEm: new Date().toISOString().slice(0, 10),
      estado: "activo",
    };
    setTemplates((current) => [template, ...current]);
    setCreateOpen(false);
    resetForm();
    toast({
      title: "Modelo criado",
      description: `“${template.nome}” foi adicionado ao catálogo administrativo.`,
      variant: "success",
    });
  }

  function duplicateTemplate(template: DocumentTemplate) {
    const copy: DocumentTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      nome: `${template.nome} — Cópia`,
      utilizacoes: 0,
      actualizadoEm: new Date().toISOString().slice(0, 10),
      estado: "inactivo",
    };
    setTemplates((current) => [copy, ...current]);
    toast({
      title: "Modelo duplicado",
      description: `Foi criada uma cópia inactiva de “${template.nome}”.`,
      variant: "success",
    });
  }

  function toggleStatus(template: DocumentTemplate) {
    const nextStatus =
      template.estado === "activo" ? "inactivo" : "activo";
    setTemplates((current) =>
      current.map((item) =>
        item.id === template.id ? { ...item, estado: nextStatus } : item
      )
    );
    toast({
      title: nextStatus === "activo" ? "Modelo activado" : "Modelo desactivado",
      description: `“${template.nome}” ${
        nextStatus === "activo"
          ? "já pode ser usado na criação de documentos."
          : "deixou de estar disponível para novos documentos."
      }`,
      variant: nextStatus === "activo" ? "success" : "warning",
    });
  }

  return (
    <div>
      <PageHeader
        title="Modelos de documento"
        description="Administração do catálogo institucional, campos e disponibilidade dos modelos."
        breadcrumb={[
          { label: "Administração" },
          { label: "Modelos de documento" },
        ]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Novo modelo
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Total de modelos"
            value={templates.length}
            icon="LayoutTemplate"
            tone="navy"
          />
          <StatCard
            label="Modelos activos"
            value={activeCount}
            icon="BadgeCheck"
            tone="success"
          />
          <StatCard
            label="Utilizações"
            value={usageCount.toLocaleString("pt-PT")}
            icon="Files"
            tone="info"
          />
          <StatCard
            label="Média de campos"
            value={averageFields}
            icon="ListTree"
            tone="graphite"
          />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="Pesquisar nome ou descrição…"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-graphite-500">
              {filtered.length} modelos
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Modelo</TableHeaderCell>
                    <TableHeaderCell>Categoria</TableHeaderCell>
                    <TableHeaderCell>Campos</TableHeaderCell>
                    <TableHeaderCell>Utilizações</TableHeaderCell>
                    <TableHeaderCell>Actualização</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell className="w-10" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="min-w-[280px]">
                        <div className="flex items-start gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                            <LayoutTemplate className="size-4" />
                          </span>
                          <div>
                            <p className="font-medium text-graphite-900">
                              {template.nome}
                            </p>
                            <p className="mt-0.5 max-w-xl text-2xs leading-4 text-graphite-500">
                              {template.descricao}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="navy">{template.categoria}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {template.camposCount}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {template.utilizacoes}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {formatDate(template.actualizadoEm)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            template.estado === "activo"
                              ? "success"
                              : "neutral"
                          }
                        >
                          {template.estado === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Acções para ${template.nome}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setPreview(template)}>
                              <Eye className="size-3.5" />
                              Pré-visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast({
                                  title: "Editor de campos",
                                  description: `${template.camposCount} campos disponíveis para configuração em “${template.nome}”.`,
                                })
                              }
                            >
                              <Pencil className="size-3.5" />
                              Configurar campos
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => duplicateTemplate(template)}
                            >
                              <Copy className="size-3.5" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              destructive={template.estado === "activo"}
                              onClick={() => toggleStatus(template)}
                            >
                              <Power className="size-3.5" />
                              {template.estado === "activo"
                                ? "Desactivar"
                                : "Activar"}
                            </DropdownMenuItem>
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
                <FileStack className="mx-auto size-8 text-graphite-300" />
                <p className="mt-3 text-sm font-medium text-graphite-700">
                  Nenhum modelo corresponde aos filtros
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(value) => {
          setCreateOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Novo modelo de documento</DialogTitle>
            <DialogDescription>
              Defina os dados base. A configuração de campos pode ser concluída
              depois.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="template-name" required>
                Nome
              </Label>
              <Input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Acta de reunião"
              />
            </div>
            <div>
              <Label required>Categoria</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="template-description">Descrição</Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Finalidade e contexto de utilização…"
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!name.trim() || !newCategory}
              onClick={createTemplate}
            >
              Criar modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preview !== null} onOpenChange={(value) => !value && setPreview(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{preview?.nome}</DialogTitle>
            <DialogDescription>
              {preview?.categoria} · {preview?.camposCount} campos configurados
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex justify-center rounded-lg bg-graphite-50 p-6">
              <div className="flex aspect-[210/297] w-full max-w-xs flex-col border border-graphite-300 bg-white p-8 shadow-card">
                <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-navy-800">
                  CFM — Portos e Caminhos de Ferro de Moçambique
                </p>
                <div className="my-5 h-px bg-graphite-200" />
                <p className="text-center text-sm font-semibold text-graphite-900">
                  {preview?.nome}
                </p>
                <div className="mt-8 space-y-3">
                  {[80, 100, 88, 95, 72].map((width, index) => (
                    <div
                      key={index}
                      className="h-2 rounded bg-graphite-100"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
