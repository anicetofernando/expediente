"use client";

import * as React from "react";
import { History } from "lucide-react";
import type { Stamp } from "@/types";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, FieldHint } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCatalogs } from "@/lib/catalogs";
import { cn } from "@/lib/utils";

const CATEGORIA_OPTIONS: { value: Stamp["categoria"]; label: string }[] = [
  { value: "institucional", label: "Institucional" },
  { value: "funcional", label: "Funcional" },
  { value: "protocolo", label: "Protocolo" },
  { value: "recepcao", label: "Recepção" },
  { value: "aprovacao", label: "Aprovação" },
  { value: "confidencialidade", label: "Confidencialidade" },
  { value: "urgencia", label: "Urgência" },
  { value: "outro", label: "Outro" },
];

const POSICAO_OPTIONS: { value: Stamp["posicao"]; label: string }[] = [
  { value: "superior-esquerda", label: "Superior esquerda" },
  { value: "superior-direita", label: "Superior direita" },
  { value: "inferior-esquerda", label: "Inferior esquerda" },
  { value: "inferior-direita", label: "Inferior direita" },
  { value: "centro", label: "Centro" },
];

const TAMANHO_OPTIONS: { value: Stamp["tamanho"]; label: string }[] = [
  { value: "pequeno", label: "Pequeno" },
  { value: "medio", label: "Médio" },
  { value: "grande", label: "Grande" },
];

const COR_POR_CATEGORIA: Record<Stamp["categoria"], string> = {
  institucional: "navy",
  funcional: "graphite",
  protocolo: "navy",
  recepcao: "info",
  aprovacao: "success",
  confidencialidade: "crimson",
  urgencia: "amber",
  outro: "graphite",
};

const TAMANHO_PREVIEW: Record<Stamp["tamanho"], string> = {
  pequeno: "text-[8px] px-1.5 py-0.5",
  medio: "text-[10px] px-2 py-1",
  grande: "text-[12px] px-2.5 py-1.5",
};

function posicaoClasses(posicao: Stamp["posicao"]) {
  const vertical = posicao.includes("superior") ? "top-3" : posicao.includes("inferior") ? "bottom-3" : "top-1/2 -translate-y-1/2";
  const horizontal = posicao.includes("esquerda") ? "left-3" : posicao.includes("direita") ? "right-3" : "left-1/2 -translate-x-1/2";
  return cn(vertical, horizontal);
}

