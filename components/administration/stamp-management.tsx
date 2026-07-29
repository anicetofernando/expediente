"use client";

import * as React from "react";
import {
  Ban,
  CheckCircle2,
  History,
  MoreVertical,
  Pencil,
  Plus,
  Stamp as StampIcon,
} from "lucide-react";
import type { Stamp } from "@/types";
import { useCatalogs } from "@/lib/catalogs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StampEditorDrawer } from "@/components/administration/stamp-editor-drawer";
import { StampUsageDialog } from "@/components/administration/stamp-usage-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";

const CATEGORY_META: Record<
  Stamp["categoria"],
  { label: string; variant: "neutral" | "navy" | "success" | "amber" | "crimson" | "info" }
> = {
  institucional: { label: "Institucional", variant: "navy" },
  funcional: { label: "Funcional", variant: "neutral" },
  protocolo: { label: "Protocolo", variant: "navy" },
  recepcao: { label: "Recepção", variant: "info" },
  aprovacao: { label: "Aprovação", variant: "success" },
  confidencialidade: { label: "Confidencialidade", variant: "crimson" },
  urgencia: { label: "Urgência", variant: "amber" },
  outro: { label: "Outro", variant: "neutral" },
};

const STAMP_COLOR_CLASSES: Record<string, string> = {
  navy: "border-navy-600 bg-navy-50 text-navy-700",
  info: "border-info-600 bg-info-50 text-info-700",
  success: "border-success-600 bg-success-50 text-success-700",
  amber: "border-amber-600 bg-amber-50 text-amber-700",
  crimson: "border-crimson-600 bg-crimson-50 text-crimson-700",
  graphite: "border-graphite-500 bg-graphite-50 text-graphite-700",
};

const numberFormatter = new Intl.NumberFormat("pt-PT");

function normaliseSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function StampPreview({ stamp }: { stamp: Stamp }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md border",
        STAMP_COLOR_CLASSES[stamp.cor] ?? STAMP_COLOR_CLASSES.graphite,
        !stamp.activo && "opacity-55 grayscale"
      )}
      aria-hidden
    >
      <StampIcon className="size-[18px]" />
    </span>
  );
}

