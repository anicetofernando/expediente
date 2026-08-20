"use client";

import * as React from "react";
import Link from "next/link";
import {
  Archive,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  KeyRound,
  Link2,
  RefreshCw,
  Save,
  Send,
  Settings2,
} from "lucide-react";
import { CatalogSettings } from "@/components/administration/catalog-settings";
import { PageHeader } from "@/components/shared/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDatabaseSetting } from "@/lib/use-database-setting";
import { CatalogsProvider } from "@/lib/catalogs";

interface SystemSettings {
  institutionName: string;
  institutionCode: string;
  supportEmail: string;
  timezone: string;
  locale: string;
  passwordDays: string;
  maxAttempts: string;
  auditYears: string;
  defaultDeadlineDays: string;
  deadlineWarningHours: string;
  archiveAfterDays: string;
  allowExternalSenders: boolean;
  requireReceiptConfirmation: boolean;
  smtpEnabled: boolean;
  smsEnabled: boolean;
  apiEnabled: boolean;
  smtpHost: string;
  smsProvider: string;
  apiBaseUrl: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  institutionName: "Portos e Caminhos de Ferro de Moçambique, E.P.",
  institutionCode: "CFM",
  supportEmail: "suporte.expediente@cfm.co.mz",
  timezone: "Africa/Maputo",
  locale: "pt-MZ",
  passwordDays: "90",
  maxAttempts: "5",
  auditYears: "10",
  defaultDeadlineDays: "5",
  deadlineWarningHours: "24",
  archiveAfterDays: "30",
  allowExternalSenders: true,
  requireReceiptConfirmation: true,
  smtpEnabled: true,
  smsEnabled: false,
  apiEnabled: true,
  smtpHost: "smtp.cfm.co.mz",
  smsProvider: "mCel Empresas",
  apiBaseUrl: "https://api.cfm.co.mz/expediente/v1",
};

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-graphite-150 py-4 last:border-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-graphite-100 text-graphite-600">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-[13px] font-medium text-graphite-800">{title}</p>
          <p className="mt-0.5 text-xs leading-5 text-graphite-500">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0 sm:w-64">{children}</div>
    </div>
  );
}