function slugify(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function StampEditorDrawer({
  open,
  onOpenChange,
  stamp,
  onSave,
  onOpenUsage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stamp: Stamp | null;
  onSave: (stamp: Stamp) => void;
  onOpenUsage: (stamp: Stamp) => void;
}) {
  const { organizationalUnits } = useCatalogs();
  const unidadeOptions = React.useMemo(() => ["Global", ...organizationalUnits.map((u) => u.nome)], [organizationalUnits]);
  const [nome, setNome] = React.useState(stamp?.nome ?? "");
  const [categoria, setCategoria] = React.useState<Stamp["categoria"]>(stamp?.categoria ?? "protocolo");
  const [unidade, setUnidade] = React.useState(stamp?.unidade ?? "Global");
  const [utilizadores, setUtilizadores] = React.useState(stamp?.utilizadoresAutorizados.join(", ") ?? "");
  const [etapas, setEtapas] = React.useState(stamp?.etapasPermitidas.join(", ") ?? "");
  const [tipos, setTipos] = React.useState(stamp?.tiposDocumento.join(", ") ?? "");
  const [posicao, setPosicao] = React.useState<Stamp["posicao"]>(stamp?.posicao ?? "superior-direita");
  const [tamanho, setTamanho] = React.useState<Stamp["tamanho"]>(stamp?.tamanho ?? "medio");
  const [transparencia, setTransparencia] = React.useState(stamp?.transparencia ?? 10);
  const [validadeDias, setValidadeDias] = React.useState(stamp?.validadeDias != null ? String(stamp.validadeDias) : "");
  const [activo, setActivo] = React.useState(stamp?.activo ?? true);
  const [imagemUrl, setImagemUrl] = React.useState(stamp?.imagemUrl ?? "");
  const [uploading, setUploading] = React.useState(false);

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/assets", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Falha ao carregar a imagem.");
      setImagemUrl(result.url);
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    const result: Stamp = {
      id: stamp?.id ?? `st-${slugify(nome)}-${Date.now().toString(36)}`,
      nome: nome.trim(),
      categoria,
      unidade,
      utilizadoresAutorizados: utilizadores.split(",").map((s) => s.trim()).filter(Boolean),
      etapasPermitidas: etapas.split(",").map((s) => s.trim()).filter(Boolean),
      tiposDocumento: tipos.split(",").map((s) => s.trim()).filter(Boolean),
      posicao,
      tamanho,
      transparencia,
      validadeDias: validadeDias.trim() === "" ? null : Number(validadeDias),
      activo,
      utilizacoes: stamp?.utilizacoes ?? 0,
      ultimaUtilizacao: stamp?.ultimaUtilizacao,
      cor: stamp?.cor ?? COR_POR_CATEGORIA[categoria],
      imagemUrl: imagemUrl || undefined,
      posicaoLivre: stamp?.posicaoLivre,
    };
    onSave(result);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size="lg">
        <DrawerHeader>
          <DrawerTitle>{stamp ? "Editar carimbo" : "Criar carimbo"}</DrawerTitle>
          <DrawerDescription>
            {stamp ? `A editar «${stamp.nome}»` : "Defina a unidade proprietária e as propriedades do novo carimbo institucional."}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_200px]">
            <div className="space-y-3.5">
              <div>
                <Label required>Nome do carimbo</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Aprovado pela Direcção-Geral" />
              </div>
              <div>
                <Label>Imagem do carimbo</Label>
                <div className="flex items-center gap-3">
                  {imagemUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagemUrl} alt="Carimbo" className="h-14 w-auto rounded border border-graphite-200 bg-graphite-50 object-contain p-1" />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    disabled={uploading}
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImageUpload(file); }}
                    className="text-[13px] text-graphite-600 file:mr-3 file:rounded-md file:border-0 file:bg-graphite-100 file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-graphite-700 hover:file:bg-graphite-200"
                  />
                </div>
                <FieldHint>
                  {imagemUrl
                    ? "Ao aplicar este carimbo num documento, poderá posicionar a imagem livremente."
                    : "Opcional. Sem imagem, o carimbo continua a ser gerado como texto na posição predefinida abaixo."}
                </FieldHint>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Categoria</Label>
                  <Select value={categoria} onValueChange={(v) => setCategoria(v as Stamp["categoria"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIA_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label required>Unidade proprietária</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {unidadeOptions.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Utilizadores autorizados</Label>
                <Textarea rows={2} value={utilizadores} onChange={(e) => setUtilizadores(e.target.value)} placeholder="Nomes separados por vírgula" />
                <FieldHint>Separe vários utilizadores com vírgulas.</FieldHint>
              </div>
              <div>
                <Label>Etapas permitidas</Label>
                <Textarea rows={2} value={etapas} onChange={(e) => setEtapas(e.target.value)} placeholder="Ex: Recepção, Protocolo" />
              </div>
              <div>
                <Label>Tipos de documento</Label>
                <Textarea rows={2} value={tipos} onChange={(e) => setTipos(e.target.value)} placeholder="Ex: Ofício, Memorando" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Posição na folha</Label>
                  <Select value={posicao} onValueChange={(v) => setPosicao(v as Stamp["posicao"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSICAO_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label required>Tamanho</Label>
                  <Select value={tamanho} onValueChange={(v) => setTamanho(v as Stamp["tamanho"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TAMANHO_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Transparência ({transparencia}%)</Label>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={transparencia}
                  onChange={(e) => setTransparencia(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-navy-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Validade (dias)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={validadeDias}
                    onChange={(e) => setValidadeDias(e.target.value)}
                    placeholder="Sem validade"
                  />
                </div>
                <div className="flex flex-col justify-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={activo} onCheckedChange={setActivo} id="stamp-activo" />
                    <Label htmlFor="stamp-activo" className="mb-0">Carimbo activo</Label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Pré-visualização</Label>
              <div className="flex items-center justify-center rounded-lg border border-dashed border-graphite-300 bg-graphite-50 p-3">
                <div className="relative aspect-[210/297] w-full border border-graphite-200 bg-white">
                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-2xs text-graphite-300">Folha A4</span>
                  {nome.trim() && (
                    <span
                      className={cn(
                        "absolute rotate-[-8deg] whitespace-nowrap rounded border-2 font-bold uppercase tracking-wide",
                        "border-navy-700 text-navy-700",
                        TAMANHO_PREVIEW[tamanho],
                        posicaoClasses(posicao)
                      )}
                      style={{ opacity: 1 - transparencia / 100 }}
                    >
                      {nome}
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-2 text-2xs leading-relaxed text-graphite-500">
                A posição e a opacidade reflectem em tempo real as definições seleccionadas à esquerda.
              </p>
            </div>
          </div>
        </DrawerBody>
        <DrawerFooter className="justify-between">
          <div>
            {stamp && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenUsage(stamp)}>
                <History className="size-3.5" /> Consultar histórico de utilização
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button disabled={!nome.trim()} onClick={handleSubmit}>Guardar</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
