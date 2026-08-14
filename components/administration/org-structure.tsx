"use client";

import * as React from "react";
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  GitBranch,
  Hash,
  Layers3,
  Mail,
  Network,
  Pencil,
  Phone,
  SearchX,
  UserRound,
  Users,
} from "lucide-react";
import type { OrganizationalUnit, User } from "@/types";
import { useCatalogs } from "@/lib/catalogs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldHint, Input, Label, SearchInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const UNIT_TYPE_LABEL: Record<OrganizationalUnit["tipo"], string> = {
  direccao: "Direcção",
  departamento: "Departamento",
  seccao: "Secção",
  sector: "Sector",
  unidade: "Unidade",
};

const UNIT_TYPE_ICON: Record<
  OrganizationalUnit["tipo"],
  React.ComponentType<{ className?: string }>
> = {
  direccao: Building2,
  departamento: Briefcase,
  seccao: Layers3,
  sector: Network,
  unidade: GitBranch,
};

function typeVariant(
  tipo: OrganizationalUnit["tipo"]
): "navy" | "info" | "amber" | "success" | "neutral" {
  switch (tipo) {
    case "direccao":
      return "navy";
    case "departamento":
      return "info";
    case "seccao":
      return "amber";
    case "sector":
      return "success";
    case "unidade":
      return "neutral";
  }
}

function normalise(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getDescendantIds(unitId: string, units: OrganizationalUnit[]) {
  const descendantIds = new Set<string>();
  const pending = [unitId];

  while (pending.length > 0) {
    const parentId = pending.pop();
    for (const unit of units) {
      if (unit.parentId === parentId && !descendantIds.has(unit.id)) {
        descendantIds.add(unit.id);
        pending.push(unit.id);
      }
    }
  }

  return descendantIds;
}

function getHierarchyPath(
  unit: OrganizationalUnit,
  unitById: Map<string, OrganizationalUnit>
) {
  const path: OrganizationalUnit[] = [];
  const visited = new Set<string>();
  let current: OrganizationalUnit | undefined = unit;

  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    current = current.parentId ? unitById.get(current.parentId) : undefined;
  }

  return path;
}

interface UnitTreeNodeProps {
  unit: OrganizationalUnit;
  childrenByParent: Map<string | null, OrganizationalUnit[]>;
  usersById: Map<string, User>;
  usersByUnit: Map<string, User[]>;
  visibleIds: Set<string>;
  matchedIds: Set<string>;
  expandedIds: Set<string>;
  forceExpanded: boolean;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}