function ConfiguracoesContent() {
  const { toast } = useToast();
  const [storedSettings, setStoredSettings, settingsReady] = useDatabaseSetting<SystemSettings>("general-configuration", DEFAULT_SETTINGS);
  const [settings, setSettings] = React.useState<SystemSettings>(DEFAULT_SETTINGS);
  const [changed, setChanged] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState("25/07/2026, 09:30");

  React.useEffect(() => { if (settingsReady) setSettings(storedSettings); }, [settingsReady, storedSettings]);

  function update<K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setChanged(true);
  }

  function save() {
    setStoredSettings(settings);
    setChanged(false);
    const savedAt = new Date().toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setLastSaved(savedAt);
    toast({
      title: "Configurações guardadas",
      description:
        "Os novos parâmetros serão aplicados às próximas operações do sistema.",
      variant: "success",
    });
  }

  function restoreDefaults() {
    setSettings(DEFAULT_SETTINGS);
    setChanged(true);
    toast({
      title: "Valores predefinidos restaurados",
      description:
        "Reveja os parâmetros e guarde para confirmar a reposição.",
      variant: "warning",
    });
  }

  function testIntegration(name: string, enabled: boolean) {
    toast({
      title: enabled ? "Ligação verificada" : "Integração desactivada",
      description: enabled
        ? `${name} respondeu correctamente ao teste de conectividade.`
        : `Active ${name} antes de executar o teste.`,
      variant: enabled ? "success" : "warning",
    });
  }

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Parâmetros institucionais, segurança, prazos e integrações do sistema."
        breadcrumb={[
          { label: "Administração" },
          { label: "Configurações" },
        ]}
        actions={
          <>
            <Button variant="secondary" onClick={restoreDefaults}>
              <RefreshCw className="size-4" />
              Restaurar predefinições
            </Button>
            <Button disabled={!changed} onClick={save}>
              <Save className="size-4" />
              Guardar alterações
            </Button>
          </>
        }
      />

      <div className="space-y-5 p-6">
        <Alert
          variant={changed ? "warning" : "success"}
          title={
            changed
              ? "Existem alterações por guardar"
              : "Configuração sincronizada"
          }
        >
          {changed
            ? "As alterações permanecem apenas neste formulário até seleccionar “Guardar alterações”."
            : `Última gravação confirmada em ${lastSaved}.`}
        </Alert>

        <Tabs defaultValue="geral">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            <TabsTrigger value="expediente">Expediente e prazos</TabsTrigger>
            <TabsTrigger value="listas">Listas de selecção</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="pt-5">
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Identidade institucional</CardTitle>
                    <CardDescription>
                      Informação apresentada nos documentos e comunicações.
                    </CardDescription>
                  </div>
                  <Building2 className="size-5 text-navy-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="institution-name" required>
                      Nome oficial
                    </Label>
                    <Input
                      id="institution-name"
                      value={settings.institutionName}
                      onChange={(event) =>
                        update("institutionName", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                    <div>
                      <Label htmlFor="institution-code" required>
                        Sigla
                      </Label>
                      <Input
                        id="institution-code"
                        value={settings.institutionCode}
                        onChange={(event) =>
                          update(
                            "institutionCode",
                            event.target.value.toUpperCase()
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="support-email" required>
                        E-mail de suporte
                      </Label>
                      <Input
                        id="support-email"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(event) =>
                          update("supportEmail", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Localização e protocolo</CardTitle>
                    <CardDescription>
                      Fuso horário, idioma e padrão institucional.
                    </CardDescription>
                  </div>
                  <Settings2 className="size-5 text-navy-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Fuso horário</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => update("timezone", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Maputo">
                            África/Maputo (CAT)
                          </SelectItem>
                          <SelectItem value="Africa/Johannesburg">
                            África/Johannesburg
                          </SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Idioma e formato</Label>
                      <Select
                        value={settings.locale}
                        onValueChange={(value) => update("locale", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-MZ">
                            Português (Moçambique)
                          </SelectItem>
                          <SelectItem value="pt-PT">
                            Português (Portugal)
                          </SelectItem>
                          <SelectItem value="en-GB">
                            English (United Kingdom)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="rounded-lg border border-graphite-200 bg-graphite-50 p-3.5">
                    <p className="text-[13px] font-medium text-graphite-800">Formato do número de protocolo</p>
                    <p className="mt-1 text-xs leading-relaxed text-graphite-500">
                      O prefixo, separador e dígitos do número de protocolo real são configurados por unidade em <Link href="/admin/numeracao" className="text-cfm-700 underline">Administração → Numeração</Link>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="seguranca" className="pt-5">
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Políticas de acesso</CardTitle>
                    <CardDescription>
                      Regras de palavra-passe aplicadas aos utilizadores.
                    </CardDescription>
                  </div>
                  <KeyRound className="size-5 text-success-600" />
                </CardHeader>
                <CardContent className="py-0">
                  <SettingRow
                    icon={KeyRound}
                    title="Validade da palavra-passe"
                    description="Solicita alteração periódica das credenciais."
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="30"
                        value={settings.passwordDays}
                        onChange={(event) =>
                          update("passwordDays", event.target.value)
                        }
                      />
                      <span className="text-xs text-graphite-500">dias</span>
                    </div>
                  </SettingRow>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Controlo e auditoria</CardTitle>
                    <CardDescription>
                      Limites de acesso e retenção de eventos.
                    </CardDescription>
                  </div>
                  <Database className="size-5 text-info-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="max-attempts">
                      Tentativas antes do bloqueio
                    </Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      min="3"
                      max="10"
                      value={settings.maxAttempts}
                      onChange={(event) =>
                        update("maxAttempts", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="audit-years">
                      Retenção do registo de auditoria
                    </Label>
                    <Select
                      value={settings.auditYears}
                      onValueChange={(value) => update("auditYears", value)}
                    >
                      <SelectTrigger id="audit-years">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 anos</SelectItem>
                        <SelectItem value="10">10 anos</SelectItem>
                        <SelectItem value="15">15 anos</SelectItem>
                        <SelectItem value="permanente">
                          Retenção permanente
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Alert variant="info" title="Registo imutável">
                    Eventos de autenticação, permissões e decisões documentais
                    são sempre auditados.
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expediente" className="pt-5">
            <div className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Prazos predefinidos</CardTitle>
                    <CardDescription>
                      Valores sugeridos quando o fluxo não define um prazo.
                    </CardDescription>
                  </div>
                  <Clock3 className="size-5 text-amber-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="default-deadline">
                        Prazo de resposta
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="default-deadline"
                          type="number"
                          min="1"
                          value={settings.defaultDeadlineDays}
                          onChange={(event) =>
                            update("defaultDeadlineDays", event.target.value)
                          }
                        />
                        <span className="text-xs text-graphite-500">dias</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="deadline-warning">
                        Aviso antecipado
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="deadline-warning"
                          type="number"
                          min="1"
                          value={settings.deadlineWarningHours}
                          onChange={(event) =>
                            update("deadlineWarningHours", event.target.value)
                          }
                        />
                        <span className="text-xs text-graphite-500">horas</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Recepção e arquivo</CardTitle>
                    <CardDescription>
                      Regras gerais do ciclo de vida dos expedientes.
                    </CardDescription>
                  </div>
                  <Archive className="size-5 text-navy-600" />
                </CardHeader>
                <CardContent className="py-0">
                  <SettingRow
                    icon={Archive}
                    title="Arquivar após conclusão"
                    description="Sugere o arquivo depois do período sem actividade."
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={settings.archiveAfterDays}
                        onChange={(event) =>
                          update("archiveAfterDays", event.target.value)
                        }
                      />
                      <span className="text-xs text-graphite-500">dias</span>
                    </div>
                  </SettingRow>
                  <SettingRow
                    icon={Send}
                    title="Aceitar remetentes externos"
                    description="Permite registar pessoas e instituições fora da estrutura."
                  >
                    <div className="flex justify-end">
                      <Switch
                        checked={settings.allowExternalSenders}
                        onCheckedChange={(checked) =>
                          update("allowExternalSenders", checked)
                        }
                      />
                    </div>
                  </SettingRow>
                  <SettingRow
                    icon={CheckCircle2}
                    title="Confirmação de entrega"
                    description="Exige a identificação de quem recebe uma entrega física."
                  >
                    <div className="flex justify-end">
                      <Switch
                        checked={settings.requireReceiptConfirmation}
                        onCheckedChange={(checked) =>
                          update("requireReceiptConfirmation", checked)
                        }
                      />
                    </div>
                  </SettingRow>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listas" className="pt-5">
            <CatalogSettings />
          </TabsContent>

          <TabsContent value="integracoes" className="pt-5">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Correio electrónico institucional</CardTitle>
                    <CardDescription>
                      Entrega de alertas e recuperação de acesso.
                    </CardDescription>
                  </div>
                  <Badge variant={settings.smtpEnabled ? "success" : "neutral"}>
                    {settings.smtpEnabled ? "Ligado" : "Desligado"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="smtp-host">Servidor SMTP</Label>
                    <Input
                      id="smtp-host"
                      value={settings.smtpHost}
                      disabled={!settings.smtpEnabled}
                      onChange={(event) =>
                        update("smtpHost", event.target.value)
                      }
                    />
                  </div>
                  <Switch
                    checked={settings.smtpEnabled}
                    onCheckedChange={(checked) =>
                      update("smtpEnabled", checked)
                    }
                    aria-label="Activar SMTP"
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      testIntegration("o servidor SMTP", settings.smtpEnabled)
                    }
                  >
                    <Link2 className="size-4" />
                    Testar ligação
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Serviço de mensagens SMS</CardTitle>
                    <CardDescription>
                      Alertas urgentes de prazo e segurança.
                    </CardDescription>
                  </div>
                  <Badge variant={settings.smsEnabled ? "success" : "neutral"}>
                    {settings.smsEnabled ? "Ligado" : "Desligado"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="sms-provider">Fornecedor</Label>
                    <Input
                      id="sms-provider"
                      value={settings.smsProvider}
                      disabled={!settings.smsEnabled}
                      onChange={(event) =>
                        update("smsProvider", event.target.value)
                      }
                    />
                  </div>
                  <Switch
                    checked={settings.smsEnabled}
                    onCheckedChange={(checked) =>
                      update("smsEnabled", checked)
                    }
                    aria-label="Activar SMS"
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      testIntegration("o serviço SMS", settings.smsEnabled)
                    }
                  >
                    <Link2 className="size-4" />
                    Testar ligação
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>API institucional</CardTitle>
                    <CardDescription>
                      Integração com sistemas internos autorizados.
                    </CardDescription>
                  </div>
                  <Badge variant={settings.apiEnabled ? "success" : "neutral"}>
                    {settings.apiEnabled ? "Ligada" : "Desligada"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="api-base-url">Endereço base</Label>
                    <Input
                      id="api-base-url"
                      value={settings.apiBaseUrl}
                      disabled={!settings.apiEnabled}
                      onChange={(event) =>
                        update("apiBaseUrl", event.target.value)
                      }
                    />
                  </div>
                  <Switch
                    checked={settings.apiEnabled}
                    onCheckedChange={(checked) =>
                      update("apiEnabled", checked)
                    }
                    aria-label="Activar API"
                  />
                  <Button
                    variant="secondary"
                    onClick={() =>
                      testIntegration("a API institucional", settings.apiEnabled)
                    }
                  >
                    <Link2 className="size-4" />
                    Testar ligação
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  return <CatalogsProvider><ConfiguracoesContent /></CatalogsProvider>;
}