export function StampManagement() {
  const { toast } = useToast();
  const { stamps, setStamps } = useCatalogs();
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("todas");
  const [unitFilter, setUnitFilter] = React.useState("todas");
  const [statusFilter, setStatusFilter] = React.useState("todos");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorStamp, setEditorStamp] = React.useState<Stamp | null>(null);
  const [editorSession, setEditorSession] = React.useState(0);
  const [usageStamp, setUsageStamp] = React.useState<Stamp | null>(null);
  const [deactivateTarget, setDeactivateTarget] = React.useState<Stamp | null>(null);

  const unitOptions = React.useMemo(
    () => Array.from(new Set(stamps.map((stamp) => stamp.unidade))).sort((a, b) => a.localeCompare(b, "pt")),
    [stamps]
  );

  const filtered = React.useMemo(() => {
    const query = normaliseSearch(search.trim());

    return stamps.filter((stamp) => {
      if (query) {
        const searchable = normaliseSearch(
          [
            stamp.nome,
            stamp.unidade,
            CATEGORY_META[stamp.categoria].label,
            ...stamp.utilizadoresAutorizados,
            ...stamp.etapasPermitidas,
            ...stamp.tiposDocumento,
          ].join(" ")
        );
        if (!searchable.includes(query)) return false;
      }
      if (categoryFilter !== "todas" && stamp.categoria !== categoryFilter) return false;
      if (unitFilter !== "todas" && stamp.unidade !== unitFilter) return false;
      if (statusFilter === "activos" && !stamp.activo) return false;
      if (statusFilter === "inactivos" && stamp.activo) return false;
      return true;
    });
  }, [categoryFilter, search, stamps, statusFilter, unitFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = React.useMemo(() => {
    const active = stamps.filter((stamp) => stamp.activo).length;
    return {
      total: stamps.length,
      active,
      inactive: stamps.length - active,
      usage: stamps.reduce((total, stamp) => total + stamp.utilizacoes, 0),
    };
  }, [stamps]);

  const activeFilterCount =
    (categoryFilter !== "todas" ? 1 : 0) +
    (unitFilter !== "todas" ? 1 : 0) +
    (statusFilter !== "todos" ? 1 : 0);
  const hasSearchOrFilters = search.trim().length > 0 || activeFilterCount > 0;

  function openEditor(stamp: Stamp | null) {
    setEditorStamp(stamp);
    setEditorSession((current) => current + 1);
    setEditorOpen(true);
  }

  function handleEditorOpenChange(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditorStamp(null);
  }

  function handleSave(savedStamp: Stamp) {
    const isEditing = stamps.some((stamp) => stamp.id === savedStamp.id);
    setStamps((current) =>
      isEditing
        ? current.map((stamp) => (stamp.id === savedStamp.id ? savedStamp : stamp))
        : [savedStamp, ...current]
    );
    setEditorOpen(false);
    setEditorStamp(null);
    setPage(1);
    toast({
      title: isEditing ? "Carimbo actualizado" : "Carimbo criado",
      description: isEditing
        ? `As definições de «${savedStamp.nome}» foram guardadas.`
        : `O carimbo «${savedStamp.nome}» está disponível para utilização.`,
      variant: "success",
    });
  }

  function handleOpenUsage(stamp: Stamp) {
    if (stamp.utilizacoes === 0) {
      toast({
        title: "Sem utilizações registadas",
        description: `O carimbo «${stamp.nome}» ainda não foi aplicado a nenhum expediente.`,
      });
      return;
    }
    setEditorOpen(false);
    setEditorStamp(null);
    setUsageStamp(stamp);
  }

  function handleActivate(stamp: Stamp) {
    setStamps((current) =>
      current.map((item) => (item.id === stamp.id ? { ...item, activo: true } : item))
    );
    toast({
      title: "Carimbo activado",
      description: `«${stamp.nome}» pode voltar a ser utilizado nos expedientes.`,
      variant: "success",
    });
  }

  function handleDeactivateConfirmed() {
    if (!deactivateTarget) return;
    setStamps((current) =>
      current.map((item) =>
        item.id === deactivateTarget.id ? { ...item, activo: false } : item
      )
    );
    toast({
      title: "Carimbo desactivado",
      description: `«${deactivateTarget.nome}» deixou de estar disponível para novas utilizações.`,
      variant: "warning",
    });
    setDeactivateTarget(null);
  }

  function clearFilters() {
    setSearch("");
    setCategoryFilter("todas");
    setUnitFilter("todas");
    setStatusFilter("todos");
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Carimbos"
        description="Configuração, âmbito de utilização e histórico dos carimbos digitais."
        breadcrumb={[{ label: "Administração" }, { label: "Carimbos" }]}
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus className="size-4" />
            Novo carimbo
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total de carimbos" value={stats.total} icon="Stamp" tone="navy" />
          <StatCard label="Activos" value={stats.active} icon="CheckCircle2" tone="success" />
          <StatCard label="Inactivos" value={stats.inactive} icon="Ban" tone="graphite" />
          <StatCard
            label="Utilizações registadas"
            value={numberFormatter.format(stats.usage)}
            icon="History"
            tone="info"
          />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
            <div className="w-full sm:w-64">
              <SearchInput
                placeholder="Pesquisar carimbos…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                onClear={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Pesquisar carimbos"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[170px]" aria-label="Filtrar por categoria">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {(Object.entries(CATEGORY_META) as [Stamp["categoria"], (typeof CATEGORY_META)[Stamp["categoria"]]][]).map(
                  ([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Select
              value={unitFilter}
              onValueChange={(value) => {
                setUnitFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[190px]" aria-label="Filtrar por unidade">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as unidades</SelectItem>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[140px]" aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                icon={StampIcon}
                title="Nenhum carimbo encontrado"
                description={
                  hasSearchOrFilters
                    ? "Ajuste a pesquisa ou os filtros para consultar outros carimbos."
                    : "Crie o primeiro carimbo digital para começar."
                }
                action={
                  hasSearchOrFilters ? (
                    <Button variant="secondary" size="sm" onClick={clearFilters}>
                      Limpar pesquisa e filtros
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => openEditor(null)}>
                      <Plus className="size-3.5" />
                      Novo carimbo
                    </Button>
                  )
                }
              />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="min-w-[230px]">Carimbo</TableHeaderCell>
                      <TableHeaderCell>Categoria</TableHeaderCell>
                      <TableHeaderCell>Unidade</TableHeaderCell>
                      <TableHeaderCell>Utilizadores autorizados</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell>Utilizações</TableHeaderCell>
                      <TableHeaderCell>Última utilização</TableHeaderCell>
                      <TableHeaderCell className="w-10" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paged.map((stamp) => {
                      const category = CATEGORY_META[stamp.categoria];
                      return (
                        <TableRow key={stamp.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <StampPreview stamp={stamp} />
                              <div className="min-w-0">
                                <p className="max-w-[250px] truncate font-medium text-graphite-900">
                                  {stamp.nome}
                                </p>
                                <p className="mt-0.5 text-2xs text-graphite-500">
                                  {stamp.tamanho === "pequeno"
                                    ? "Pequeno"
                                    : stamp.tamanho === "medio"
                                      ? "Médio"
                                      : "Grande"}
                                  {" · "}
                                  {stamp.transparencia}% transparência
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={category.variant}>{category.label}</Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{stamp.unidade}</TableCell>
                          <TableCell>
                            <p
                              className="max-w-[240px] truncate text-graphite-700"
                              title={stamp.utilizadoresAutorizados.join(", ")}
                            >
                              {stamp.utilizadoresAutorizados.length > 0
                                ? stamp.utilizadoresAutorizados.join(", ")
                                : "Nenhum utilizador"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stamp.activo ? "success" : "neutral"}>
                              {stamp.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">
                            <button
                              type="button"
                              className={cn(
                                "font-medium text-navy-700 underline-offset-2",
                                stamp.utilizacoes > 0
                                  ? "hover:underline"
                                  : "cursor-default text-graphite-400"
                              )}
                              onClick={() => handleOpenUsage(stamp)}
                              aria-label={`Consultar utilizações de ${stamp.nome}`}
                            >
                              {numberFormatter.format(stamp.utilizacoes)}
                            </button>
                          </TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">
                            {stamp.ultimaUtilizacao
                              ? formatDate(stamp.ultimaUtilizacao, true)
                              : "Nunca utilizado"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  aria-label={`Acções para ${stamp.nome}`}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditor(stamp)}>
                                  <Pencil className="size-3.5" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenUsage(stamp)}>
                                  <History className="size-3.5" />
                                  Ver utilizações
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {stamp.activo ? (
                                  <DropdownMenuItem
                                    destructive
                                    onClick={() => setDeactivateTarget(stamp)}
                                  >
                                    <Ban className="size-3.5" />
                                    Desactivar
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleActivate(stamp)}>
                                    <CheckCircle2 className="size-3.5" />
                                    Activar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>

          {filtered.length > 0 && (
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </Card>
      </div>

      <StampEditorDrawer
        key={`${editorStamp?.id ?? "new"}-${editorSession}`}
        open={editorOpen}
        onOpenChange={handleEditorOpenChange}
        stamp={editorStamp}
        onSave={handleSave}
        onOpenUsage={handleOpenUsage}
      />

      <StampUsageDialog
        stamp={usageStamp}
        open={usageStamp !== null}
        onOpenChange={(open) => {
          if (!open) setUsageStamp(null);
        }}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="Desactivar carimbo"
        description={
          deactivateTarget
            ? `«${deactivateTarget.nome}» deixará de estar disponível para novas utilizações. O histórico existente será preservado.`
            : undefined
        }
        confirmLabel="Desactivar"
        destructive
        onConfirm={handleDeactivateConfirmed}
      />
    </div>
  );
}
