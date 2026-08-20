"use client";

import * as React from "react";
import {
  Bell,
  BellRing,
  Clock3,
  Mail,
  MessageSquare,
  Plus,
  Save,
  Send,
  Smartphone,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useDatabaseSetting } from "@/lib/use-database-setting";

type NotificationCategory =
  | "Expedientes"
  | "Prazos"
  | "Aprovações"
  | "Segurança"
  | "Sistema";

interface NotificationRule {
  id: string;
  nome: string;
  evento: string;
  categoria: NotificationCategory;
  destinatarios: string;
  canais: {
    sistema: boolean;
    email: boolean;
    sms: boolean;
  };
  urgente: boolean;
  activa: boolean;
}

const INITIAL_RULES: NotificationRule[] = [
  {
    id: "rule-1",
    nome: "Novo expediente atribuído",
    evento: "Quando um expediente é encaminhado para um responsável",
    categoria: "Expedientes",
    destinatarios: "Responsável actual",
    canais: { sistema: true, email: true, sms: false },
    urgente: false,
    activa: true,
  },
  {
    id: "rule-2",
    nome: "Prazo a terminar em 24 horas",
    evento: "24 horas antes do prazo definido",
    categoria: "Prazos",
    destinatarios: "Responsável e chefia",
    canais: { sistema: true, email: true, sms: true },
    urgente: true,
    activa: true,
  },
  {
    id: "rule-3",
    nome: "Expediente em atraso",
    evento: "Ao ultrapassar o prazo da etapa actual",
    categoria: "Prazos",
    destinatarios: "Responsável, chefia e secretaria",
    canais: { sistema: true, email: true, sms: true },
    urgente: true,
    activa: true,
  },
  {
    id: "rule-4",
    nome: "Pedido de aprovação",
    evento: "Quando uma etapa requer decisão superior",
    categoria: "Aprovações",
    destinatarios: "Aprovador definido no fluxo",
    canais: { sistema: true, email: true, sms: false },
    urgente: false,
    activa: true,
  },
  {
    id: "rule-5",
    nome: "Decisão registada",
    evento: "Após aprovação, rejeição ou devolução",
    categoria: "Aprovações",
    destinatarios: "Requerente e intervenientes anteriores",
    canais: { sistema: true, email: false, sms: false },
    urgente: false,
    activa: true,
  },
  {
    id: "rule-6",
    nome: "Tentativa de acesso bloqueada",
    evento: "Após cinco tentativas inválidas consecutivas",
    categoria: "Segurança",
    destinatarios: "Administrador e titular da conta",
    canais: { sistema: true, email: true, sms: true },
    urgente: true,
    activa: true,
  },
  {
    id: "rule-7",
    nome: "Manutenção programada",
    evento: "48 horas antes de uma janela de manutenção",
    categoria: "Sistema",
    destinatarios: "Todos os utilizadores activos",
    canais: { sistema: true, email: true, sms: false },
    urgente: false,
    activa: false,
  },
];

const CATEGORIES: NotificationCategory[] = [
  "Expedientes",
  "Prazos",
  "Aprovações",
  "Segurança",
  "Sistema",
];