function UnitTreeNode({
  unit,
  childrenByParent,
  usersById,
  usersByUnit,
  visibleIds,
  matchedIds,
  expandedIds,
  forceExpanded,
  selectedId,
  onToggle,
  onSelect,
}: UnitTreeNodeProps) {
  const allChildren = childrenByParent.get(unit.id) ?? [];
  const visibleChildren = allChildren.filter((child) => visibleIds.has(child.id));
  const hasChildren = visibleChildren.length > 0;
  const isExpanded = forceExpanded || expandedIds.has(unit.id);
  const isSelected = selectedId === unit.id;
  const isContextOnly = forceExpanded && !matchedIds.has(unit.id);
  const manager = usersById.get(unit.responsavelId);
  const memberCount = usersByUnit.get(unit.id)?.length ?? 0;
  const Icon = UNIT_TYPE_ICON[unit.tipo];

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
    >
      <div
        className={cn(
          "group flex min-w-0 items-center gap-1 rounded-lg border bg-white p-1.5 transition-colors",
          isSelected
            ? "border-navy-300 bg-navy-50 shadow-xs"
            : "border-graphite-200 hover:border-graphite-300 hover:bg-graphite-25",
          isContextOnly && "border-dashed bg-graphite-25"
        )}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(unit.id)}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md text-graphite-400",
            hasChildren
              ? "hover:bg-graphite-100 hover:text-graphite-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/30"
              : "cursor-default"
          )}
          aria-label={
            hasChildren
              ? `${isExpanded ? "Recolher" : "Expandir"} ${unit.nome}`
              : `${unit.nome} não possui unidades subordinadas`
          }
          disabled={!hasChildren || forceExpanded}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )
          ) : (
            <span className="size-1.5 rounded-full bg-graphite-300" aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelect(unit.id)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/30"
          aria-label={`Ver detalhes de ${unit.nome}`}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md",
              unit.estado === "activo"
                ? "bg-navy-50 text-navy-700"
                : "bg-graphite-100 text-graphite-400"
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold text-graphite-900">
                {unit.nome}
              </span>
              <span className="shrink-0 text-2xs font-medium text-graphite-400">
                {unit.sigla}
              </span>
              {isContextOnly && (
                <Badge variant="neutral" className="hidden sm:inline-flex">
                  Contexto
                </Badge>
              )}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-2xs text-graphite-500">
              <Hash className="size-3" aria-hidden />
              {unit.codigo}
              <span aria-hidden>·</span>
              {UNIT_TYPE_LABEL[unit.tipo]}
            </span>
          </span>

          <span className="hidden min-w-0 basis-[220px] items-center gap-2 md:flex">
            {manager ? (
              <>
                <UserAvatar
                  name={manager.nome}
                  color={manager.avatarColor}
                  size="xs"
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium text-graphite-700">
                    {manager.nome}
                  </span>
                  <span className="block truncate text-2xs text-graphite-400">
                    Responsável
                  </span>
                </span>
              </>
            ) : (
              <span className="text-xs text-amber-700">Sem responsável válido</span>
            )}
          </span>

          <span className="hidden w-20 shrink-0 text-right text-2xs text-graphite-500 sm:block">
            <span className="block font-semibold tabular-nums text-graphite-700">
              {memberCount}
            </span>
            {memberCount === 1 ? "utilizador" : "utilizadores"}
          </span>

          <Badge
            variant={unit.estado === "activo" ? "success" : "neutral"}
            className="hidden shrink-0 xl:inline-flex"
          >
            {unit.estado === "activo" ? "Activo" : "Inactivo"}
          </Badge>

          <ChevronRight
            className="size-4 shrink-0 text-graphite-300 transition-transform group-hover:translate-x-0.5 group-hover:text-graphite-500"
            aria-hidden
          />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul
          role="group"
          className="ml-4 space-y-2 border-l border-graphite-200 py-2 pl-3 sm:ml-6 sm:pl-4"
        >
          {visibleChildren.map((child) => (
            <UnitTreeNode
              key={child.id}
              unit={child}
              childrenByParent={childrenByParent}
              usersById={usersById}
              usersByUnit={usersByUnit}
              visibleIds={visibleIds}
              matchedIds={matchedIds}
              expandedIds={expandedIds}
              forceExpanded={forceExpanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface UnitFormValues {
  nome: string;
  sigla: string;
  codigo: string;
  tipo: OrganizationalUnit["tipo"];
  parentId: string;
  responsavelId: string;
  substitutoId: string;
  email: string;
  telefone: string;
  ramal: string;
  estado: OrganizationalUnit["estado"];
}

function valuesFromUnit(unit: OrganizationalUnit): UnitFormValues {
  return {
    nome: unit.nome,
    sigla: unit.sigla,
    codigo: unit.codigo,
    tipo: unit.tipo,
    parentId: unit.parentId ?? "sem-parent",
    responsavelId: unit.responsavelId,
    substitutoId: unit.substitutoId ?? "sem-substituto",
    email: unit.contactos.email ?? "",
    telefone: unit.contactos.telefone ?? "",
    ramal: unit.contactos.ramal ?? "",
    estado: unit.estado,
  };
}

function UnitDetailsDrawer({
  unit,
  units,
  users,
  open,
  onOpenChange,
  onSave,
}: {
  unit: OrganizationalUnit | null;
  units: OrganizationalUnit[];
  users: User[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (unit: OrganizationalUnit) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [values, setValues] = React.useState<UnitFormValues | null>(
    unit ? valuesFromUnit(unit) : null
  );

  React.useEffect(() => {
    if (open && unit) {
      setValues(valuesFromUnit(unit));
      setEditing(false);
    }
  }, [open, unit]);

  if (!unit || !values) return null;
  const currentUnit = unit;
  const currentValues = values;

  const unitById = new Map(units.map((item) => [item.id, item]));
  const userById = new Map(users.map((user) => [user.id, user]));
  const hierarchyPath = getHierarchyPath(unit, unitById);
  const manager = userById.get(unit.responsavelId);
  const substitute = unit.substitutoId
    ? userById.get(unit.substitutoId)
    : undefined;
  const members = users.filter((user) => user.unidadeId === unit.id);
  const childUnits = units.filter((item) => item.parentId === unit.id);
  const descendantIds = getDescendantIds(unit.id, units);
  const possibleParents = units.filter(
    (item) => item.id !== unit.id && !descendantIds.has(item.id)
  );
  const duplicateCode = units.some(
    (item) =>
      item.id !== unit.id &&
      normalise(item.codigo.trim()) === normalise(values.codigo.trim())
  );
  const isValid =
    values.nome.trim().length > 0 &&
    values.sigla.trim().length > 0 &&
    values.codigo.trim().length > 0 &&
    values.responsavelId.length > 0 &&
    !duplicateCode;

  function setValue<K extends keyof UnitFormValues>(
    field: K,
    value: UnitFormValues[K]
  ) {
    setValues((current) => (current ? { ...current, [field]: value } : current));
  }

  function cancelEditing() {
    setValues(valuesFromUnit(currentUnit));
    setEditing(false);
  }

  function saveChanges(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    onSave({
      ...currentUnit,
      nome: currentValues.nome.trim(),
      sigla: currentValues.sigla.trim().toUpperCase(),
      codigo: currentValues.codigo.trim(),
      tipo: currentValues.tipo,
      parentId:
        currentValues.parentId === "sem-parent"
          ? null
          : currentValues.parentId,
      responsavelId: currentValues.responsavelId,
      substitutoId:
        currentValues.substitutoId === "sem-substituto"
          ? undefined
          : currentValues.substitutoId,
      contactos: {
        email: currentValues.email.trim() || undefined,
        telefone: currentValues.telefone.trim() || undefined,
        ramal: currentValues.ramal.trim() || undefined,
      },
      estado: currentValues.estado,
    });
    setEditing(false);
  }

  const drawerContent = editing ? (
    <form onSubmit={saveChanges} className="flex min-h-0 flex-1 flex-col">
      <DrawerHeader>
        <DrawerTitle>Editar unidade orgânica</DrawerTitle>
        <DrawerDescription>
          Actualize os dados institucionais da unidade.
        </DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="org-unit-name" required>
                Designação
              </Label>
              <Input
                id="org-unit-name"
                value={values.nome}
                onChange={(event) => setValue("nome", event.target.value)}
                placeholder="Nome completo da unidade"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="org-unit-acronym" required>
                Sigla
              </Label>
              <Input
                id="org-unit-acronym"
                value={values.sigla}
                onChange={(event) => setValue("sigla", event.target.value)}
                placeholder="Ex.: DAF"
                maxLength={12}
              />
            </div>
            <div>
              <Label htmlFor="org-unit-code" required>
                Código
              </Label>
              <Input
                id="org-unit-code"
                value={values.codigo}
                onChange={(event) => setValue("codigo", event.target.value)}
                placeholder="Ex.: 05.3"
                invalid={duplicateCode}
              />
              {duplicateCode && (
                <FieldHint error>Já existe uma unidade com este código.</FieldHint>
              )}
            </div>
            <div>
              <Label required>Tipo de unidade</Label>
              <Select
                value={values.tipo}
                onValueChange={(value) =>
                  setValue("tipo", value as OrganizationalUnit["tipo"])
                }
              >
                <SelectTrigger aria-label="Tipo de unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(UNIT_TYPE_LABEL) as [
                      OrganizationalUnit["tipo"],
                      string
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label required>Estado</Label>
              <Select
                value={values.estado}
                onValueChange={(value) =>
                  setValue("estado", value as OrganizationalUnit["estado"])
                }
              >
                <SelectTrigger aria-label="Estado da unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-graphite-150 pt-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
              Enquadramento hierárquico
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Unidade superior</Label>
                <Select
                  value={values.parentId}
                  onValueChange={(value) => setValue("parentId", value)}
                >
                  <SelectTrigger aria-label="Unidade superior">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-parent">
                      Sem unidade superior
                    </SelectItem>
                    {possibleParents.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.codigo} · {item.sigla} — {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint>
                  Unidades subordinadas não podem ser seleccionadas para evitar ciclos.
                </FieldHint>
              </div>
              <div>
                <Label required>Responsável</Label>
                <Select
                  value={values.responsavelId}
                  onValueChange={(value) => setValue("responsavelId", value)}
                >
                  <SelectTrigger aria-label="Responsável da unidade">
                    <SelectValue placeholder="Seleccionar responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nome} — {user.cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Substituto</Label>
                <Select
                  value={values.substitutoId}
                  onValueChange={(value) => setValue("substitutoId", value)}
                >
                  <SelectTrigger aria-label="Substituto do responsável">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-substituto">
                      Sem substituto definido
                    </SelectItem>
                    {users
                      .filter((user) => user.id !== values.responsavelId)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.nome} — {user.cargo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t border-graphite-150 pt-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite-500">
              Contactos institucionais
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="org-unit-email">E-mail</Label>
                <Input
                  id="org-unit-email"
                  type="email"
                  value={values.email}
                  onChange={(event) => setValue("email", event.target.value)}
                  placeholder="unidade@cfm.co.mz"
                />
              </div>
              <div>
                <Label htmlFor="org-unit-phone">Telefone</Label>
                <Input
                  id="org-unit-phone"
                  value={values.telefone}
                  onChange={(event) => setValue("telefone", event.target.value)}
                  placeholder="+258 21 43 0000"
                />
              </div>
              <div>
                <Label htmlFor="org-unit-extension">Ramal</Label>
                <Input
                  id="org-unit-extension"
                  value={values.ramal}
                  onChange={(event) => setValue("ramal", event.target.value)}
                  placeholder="Ex.: 2411"
                />
              </div>
            </div>
          </div>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <Button type="button" variant="secondary" onClick={cancelEditing}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid}>
          Guardar alterações
        </Button>
      </DrawerFooter>
    </form>
  ) : (
    <>
      <DrawerHeader>
        <div className="flex items-start gap-3 pr-8">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700"
            aria-hidden
          >
            {React.createElement(UNIT_TYPE_ICON[unit.tipo], {
              className: "size-5",
            })}
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Badge variant={typeVariant(unit.tipo)}>
                {UNIT_TYPE_LABEL[unit.tipo]}
              </Badge>
              <Badge variant={unit.estado === "activo" ? "success" : "neutral"}>
                {unit.estado === "activo" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <DrawerTitle>{unit.nome}</DrawerTitle>
            <DrawerDescription>
              {unit.sigla} · Código {unit.codigo}
            </DrawerDescription>
          </div>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
              Posição na estrutura
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-md border border-graphite-200 bg-graphite-25 px-3 py-2.5 text-xs text-graphite-600">
              {hierarchyPath.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && (
                    <ChevronRight className="size-3 text-graphite-300" aria-hidden />
                  )}
                  <span
                    className={cn(
                      index === hierarchyPath.length - 1 &&
                        "font-semibold text-navy-800"
                    )}
                  >
                    {item.sigla}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
              Responsabilidade
            </h3>
            <div className="mt-3 space-y-2.5">
              {manager ? (
                <div className="flex items-center gap-3 rounded-md border border-graphite-200 p-3">
                  <UserAvatar
                    name={manager.nome}
                    color={manager.avatarColor}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-graphite-900">
                      {manager.nome}
                    </p>
                    <p className="truncate text-xs text-graphite-500">
                      {manager.cargo}
                    </p>
                  </div>
                  <Badge variant="navy">Responsável</Badge>
                </div>
              ) : (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-800">
                  O responsável associado não foi encontrado.
                </div>
              )}
              {substitute && (
                <div className="flex items-center gap-3 rounded-md border border-graphite-200 p-3">
                  <UserAvatar
                    name={substitute.nome}
                    color={substitute.avatarColor}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-graphite-800">
                      {substitute.nome}
                    </p>
                    <p className="truncate text-xs text-graphite-500">
                      {substitute.cargo}
                    </p>
                  </div>
                  <Badge variant="neutral">Substituto</Badge>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
              Contactos
            </h3>
            <dl className="mt-3 divide-y divide-graphite-150 rounded-md border border-graphite-200">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Mail className="size-4 shrink-0 text-graphite-400" aria-hidden />
                <dt className="sr-only">E-mail</dt>
                <dd className="min-w-0 truncate text-[13px] text-graphite-700">
                  {unit.contactos.email ? (
                    <a
                      href={`mailto:${unit.contactos.email}`}
                      className="hover:text-navy-700 hover:underline"
                    >
                      {unit.contactos.email}
                    </a>
                  ) : (
                    "Sem e-mail definido"
                  )}
                </dd>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Phone className="size-4 shrink-0 text-graphite-400" aria-hidden />
                <dt className="sr-only">Telefone</dt>
                <dd className="text-[13px] text-graphite-700">
                  {unit.contactos.telefone ??
                    (unit.contactos.ramal
                      ? `Ramal ${unit.contactos.ramal}`
                      : "Sem telefone definido")}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
                Utilizadores da unidade
              </h3>
              <Badge variant="neutral">{members.length}</Badge>
            </div>
            {members.length > 0 ? (
              <div className="mt-3 space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 rounded-md bg-graphite-50 px-3 py-2"
                  >
                    <UserAvatar
                      name={member.nome}
                      color={member.avatarColor}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-graphite-800">
                        {member.nome}
                      </p>
                      <p className="truncate text-2xs text-graphite-500">
                        {member.cargo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-graphite-50 px-3 py-2.5 text-[13px] text-graphite-500">
                Nenhum utilizador está directamente associado a esta unidade.
              </p>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-graphite-500">
                Unidades subordinadas
              </h3>
              <Badge variant="neutral">{childUnits.length}</Badge>
            </div>
            {childUnits.length > 0 ? (
              <div className="mt-3 space-y-2">
                {childUnits.map((child) => {
                  const ChildIcon = UNIT_TYPE_ICON[child.tipo];
                  return (
                    <div
                      key={child.id}
                      className="flex items-center gap-2.5 rounded-md border border-graphite-200 px-3 py-2.5"
                    >
                      <ChildIcon className="size-4 text-navy-600" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-graphite-800">
                        {child.nome}
                      </span>
                      <span className="text-2xs font-semibold text-graphite-400">
                        {child.sigla}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-graphite-50 px-3 py-2.5 text-[13px] text-graphite-500">
                Esta unidade não possui unidades subordinadas.
              </p>
            )}
          </section>
        </div>
      </DrawerBody>
      <DrawerFooter className="justify-between">
        <p className="hidden text-2xs text-graphite-400 sm:block">
          Edição sincronizada com o PostgreSQL
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden />
            Editar unidade
          </Button>
        </div>
      </DrawerFooter>
    </>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="lg">{drawerContent}</DrawerContent>
    </Drawer>
  );
}

export function OrgStructure({
  users,
}: {
  users: User[];
}) {
  const { toast } = useToast();
  const {
    organizationalUnits: units,
    setOrganizationalUnits: setUnits,
  } = useCatalogs();
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("todos");
  const [statusFilter, setStatusFilter] = React.useState("todos");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(units.map((unit) => unit.id))
  );
  const [selectedUnitId, setSelectedUnitId] = React.useState<string | null>(
    null
  );

  const unitById = React.useMemo(
    () => new Map(units.map((unit) => [unit.id, unit])),
    [units]
  );
  const usersById = React.useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users]
  );
  const usersByUnit = React.useMemo(() => {
    const map = new Map<string, User[]>();
    for (const user of users) {
      const current = map.get(user.unidadeId) ?? [];
      current.push(user);
      map.set(user.unidadeId, current);
    }
    return map;
  }, [users]);
  const childrenByParent = React.useMemo(() => {
    const map = new Map<string | null, OrganizationalUnit[]>();
    for (const unit of units) {
      const parentKey =
        unit.parentId && unitById.has(unit.parentId) ? unit.parentId : null;
      const siblings = map.get(parentKey) ?? [];
      siblings.push(unit);
      map.set(parentKey, siblings);
    }
    for (const siblings of map.values()) {
      siblings.sort((a, b) =>
        a.codigo.localeCompare(b.codigo, "pt", { numeric: true })
      );
    }
    return map;
  }, [unitById, units]);

  const filtersActive =
    search.trim().length > 0 ||
    typeFilter !== "todos" ||
    statusFilter !== "todos";

  const { matchedIds, visibleIds } = React.useMemo(() => {
    const query = normalise(search.trim());
    const matched = new Set<string>();

    for (const unit of units) {
      const manager = usersById.get(unit.responsavelId);
      const searchable = normalise(
        [
          unit.nome,
          unit.sigla,
          unit.codigo,
          UNIT_TYPE_LABEL[unit.tipo],
          manager?.nome ?? "",
          manager?.email ?? "",
        ].join(" ")
      );
      const matchesQuery = !query || searchable.includes(query);
      const matchesType = typeFilter === "todos" || unit.tipo === typeFilter;
      const matchesStatus =
        statusFilter === "todos" || unit.estado === statusFilter;

      if (matchesQuery && matchesType && matchesStatus) {
        matched.add(unit.id);
      }
    }

    if (!filtersActive) {
      return {
        matchedIds: new Set(units.map((unit) => unit.id)),
        visibleIds: new Set(units.map((unit) => unit.id)),
      };
    }

    const visible = new Set(matched);
    for (const id of matched) {
      let current = unitById.get(id);
      const visited = new Set<string>();
      while (current?.parentId && !visited.has(current.parentId)) {
        visible.add(current.parentId);
        visited.add(current.parentId);
        current = unitById.get(current.parentId);
      }
    }

    return { matchedIds: matched, visibleIds: visible };
  }, [
    filtersActive,
    search,
    statusFilter,
    typeFilter,
    unitById,
    units,
    usersById,
  ]);

  const roots = (childrenByParent.get(null) ?? []).filter((unit) =>
    visibleIds.has(unit.id)
  );
  const selectedUnit = selectedUnitId
    ? unitById.get(selectedUnitId) ?? null
    : null;
  const allExpanded = units.every((unit) => expandedIds.has(unit.id));
  const activeFilterCount =
    (typeFilter !== "todos" ? 1 : 0) +
    (statusFilter !== "todos" ? 1 : 0);

  const stats = React.useMemo(
    () => ({
      total: units.length,
      active: units.filter((unit) => unit.estado === "activo").length,
      directions: units.filter((unit) => unit.tipo === "direccao").length,
      users: users.filter((user) => user.estado === "activo").length,
    }),
    [units, users]
  );

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setExpandedIds(
      allExpanded ? new Set<string>() : new Set(units.map((unit) => unit.id))
    );
  }

  function clearFilters() {
    setSearch("");
    setTypeFilter("todos");
    setStatusFilter("todos");
  }

  function saveUnit(updatedUnit: OrganizationalUnit) {
    setUnits((current) =>
      current.map((unit) => (unit.id === updatedUnit.id ? updatedUnit : unit))
    );
    toast({
      title: "Unidade actualizada",
      description: `As alterações de ${updatedUnit.sigla} foram guardadas.`,
      variant: "success",
    });
  }

  return (
    <div>
      <PageHeader
        title="Estrutura organizacional"
        description="Hierarquia das unidades orgânicas, responsáveis e equipas associadas."
        breadcrumb={[
          { label: "Administração" },
          { label: "Estrutura organizacional" },
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={toggleAll}
            disabled={filtersActive}
          >
            {allExpanded ? (
              <ChevronsDownUp className="size-4" aria-hidden />
            ) : (
              <ChevronsUpDown className="size-4" aria-hidden />
            )}
            {allExpanded ? "Recolher estrutura" : "Expandir estrutura"}
          </Button>
        }
      />

      <div className="space-y-5 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Unidades orgânicas"
            value={stats.total}
            icon="Network"
            tone="navy"
          />
          <StatCard
            label="Unidades activas"
            value={stats.active}
            icon="Building2"
            tone="success"
          />
          <StatCard
            label="Direcções"
            value={stats.directions}
            icon="Landmark"
            tone="info"
          />
          <StatCard
            label="Utilizadores activos"
            value={stats.users}
            icon="Users"
            tone="graphite"
          />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="w-full lg:max-w-sm lg:flex-1">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="Pesquisar unidade, sigla, código ou responsável…"
                aria-label="Pesquisar na estrutura organizacional"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  className="w-full sm:w-[170px]"
                  aria-label="Filtrar por tipo de unidade"
                >
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {(
                    Object.entries(UNIT_TYPE_LABEL) as [
                      OrganizationalUnit["tipo"],
                      string
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger
                  className="w-full sm:w-[145px]"
                  aria-label="Filtrar por estado"
                >
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(activeFilterCount > 0 || search) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </CardHeader>

          <div className="flex flex-col gap-2 border-b border-graphite-150 bg-graphite-25 px-4 py-2.5 text-xs text-graphite-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {matchedIds.size === units.length && !filtersActive
                ? `${units.length} unidades na estrutura`
                : `${matchedIds.size} de ${units.length} unidades correspondem aos filtros`}
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="size-3.5" aria-hidden />
              Seleccione uma unidade para consultar os detalhes
            </span>
          </div>

          <CardContent className="p-3 sm:p-4">
            {roots.length > 0 ? (
              <ul
                role="tree"
                aria-label="Hierarquia das unidades orgânicas"
                className="space-y-2"
              >
                {roots.map((unit) => (
                  <UnitTreeNode
                    key={unit.id}
                    unit={unit}
                    childrenByParent={childrenByParent}
                    usersById={usersById}
                    usersByUnit={usersByUnit}
                    visibleIds={visibleIds}
                    matchedIds={matchedIds}
                    expandedIds={expandedIds}
                    forceExpanded={filtersActive}
                    selectedId={selectedUnitId}
                    onToggle={toggleExpanded}
                    onSelect={setSelectedUnitId}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nenhuma unidade encontrada"
                description="Tente outro termo ou remova os filtros aplicados."
                action={
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Limpar pesquisa e filtros
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-graphite-200 bg-white px-4 py-3 text-xs text-graphite-500">
          <span className="flex items-center gap-1.5">
            <UserRound className="size-3.5 text-navy-600" aria-hidden />
            Responsável institucional
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-navy-600" aria-hidden />
            Utilizadores directamente associados
          </span>
          <span className="ml-auto hidden text-graphite-400 sm:block">
          As alterações ficam disponíveis em todo o sistema.
          </span>
        </div>
      </div>

      <UnitDetailsDrawer
        unit={selectedUnit}
        units={units}
        users={users}
        open={!!selectedUnit}
        onOpenChange={(open) => {
          if (!open) setSelectedUnitId(null);
        }}
        onSave={saveUnit}
      />
    </div>
  );
}
