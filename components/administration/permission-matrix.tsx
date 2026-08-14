"use client";

import * as React from "react";
import { CheckSquare, Square, GitCompare, Check, X, Save } from "lucide-react";
import type { Profile } from "@/types";
import { permissionModules } from "@/data/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";

const ALL_PERMISSIONS = permissionModules.flatMap((m) => m.permissoes.map((p) => ({ ...p, modulo: m.modulo })));
const ALL_PERMISSION_IDS = ALL_PERMISSIONS.map((p) => p.id);

type PermMap = Record<string, Set<string>>;

function buildInitialMap(profiles: Profile[]): PermMap {
  const map: PermMap = {};
  for (const p of profiles) {
    map[p.id] = new Set(p.permissoes.includes("*") ? ALL_PERMISSION_IDS : p.permissoes);
  }
  return map;
}

export function PermissionMatrix({ profiles }: { profiles: Profile[] }) {
  const { toast } = useToast();
  const [permMap, setPermMap] = React.useState<PermMap>(() => buildInitialMap(profiles));
  const [search, setSearch] = React.useState("");
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [profileAId, setProfileAId] = React.useState(profiles[0]?.id ?? "");
  const [profileBId, setProfileBId] = React.useState(profiles[1]?.id ?? profiles[0]?.id ?? "");
  const [changed, setChanged] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const filteredModules = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return permissionModules;
    return permissionModules
      .map((m) => ({ ...m, permissoes: m.permissoes.filter((p) => p.label.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q)) }))
      .filter((m) => m.permissoes.length > 0);
  }, [search]);

  const filteredIds = React.useMemo(() => filteredModules.flatMap((m) => m.permissoes.map((p) => p.id)), [filteredModules]);

  function toggle(profileId: string, permissionId: string) {
    setChanged(true);
    setPermMap((prev) => {
      const next = { ...prev, [profileId]: new Set(prev[profileId]) };
      if (next[profileId].has(permissionId)) next[profileId].delete(permissionId);
      else next[profileId].add(permissionId);
      return next;
    });
  }

  function selectAllFiltered() {
    setChanged(true);
    setPermMap((prev) => {
      const next: PermMap = {};
      for (const pid of Object.keys(prev)) {
        next[pid] = new Set(prev[pid]);
        filteredIds.forEach((id) => next[pid].add(id));
      }
      return next;
    });
    toast({ title: "Permissões atribuídas", description: `${filteredIds.length} permissões apresentadas foram atribuídas a todos os perfis.`, variant: "success" });
  }

  function clearFiltered() {
    setChanged(true);
    setPermMap((prev) => {
      const next: PermMap = {};
      for (const pid of Object.keys(prev)) {
        next[pid] = new Set(prev[pid]);
        filteredIds.forEach((id) => next[pid].delete(id));
      }
      return next;
    });
    toast({ title: "Permissões removidas", description: `${filteredIds.length} permissões apresentadas foram removidas de todos os perfis.`, variant: "warning" });
  }

  const diffRows = React.useMemo(() => {
    if (!profileAId || !profileBId || profileAId === profileBId) return [];
    const setA = permMap[profileAId] ?? new Set<string>();
    const setB = permMap[profileBId] ?? new Set<string>();
    return ALL_PERMISSIONS.filter((p) => setA.has(p.id) !== setB.has(p.id)).map((p) => ({ ...p, hasA: setA.has(p.id), hasB: setB.has(p.id) }));
  }, [profileAId, profileBId, permMap]);

  const profileA = profiles.find((p) => p.id === profileAId);
  const profileB = profiles.find((p) => p.id === profileBId);

  async function savePermissions() {
    setSaving(true);
    const payload = Object.fromEntries(Object.entries(permMap).map(([id, values]) => [id, Array.from(values)]));
    const response = await fetch("/api/profiles/permissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles: payload }),
    });
    setSaving(false);
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      toast({ title: "Não foi possível guardar", description: result.error ?? "Tente novamente.", variant: "destructive" });
      return;
    }
    setChanged(false);
    toast({ title: "Permissões guardadas", description: "A matriz foi actualizada no PostgreSQL.", variant: "success" });
  }

  return (
    <div>
      <PageHeader
        title="Permissões"
        description="Matriz completa de permissões atribuídas a cada perfil de acesso do sistema."
        breadcrumb={[{ label: "Administração" }, { label: "Permissões" }]}
      />

      <div className="space-y-4 p-6">
        <Card>
          <CardHeader className="flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="w-full sm:w-72">
              <SearchInput
                placeholder="Pesquisar permissão por nome ou descrição…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={selectAllFiltered}>
                <CheckSquare className="size-3.5" /> Seleccionar todas
              </Button>
              <Button variant="secondary" size="sm" onClick={clearFiltered}>
                <Square className="size-3.5" /> Limpar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCompareOpen(true)}>
                <GitCompare className="size-3.5" /> Comparar perfis
              </Button>
              <Button size="sm" disabled={!changed || saving} onClick={savePermissions}>
                <Save className="size-3.5" /> {saving ? "A guardar…" : "Guardar matriz"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredModules.length === 0 ? (
              <EmptyState title="Nenhuma permissão encontrada" description="Ajuste o termo de pesquisa." />
            ) : (
              <TableContainer className="max-h-[70vh] overflow-y-auto">
                <Table className="text-xs">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="sticky left-0 z-20 min-w-[260px] bg-graphite-50">Permissão</TableHeaderCell>
                      {profiles.map((p) => (
                        <TableHeaderCell key={p.id} className="min-w-[112px] text-center">{p.nome}</TableHeaderCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredModules.map((mod) => (
                      <React.Fragment key={mod.modulo}>
                        <TableRow>
                          <TableCell colSpan={profiles.length + 1} className="bg-graphite-100 py-1.5 text-2xs font-semibold uppercase tracking-wide text-graphite-500">
                            {mod.modulo}
                          </TableCell>
                        </TableRow>
                        {mod.permissoes.map((perm) => (
                          <TableRow key={perm.id}>
                            <TableCell className="sticky left-0 z-10 bg-white py-1.5">
                              <p className="font-medium text-graphite-800">{perm.label}</p>
                              <p className="text-2xs text-graphite-400">{perm.descricao}</p>
                            </TableCell>
                            {profiles.map((p) => (
                              <TableCell key={p.id} className="py-1.5 text-center">
                                <Checkbox
                                  checked={permMap[p.id]?.has(perm.id) ?? false}
                                  onCheckedChange={() => toggle(p.id, perm.id)}
                                  aria-label={`${perm.label} — ${p.nome}`}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Comparar perfis</DialogTitle>
            <DialogDescription>Seleccione dois perfis para visualizar as permissões em que divergem.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-graphite-700">Perfil A</label>
                <Select value={profileAId} onValueChange={setProfileAId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-graphite-700">Perfil B</label>
                <Select value={profileBId} onValueChange={setProfileBId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {profileAId === profileBId ? (
              <p className="rounded-md border border-graphite-150 bg-graphite-25 px-3 py-6 text-center text-[13px] text-graphite-500">
                Seleccione dois perfis diferentes para comparar.
              </p>
            ) : diffRows.length === 0 ? (
              <p className="rounded-md border border-graphite-150 bg-graphite-25 px-3 py-6 text-center text-[13px] text-graphite-500">
                Estes perfis têm exactamente as mesmas permissões.
              </p>
            ) : (
              <div className="max-h-80 space-y-1.5 overflow-y-auto">
                <p className="text-2xs text-graphite-400">{diffRows.length} permissões divergentes</p>
                {diffRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between gap-3 rounded-md border border-graphite-150 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-graphite-800">{row.label}</p>
                      <p className="text-2xs text-graphite-400">{row.modulo}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="flex items-center gap-1 text-2xs text-graphite-600">
                        {row.hasA ? <Check className="size-3.5 text-success-600" /> : <X className="size-3.5 text-crimson-600" />}
                        {profileA?.nome}
                      </span>
                      <span className="flex items-center gap-1 text-2xs text-graphite-600">
                        {row.hasB ? <Check className="size-3.5 text-success-600" /> : <X className="size-3.5 text-crimson-600" />}
                        {profileB?.nome}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCompareOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