interface NotificationConfiguration {
  rules: NotificationRule[];
  digest: string;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

const DEFAULT_CONFIGURATION: NotificationConfiguration = { rules: INITIAL_RULES, digest: "diario", quietHours: true, quietStart: "20:00", quietEnd: "07:00" };

export default function NotificacoesPage() {
  const { toast } = useToast();
  const [storedConfiguration, setStoredConfiguration, configurationReady] = useDatabaseSetting<NotificationConfiguration>("notification-rules", DEFAULT_CONFIGURATION);
  const [rules, setRules] = React.useState(INITIAL_RULES);
  const [deleteTarget, setDeleteTarget] = React.useState<NotificationRule | null>(null);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("todas");
  const [changed, setChanged] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [digest, setDigest] = React.useState("diario");
  const [quietHours, setQuietHours] = React.useState(true);
  const [quietStart, setQuietStart] = React.useState("20:00");
  const [quietEnd, setQuietEnd] = React.useState("07:00");
  const [name, setName] = React.useState("");
  const [event, setEvent] = React.useState("");
  const [newCategory, setNewCategory] =
    React.useState<NotificationCategory>("Expedientes");
  const [recipients, setRecipients] = React.useState("");
  const [channelSystem, setChannelSystem] = React.useState(true);
  const [channelEmail, setChannelEmail] = React.useState(true);
  const [channelSms, setChannelSms] = React.useState(false);
  const [urgent, setUrgent] = React.useState(false);

  React.useEffect(() => {
    if (!configurationReady) return;
    setRules(storedConfiguration.rules);
    setDigest(storedConfiguration.digest);
    setQuietHours(storedConfiguration.quietHours);
    setQuietStart(storedConfiguration.quietStart);
    setQuietEnd(storedConfiguration.quietEnd);
  }, [configurationReady, storedConfiguration]);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return rules.filter((rule) => {
      const matchesSearch =
        !query ||
        rule.nome.toLowerCase().includes(query) ||
        rule.evento.toLowerCase().includes(query) ||
        rule.destinatarios.toLowerCase().includes(query);
      const matchesCategory =
        category === "todas" || rule.categoria === category;
      return matchesSearch && matchesCategory;
    });
  }, [rules, search, category]);

  const activeCount = rules.filter((rule) => rule.activa).length;
  const urgentCount = rules.filter((rule) => rule.urgente && rule.activa).length;
  const emailCount = rules.filter(
    (rule) => rule.canais.email && rule.activa
  ).length;
  const smsCount = rules.filter(
    (rule) => rule.canais.sms && rule.activa
  ).length;

  function resetForm() {
    setName("");
    setEvent("");
    setNewCategory("Expedientes");
    setRecipients("");
    setChannelSystem(true);
    setChannelEmail(true);
    setChannelSms(false);
    setUrgent(false);
  }

  function createRule() {
    const rule: NotificationRule = {
      id: `rule-${Date.now()}`,
      nome: name.trim(),
      evento: event.trim(),
      categoria: newCategory,
      destinatarios: recipients.trim(),
      canais: {
        sistema: channelSystem,
        email: channelEmail,
        sms: channelSms,
      },
      urgente: urgent,
      activa: true,
    };
    setRules((current) => [rule, ...current]);
    setChanged(true);
    setOpen(false);
    resetForm();
    toast({
      title: "Regra adicionada",
      description: `“${rule.nome}” será aplicada depois de guardar as alterações.`,
      variant: "success",
    });
  }

  function toggleRule(rule: NotificationRule, active: boolean) {
    setRules((current) =>
      current.map((item) =>
        item.id === rule.id ? { ...item, activa: active } : item
      )
    );
    setChanged(true);
  }

  function deleteRuleConfirmed() {
    if (!deleteTarget) return;
    setRules((current) => current.filter((item) => item.id !== deleteTarget.id));
    setChanged(true);
    toast({ title: "Regra eliminada", description: `«${deleteTarget.nome}» foi removida. Não se esqueça de guardar as alterações.`, variant: "success" });
    setDeleteTarget(null);
  }

  function saveChanges() {
    setStoredConfiguration({ rules, digest, quietHours, quietStart, quietEnd });
    setChanged(false);
    toast({
      title: "Definições guardadas",
      description:
        "As regras e preferências globais de notificação foram actualizadas.",
      variant: "success",
    });
  }

  return (
    <div>
      <PageHeader
        title="Notificações"
        description="Regras automáticas, canais de entrega e preferências globais de comunicação."
        breadcrumb={[
          { label: "Administração" },
          { label: "Notificações" },
        ]}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Nova regra
            </Button>
            <Button disabled={!changed} onClick={saveChanges}>
              <Save className="size-4" />
              Guardar alterações
            </Button>
          </>
        }
      />

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Regras activas"
            value={activeCount}
            icon="BellRing"
            tone="success"
          />
          <StatCard
            label="Alertas urgentes"
            value={urgentCount}
            icon="Siren"
            tone="crimson"
          />
          <StatCard
            label="Com envio por e-mail"
            value={emailCount}
            icon="Mail"
            tone="info"
          />
          <StatCard
            label="Com envio por SMS"
            value={smsCount}
            icon="Smartphone"
            tone="navy"
          />
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Preferências globais</CardTitle>
              <CardDescription>
                Parâmetros aplicados a todas as notificações não urgentes.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div>
              <Label>Resumo de actividade por e-mail</Label>
              <Select
                value={digest}
                onValueChange={(value) => {
                  setDigest(value);
                  setChanged(true);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="imediato">Envio imediato</SelectItem>
                  <SelectItem value="diario">Resumo diário às 08:00</SelectItem>
                  <SelectItem value="semanal">Resumo semanal</SelectItem>
                  <SelectItem value="desactivado">Sem resumo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-3 rounded-lg border border-graphite-200 p-3.5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-graphite-400" />
                <div>
                  <p className="text-[13px] font-medium text-graphite-800">
                    Horário silencioso
                  </p>
                  <p className="mt-0.5 text-xs text-graphite-500">
                    Alertas não urgentes ficam em fila até ao fim deste período.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  className="w-28"
                  value={quietStart}
                  disabled={!quietHours}
                  onChange={(event) => {
                    setQuietStart(event.target.value);
                    setChanged(true);
                  }}
                  aria-label="Início do horário silencioso"
                />
                <span className="text-xs text-graphite-500">até</span>
                <Input
                  type="time"
                  className="w-28"
                  value={quietEnd}
                  disabled={!quietHours}
                  onChange={(event) => {
                    setQuietEnd(event.target.value);
                    setChanged(true);
                  }}
                  aria-label="Fim do horário silencioso"
                />
                <Switch
                  checked={quietHours}
                  onCheckedChange={(checked) => {
                    setQuietHours(checked);
                    setChanged(true);
                  }}
                  aria-label="Activar horário silencioso"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="Pesquisar regra ou destinatário…"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-graphite-500">
              {filtered.length} regras
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Regra</TableHeaderCell>
                    <TableHeaderCell>Categoria</TableHeaderCell>
                    <TableHeaderCell>Destinatários</TableHeaderCell>
                    <TableHeaderCell>Canais</TableHeaderCell>
                    <TableHeaderCell>Prioridade</TableHeaderCell>
                    <TableHeaderCell>Activa</TableHeaderCell>
                    <TableHeaderCell className="w-24" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="min-w-[300px]">
                        <div className="flex items-start gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-info-50 text-info-700">
                            <Bell className="size-4" />
                          </span>
                          <div>
                            <p className="font-medium text-graphite-900">
                              {rule.nome}
                            </p>
                            <p className="mt-0.5 max-w-xl text-2xs leading-4 text-graphite-500">
                              {rule.evento}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="navy">{rule.categoria}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        {rule.destinatarios}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {rule.canais.sistema && (
                            <Badge variant="info">
                              <MessageSquare className="size-3" />
                              Sistema
                            </Badge>
                          )}
                          {rule.canais.email && (
                            <Badge>
                              <Mail className="size-3" />
                              E-mail
                            </Badge>
                          )}
                          {rule.canais.sms && (
                            <Badge variant="navy">
                              <Smartphone className="size-3" />
                              SMS
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.urgente ? "crimson" : "neutral"}>
                          {rule.urgente ? "Urgente" : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.activa}
                          onCheckedChange={(checked) =>
                            toggleRule(rule, checked)
                          }
                          aria-label={`Activar regra ${rule.nome}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const response = await fetch("/api/admin/notifications/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rule }) });
                              toast(response.ok ? { title: "Notificação de teste criada", description: `A regra “${rule.nome}” gerou uma notificação real no sistema.`, variant: "success" } : { title: "Falha no teste", variant: "destructive" });
                            }}
                          >
                            <Send className="size-3.5" />
                            Testar
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${rule.nome}`} onClick={() => setDeleteTarget(rule)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
            <DialogTitle>Nova regra de notificação</DialogTitle>
            <DialogDescription>
              Defina o evento, os destinatários e os canais de entrega.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="notification-name" required>
                Nome da regra
              </Label>
              <Input
                id="notification-name"
                value={name}
                onChange={(eventValue) => setName(eventValue.target.value)}
                placeholder="Ex.: Documento assinado"
              />
            </div>
            <div>
              <Label htmlFor="notification-event" required>
                Evento
              </Label>
              <Input
                id="notification-event"
                value={event}
                onChange={(eventValue) => setEvent(eventValue.target.value)}
                placeholder="Quando a assinatura digital for concluída"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label required>Categoria</Label>
                <Select
                  value={newCategory}
                  onValueChange={(value) =>
                    setNewCategory(value as NotificationCategory)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notification-recipients" required>
                  Destinatários
                </Label>
                <Input
                  id="notification-recipients"
                  value={recipients}
                  onChange={(eventValue) =>
                    setRecipients(eventValue.target.value)
                  }
                  placeholder="Ex.: Responsável actual"
                />
              </div>
            </div>
            <div>
              <Label>Canais</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Sistema",
                    icon: MessageSquare,
                    value: channelSystem,
                    setter: setChannelSystem,
                  },
                  {
                    label: "E-mail",
                    icon: Mail,
                    value: channelEmail,
                    setter: setChannelEmail,
                  },
                  {
                    label: "SMS",
                    icon: Smartphone,
                    value: channelSms,
                    setter: setChannelSms,
                  },
                ].map((channel) => (
                  <label
                    key={channel.label}
                    className="flex items-center justify-between rounded-lg border border-graphite-200 p-3"
                  >
                    <span className="flex items-center gap-2 text-[13px] font-medium text-graphite-700">
                      <channel.icon className="size-4 text-graphite-400" />
                      {channel.label}
                    </span>
                    <Switch
                      checked={channel.value}
                      onCheckedChange={channel.setter}
                    />
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between rounded-lg border border-crimson-200 bg-crimson-50/50 p-3.5">
              <div>
                <p className="text-[13px] font-medium text-crimson-800">
                  Marcar como urgente
                </p>
                <p className="mt-0.5 text-xs text-crimson-700">
                  Ignora o horário silencioso e usa todos os canais activos.
                </p>
              </div>
              <Switch checked={urgent} onCheckedChange={setUrgent} />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !name.trim() ||
                !event.trim() ||
                !recipients.trim() ||
                (!channelSystem && !channelEmail && !channelSms)
              }
              onClick={createRule}
            >
              Criar regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar regra de notificação"
        description={deleteTarget ? `«${deleteTarget.nome}» será removida permanentemente.` : undefined}
        confirmLabel="Eliminar"
        destructive
        onConfirm={deleteRuleConfirmed}
      />
    </div>
  );
}
