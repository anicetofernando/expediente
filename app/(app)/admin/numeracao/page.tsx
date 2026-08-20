"use client";

import * as React from "react";
import { CheckCircle2, Globe, Pencil, RotateCcw } from "lucide-react";
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
import { FieldHint, Input, Label, SearchInput } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useDatabaseSetting } from "@/lib/use-database-setting";
import { CatalogsProvider, useCatalogs } from "@/lib/catalogs";

type Separator = "/" | "-" | ".";

interface UnitNumberingConfig {
  unitId: string;
  prefixoInstitucional: string;
  separador: Separator;
  digitos: number;
  reinicioAnual: boolean;
}

const GLOBAL_ID = "";
const GLOBAL_DEFAULT: UnitNumberingConfig = { unitId: GLOBAL_ID, prefixoInstitucional: "CFM", separador: "/", digitos: 4, reinicioAnual: true };
const INITIAL_CONFIG: UnitNumberingConfig[] = [GLOBAL_DEFAULT];

function formatPreview(config: UnitNumberingConfig, acronym: string) {
  return [config.prefixoInstitucional, acronym, new Date().getFullYear(), "0".repeat(config.digitos)].join(config.separador);
}

function NumeracaoContent() {
  const { toast } = useToast();
  const { organizationalUnits } = useCatalogs();
  const [config, setConfig] = useDatabaseSetting<UnitNumberingConfig[]>("numbering", INITIAL_CONFIG);
  const [search, setSearch] = React.useState("");
  const [editing, setEditing] = React.useState<{ unitId: string; label: string; acronym: string } | null>(null);
  const [prefix, setPrefix] = React.useState("");
  const [digits, setDigits] = React.useState("4");
  const [separator, setSeparator] = React.useState<Separator>("/");
  const [annualReset, setAnnualReset] = React.useState(true);

  const global = config.find((item) => item.unitId === GLOBAL_ID) ?? GLOBAL_DEFAULT;
  const overrides = config.filter((item) => item.unitId !== GLOBAL_ID);
  const activeUnits = organizationalUnits.filter((unit) => unit.estado === "activo");

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return activeUnits;
    return activeUnits.filter((unit) => unit.nome.toLowerCase().includes(query) || unit.sigla.toLowerCase().includes(query));
  }, [activeUnits, search]);

  function effectiveConfig(unitId: string) {
    return overrides.find((item) => item.unitId === unitId) ?? global;
  }

  function openEditor(unitId: string, label: string, acronym: string) {
    const current = unitId === GLOBAL_ID ? global : effectiveConfig(unitId);
    setPrefix(current.prefixoInstitucional);
    setDigits(String(current.digitos));
    setSeparator(current.separador);
    setAnnualReset(current.reinicioAnual);
    setEditing({ unitId, label, acronym });
  }

  function save() {
    if (!editing) return;
    const updated: UnitNumberingConfig = {
      unitId: editing.unitId,
      prefixoInstitucional: prefix.trim().toUpperCase() || "CFM",
      separador: separator,
      digitos: Number(digits),
      reinicioAnual: annualReset,
    };
    setConfig((current) => {
      const withoutThis = current.filter((item) => item.unitId !== editing.unitId);
      return [...withoutThis, updated];
    });
    const example = [updated.prefixoInstitucional, editing.acronym, new Date().getFullYear(), "1".padStart(updated.digitos, "0")].join(updated.separador);
    toast({ title: "Formato de numeração actualizado", description: `Exemplo do próximo protocolo: ${example}`, variant: "success" });
    setEditing(null);
  }

  function clearOverride(unitId: string) {
    setConfig((current) => current.filter((item) => item.unitId !== unitId));
    toast({ title: "Excepção removida", description: "Esta unidade volta a usar a predefinição global.", variant: "success" });
  }

  return (
    <div>
      <PageHeader
        title="Numeração"
        description="Formato dos números de protocolo reais, por unidade — este formato é o que efectivamente é usado ao submeter um expediente."
        breadcrumb={[{ label: "Administração" }, { label: "Numeração" }]}
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard label="Predefinição global" value={formatPreview(global, "SIGLA")} icon="Hash" tone="navy" />
          <StatCard label="Unidades com excepção" value={overrides.length} icon="ListOrdered" tone="info" />
          <StatCard label="Reinício anual (global)" value={global.reinicioAnual ? "Sim" : "Não"} icon="CalendarDays" tone={global.reinicioAnual ? "success" : "graphite"} />
          <StatCard label="Ano corrente" value={new Date().getFullYear()} icon="CalendarCheck2" tone="graphite" />
        </div>

        <Card>
          <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                <Globe className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-graphite-900">Predefinição global</p>
                <code className="text-xs text-graphite-500">{formatPreview(global, "SIGLA")}</code>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => openEditor(GLOBAL_ID, "Predefinição global", "SIGLA")}>
              <Pencil className="size-3.5" />
              Editar predefinição
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex-col items-stretch sm:flex-row sm:items-center sm:justify-start">
            <div className="w-full sm:w-72">
              <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Pesquisar unidade…" />
            </div>
            <span className="ml-auto text-xs text-graphite-500">{filtered.length} unidades</span>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Unidade</TableHeaderCell>
                    <TableHeaderCell>Formato do protocolo</TableHeaderCell>
                    <TableHeaderCell>Reinício</TableHeaderCell>
                    <TableHeaderCell>Origem</TableHeaderCell>
                    <TableHeaderCell className="w-40" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((unit) => {
                    const cfg = effectiveConfig(unit.id);
                    const hasOverride = overrides.some((item) => item.unitId === unit.id);
                    return (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <p className="font-medium text-graphite-900">{unit.nome}</p>
                          <p className="mt-0.5 text-2xs text-graphite-500">Sigla {unit.sigla}</p>
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-graphite-100 px-2 py-1 text-xs text-graphite-700">{formatPreview(cfg, unit.sigla)}</code>
                        </TableCell>
                        <TableCell>
                          {cfg.reinicioAnual ? (
                            <span className="flex items-center gap-1.5 text-xs"><RotateCcw className="size-3.5 text-info-600" />Anual</span>
                          ) : (
                            <span className="text-xs text-graphite-500">Contínuo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={hasOverride ? "info" : "neutral"}>{hasOverride ? "Excepção própria" : "Predefinição global"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="secondary" size="sm" onClick={() => openEditor(unit.id, unit.nome, unit.sigla)}>
                              <Pencil className="size-3.5" />
                              Editar
                            </Button>
                            {hasOverride && (
                              <Button variant="ghost" size="sm" onClick={() => clearOverride(unit.id)}>
                                Remover
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(value) => !value && setEditing(null)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{editing?.unitId === GLOBAL_ID ? "Editar predefinição global" : `Excepção para ${editing?.label}`}</DialogTitle>
            <DialogDescription>
              {editing?.unitId === GLOBAL_ID
                ? "Aplica-se a todas as unidades que não tenham uma excepção própria."
                : "Substitui a predefinição global apenas para esta unidade."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="numbering-prefix" required>Prefixo institucional</Label>
                <Input id="numbering-prefix" value={prefix} onChange={(event) => setPrefix(event.target.value.toUpperCase().slice(0, 8))} placeholder="CFM" />
              </div>
              <div>
                <Label>Dígitos</Label>
                <Select value={digits} onValueChange={setDigits}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={separator} onValueChange={(value) => setSeparator(value as Separator)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/">Barra /</SelectItem>
                    <SelectItem value="-">Hífen -</SelectItem>
                    <SelectItem value=".">Ponto .</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {prefix.trim() && editing && (
              <div className="rounded-lg border border-info-200 bg-info-50 p-3">
                <p className="text-xs font-medium text-info-800">Pré-visualização</p>
                <p className="mt-1 font-mono text-sm text-info-900">
                  {[prefix.trim().toUpperCase(), editing.acronym, new Date().getFullYear(), "1".padStart(Number(digits), "0")].join(separator)}
                </p>
              </div>
            )}
            <label className="flex items-center justify-between rounded-lg border border-graphite-200 p-3.5">
              <div>
                <p className="text-[13px] font-medium text-graphite-800">Reiniciar no início de cada ano</p>
                <p className="mt-0.5 text-xs text-graphite-500">A contagem regressa a 1 mantendo o ano na referência.</p>
              </div>
              <Switch checked={annualReset} onCheckedChange={setAnnualReset} />
            </label>
            <FieldHint>Este formato é usado de imediato ao submeter o próximo expediente — não é uma pré-visualização apenas.</FieldHint>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button disabled={!prefix.trim()} onClick={save}>
              <CheckCircle2 className="size-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NumeracaoPage() {
  return <CatalogsProvider><NumeracaoContent /></CatalogsProvider>;
}
