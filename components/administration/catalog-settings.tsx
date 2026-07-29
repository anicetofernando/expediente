"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  FileInput,
  LockKeyhole,
  Pencil,
  RotateCcw,
  Shield,
  Star,
  Stamp,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCatalogs, type CatalogOption } from "@/lib/catalogs";

type SetCatalog = (items: CatalogOption[]) => void;

interface CatalogDefinition {
  value: string;
  label: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: CatalogOption[];
  setItems: SetCatalog;
}

interface EditState {
  id: string;
  label: string;
  description: string;
}

function normaliseOrder(items: CatalogOption[]) {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
}

function CatalogTable({
  items,
  setItems,
}: {
  items: CatalogOption[];
  setItems: SetCatalog;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<EditState | null>(null);
  const orderedItems = React.useMemo(() => normaliseOrder(items), [items]);

  function beginEdit(item: CatalogOption) {
    setEditing({
      id: item.id,
      label: item.label,
      description: item.description ?? "",
    });
  }

  function saveEdit() {
    if (!editing) return;

    const label = editing.label.trim();
    if (!label) {
      toast({
        title: "Nome obrigatório",
        description: "Indique o nome apresentado nesta lista.",
        variant: "warning",
      });
      return;
    }

    setItems(
      orderedItems.map((item) =>
        item.id === editing.id
          ? {
              ...item,
              label,
              description: editing.description.trim(),
            }
          : item
      )
    );
    setEditing(null);
  }

  function move(itemId: string, direction: -1 | 1) {
    const currentIndex = orderedItems.findIndex((item) => item.id === itemId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedItems.length)
      return;

    const next = [...orderedItems];
    [next[currentIndex], next[targetIndex]] = [
      next[targetIndex],
      next[currentIndex],
    ];
    setItems(next.map((item, index) => ({ ...item, order: index + 1 })));
  }

  function setActive(itemId: string, active: boolean) {
    const target = orderedItems.find((item) => item.id === itemId);
    if (!target) return;

    if (!active && target.isDefault) {
      const replacement = orderedItems.find(
        (item) => item.id !== itemId && item.active
      );
      if (!replacement) {
        toast({
          title: "Opção necessária",
          description:
            "Mantenha pelo menos uma opção activa para esta lista.",
          variant: "warning",
        });
        return;
      }

      setItems(
        orderedItems.map((item) => ({
          ...item,
          active: item.id === itemId ? false : item.active,
          isDefault: item.id === replacement.id,
        }))
      );
      return;
    }

    setItems(
      orderedItems.map((item) =>
        item.id === itemId ? { ...item, active } : item
      )
    );
  }

  function setDefault(itemId: string) {
    setItems(
      orderedItems.map((item) => ({
        ...item,
        active: item.id === itemId ? true : item.active,
        isDefault: item.id === itemId,
      }))
    );
  }

  return (
    <TableContainer>
      <Table className="min-w-[900px]">
        <TableHead>
          <tr>
            <TableHeaderCell className="w-16 text-center">Ordem</TableHeaderCell>
            <TableHeaderCell className="w-36">Código</TableHeaderCell>
            <TableHeaderCell className="w-[24%]">Nome apresentado</TableHeaderCell>
            <TableHeaderCell>Descrição</TableHeaderCell>
            <TableHeaderCell className="w-24 text-center">Activo</TableHeaderCell>
            <TableHeaderCell className="w-28 text-center">
              Predefinido
            </TableHeaderCell>
            <TableHeaderCell className="w-32 text-right">Acções</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {orderedItems.map((item, index) => {
            const isEditing = editing?.id === item.id;

            return (
              <TableRow
                key={item.id}
                className={!item.active ? "bg-graphite-25" : undefined}
              >
                <TableCell className="text-center font-mono text-graphite-500">
                  {String(index + 1).padStart(2, "0")}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase text-graphite-600">
                    <LockKeyhole className="size-3 text-graphite-400" />
                    {item.code}
                  </span>
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editing.label}
                      onChange={(event) =>
                        setEditing({ ...editing, label: event.target.value })
                      }
                      aria-label={`Nome de ${item.code}`}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={
                        item.active
                          ? "font-medium text-graphite-900"
                          : "font-medium text-graphite-500"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Textarea
                      value={editing.description}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          description: event.target.value,
                        })
                      }
                      className="min-h-14 resize-y"
                      aria-label={`Descrição de ${item.code}`}
                    />
                  ) : (
                    <span className="line-clamp-2 text-graphite-500">
                      {item.description || "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={item.active}
                    onCheckedChange={(checked) => setActive(item.id, checked)}
                    aria-label={`${item.active ? "Desactivar" : "Activar"} ${
                      item.label
                    }`}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <button
                    type="button"
                    onClick={() => setDefault(item.id)}
                    className="inline-flex size-7 items-center justify-center rounded-sm text-graphite-400 hover:bg-graphite-100 hover:text-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-500"
                    aria-label={`Definir ${item.label} como predefinido`}
                    aria-pressed={item.isDefault}
                    title={
                      item.isDefault
                        ? "Opção predefinida"
                        : "Definir como predefinida"
                    }
                  >
                    <Star
                      className={
                        item.isDefault
                          ? "size-4 fill-navy-800 text-navy-800"
                          : "size-4"
                      }
                    />
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={saveEdit}
                          aria-label="Guardar edição"
                          title="Guardar"
                        >
                          <Check className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(null)}
                          aria-label="Cancelar edição"
                          title="Cancelar"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => beginEdit(item)}
                          aria-label={`Editar ${item.label}`}
                          title="Editar nome e descrição"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => move(item.id, -1)}
                          disabled={index === 0}
                          aria-label={`Subir ${item.label}`}
                          title="Subir"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => move(item.id, 1)}
                          disabled={index === orderedItems.length - 1}
                          aria-label={`Descer ${item.label}`}
                          title="Descer"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function CatalogSettings() {
  const {
    priorities,
    setPriorities,
    confidentialities,
    setConfidentialities,
    documentOrigins,
    setDocumentOrigins,
    stampChoices,
    setStampChoices,
    resetCatalogs,
  } = useCatalogs();

  const catalogs: CatalogDefinition[] = [
    {
      value: "prioridades",
      label: "Prioridades",
      title: "Prioridades",
      description: "Níveis usados na classificação e ordenação dos expedientes.",
      icon: Zap,
      items: priorities,
      setItems: setPriorities,
    },
    {
      value: "confidencialidade",
      label: "Confidencialidade",
      title: "Níveis de confidencialidade",
      description: "Classificações que controlam a visibilidade dos documentos.",
      icon: Shield,
      items: confidentialities,
      setItems: setConfidentialities,
    },
    {
      value: "origens",
      label: "Origem documental",
      title: "Origens do documento",
      description: "Formas disponíveis para iniciar o documento principal.",
      icon: FileInput,
      items: documentOrigins,
      setItems: setDocumentOrigins,
    },
    {
      value: "carimbos",
      label: "Aplicação de carimbo",
      title: "Opções de carimbo",
      description: "Modos disponíveis para aplicar carimbos ao expediente.",
      icon: Stamp,
      items: stampChoices,
      setItems: setStampChoices,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Listas utilizadas nos formulários</CardTitle>
          <CardDescription>
            Personalize nomes, ordem, disponibilidade e valor predefinido.
          </CardDescription>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={resetCatalogs}
        >
          <RotateCcw className="size-3.5" />
          Repor listas
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="prioridades">
          <TabsList className="px-2">
            {catalogs.map((catalog) => {
              const Icon = catalog.icon;
              const activeCount = catalog.items.filter(
                (item) => item.active
              ).length;
              return (
                <TabsTrigger
                  key={catalog.value}
                  value={catalog.value}
                  className="gap-1.5"
                >
                  <Icon className="size-3.5" />
                  {catalog.label}
                  <Badge variant="neutral" className="ml-0.5">
                    {activeCount}/{catalog.items.length}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {catalogs.map((catalog) => (
            <TabsContent
              key={catalog.value}
              value={catalog.value}
              className="m-0"
            >
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-graphite-200 px-3 py-2.5">
                <div>
                  <p className="text-[13px] font-semibold text-graphite-900">
                    {catalog.title}
                  </p>
                  <p className="text-xs text-graphite-500">
                    {catalog.description}
                  </p>
                </div>
                <Badge variant="navy">Códigos protegidos</Badge>
              </div>
              <CatalogTable
                items={catalog.items}
                setItems={catalog.setItems}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
