"use client";

import * as React from "react";
import {
  CalendarClock,
  KeyRound,
  MoreVertical,
  PenLine,
  PenTool,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import type { Signature } from "@/types";
import { signatures as initialSignatures } from "@/data/signatures";
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
import { Input, Label, SearchInput } from "@/components/ui/input";
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

const STATUS_LABEL: Record<Signature["estado"], string> = {
  activa: "Activa",
  expirada: "Expirada",
  revogada: "Revogada",
};

const STATUS_VARIANT: Record<
  Signature["estado"],
  "success" | "amber" | "crimson"
> = {
  activa: "success",
  expirada: "amber",
  revogada: "crimson",
};

export default function AssinaturasPage() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<Signature[]>(initialSignatures);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("todos");
  const [open, setOpen] = React.useState(false);
  const [nome, setNome] = React.useState("");
  const [cargo, setCargo] = React.useState("");
  const [unidade, setUnidade] = React.useState("");
  const [validadeFim, setValidadeFim] = React.useState("2027-12-31");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.proprietario.toLowerCase().includes(query) ||
        item.cargo.toLowerCase().includes(query) ||
        item.unidade.toLowerCase().includes(query);
      const matchesStatus = status === "todos" || item.estado === status;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, status]);

  const activeCount = items.filter((item) => item.estado === "activa").length;
  const protectedCount = items.filter(
    (item) => item.requerPin || item.requer2FA
  ).length;
  const expiringCount = items.filter((item) => item.estado !== "activa").length;
  const usageCount = items.reduce((total, item) => total + item.utilizacoes, 0);

  function resetForm() {
    setNome("");
    setCargo("");
    setUnidade("");
    setValidadeFim("2027-12-31");
  }

  function createSignature() {
    const signature: Signature = {
      id: `sig-${Date.now()}`,
      proprietario: nome.trim(),
      cargo: cargo.trim(),
      unidade: unidade.trim(),
      validadeInicio: new Date().toISOString().slice(0, 10),
      validadeFim,
      documentosPermitidos: ["Despacho", "Ofício"],
      requerPin: true,
      requer2FA: true,
      estado: "activa",
      utilizacoes: 0,
    };
    setItems((current) => [signature, ...current]);
    setOpen(false);
    resetForm();
    toast({
      title: "Assinatura registada",
      description: `A assinatura de ${signature.proprietario} está pronta para utilização.`,
      variant: "success",
    });
  }

  function renew(item: Signature) {
    const currentExpiry = new Date(`${item.validadeFim}T12:00:00`);
    const base = currentExpiry > new Date() ? currentExpiry : new Date();
    base.setFullYear(base.getFullYear() + 1);
    setItems((current) =>
      current.map((signature) =>
        signature.id === item.id
          ? {
              ...signature,
              validadeFim: base.toISOString().slice(0, 10),
              estado: "activa",
            }
          : signature
      )
    );
    toast({
      title: "Validade renovada",
      description: `A assinatura de ${item.proprietario} foi renovada por mais um ano.`,
      variant: "success",
    });
  }

  function revoke(item: Signature) {
    setItems((current) =>
      current.map((signature) =>
        signature.id === item.id
          ? { ...signature, estado: "revogada" }
          : signature
      )
    );
    toast({
      title: "Assinatura revogada",
      description: `${item.proprietario} já não pode assinar documentos com este certificado.`,
      variant: "warning",
    });
  }

  return (
    <div>
      <PageHeader
        title="Assinaturas"
        description="Gestão de assinaturas digitais autorizadas, validade e mecanismos de segurança."
        breadcrumb={[
          { label: "Administração" },
          { label: "Assinaturas" },
        ]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Registar assinatura
          </Button>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Assinaturas activas"
            value={activeCount}
            icon="PenTool"
            tone="success"
          />
          <StatCard
            label="Com PIN ou 2FA"
            value={protectedCount}
            icon="ShieldCheck"
            tone="navy"
          />
          <StatCard
            label="A rever"
            value={expiringCount}
            icon="CalendarClock"
            tone="amber"
          />
          <StatCard
            label="Utilizações"
            value={usageCount.toLocaleString("pt-PT")}
            icon="FileSignature"
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
                placeholder="Pesquisar proprietário, cargo ou unidade…"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="expirada">Expiradas</SelectItem>
                <SelectItem value="revogada">Revogadas</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-graphite-500">
              {filtered.length} de {items.length} assinaturas
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Proprietário</TableHeaderCell>
                    <TableHeaderCell>Unidade</TableHeaderCell>
                    <TableHeaderCell>Documentos</TableHeaderCell>
                    <TableHeaderCell>Segurança</TableHeaderCell>
                    <TableHeaderCell>Validade</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Utilizações</TableHeaderCell>
                    <TableHeaderCell className="w-10" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium text-graphite-900">
                          {item.proprietario}
                        </p>
                        <p className="mt-0.5 text-2xs text-graphite-500">
                          {item.cargo}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        {item.unidade}
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-[240px] flex-wrap gap-1">
                          {item.documentosPermitidos.slice(0, 2).map((documento) => (
                            <Badge key={documento}>{documento}</Badge>
                          ))}
                          {item.documentosPermitidos.length > 2 && (
                            <Badge variant="navy">
                              +{item.documentosPermitidos.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.requerPin && (
                            <Badge variant="navy">
                              <KeyRound className="size-3" /> PIN
                            </Badge>
                          )}
                          {item.requer2FA && (
                            <Badge variant="info">2FA</Badge>
                          )}
                          {!item.requerPin && !item.requer2FA && (
                            <span className="text-graphite-400">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        {formatDate(item.validadeInicio)} —{" "}
                        {formatDate(item.validadeFim)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[item.estado]}>
                          {STATUS_LABEL[item.estado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.utilizacoes}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={`Acções para ${item.proprietario}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => renew(item)}>
                              <RefreshCw className="size-3.5" />
                              Renovar por um ano
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast({
                                  title: "Permissões da assinatura",
                                  description: `${item.documentosPermitidos.length} tipos de documento autorizados para ${item.proprietario}.`,
                                })
                              }
                            >
                              <PenLine className="size-3.5" />
                              Rever permissões
                            </DropdownMenuItem>
                            {item.estado !== "revogada" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  destructive
                                  onClick={() => revoke(item)}
                                >
                                  <ShieldX className="size-3.5" />
                                  Revogar assinatura
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
                <PenTool className="mx-auto size-8 text-graphite-300" />
                <p className="mt-3 text-sm font-medium text-graphite-700">
                  Nenhuma assinatura encontrada
                </p>
                <p className="mt-1 text-xs text-graphite-500">
                  Altere os filtros para consultar outros certificados.
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
            <DialogTitle>Registar assinatura digital</DialogTitle>
            <DialogDescription>
              Associe um certificado de assinatura a um responsável autorizado.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="signature-owner" required>
                Proprietário
              </Label>
              <Input
                id="signature-owner"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="signature-job" required>
                Cargo
              </Label>
              <Input
                id="signature-job"
                value={cargo}
                onChange={(event) => setCargo(event.target.value)}
                placeholder="Cargo institucional"
              />
            </div>
            <div>
              <Label htmlFor="signature-unit" required>
                Unidade
              </Label>
              <Input
                id="signature-unit"
                value={unidade}
                onChange={(event) => setUnidade(event.target.value)}
                placeholder="Unidade orgânica"
              />
            </div>
            <div>
              <Label htmlFor="signature-expiry" required>
                Válida até
              </Label>
              <Input
                id="signature-expiry"
                type="date"
                value={validadeFim}
                onChange={(event) => setValidadeFim(event.target.value)}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !nome.trim() ||
                !cargo.trim() ||
                !unidade.trim() ||
                !validadeFim
              }
              onClick={createSignature}
            >
              <ShieldCheck className="size-4" />
              Registar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
