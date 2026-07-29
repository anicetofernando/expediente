"use client";

import * as React from "react";
import {
  Mail, Phone, Building2, IdCard, ShieldCheck, KeyRound, Smartphone, Monitor, LogOut, Bell, Globe, Moon,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { unitById } from "@/data/organization";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Timeline } from "@/components/shared/timeline";
import { useToast } from "@/hooks/use-toast";
import { allExpedients } from "@/data/expedients";

export function ProfileTabs() {
  const { user, profile, unitName } = useSession();
  const { toast } = useToast();
  const unit = unitById(user.unidadeId);

  const activity = allExpedients
    .flatMap((e) => e.timeline.map((t) => ({ ...t, expedienteId: e.id })))
    .filter((t) => t.utilizador === user.nome)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      {/* Cartão de identidade */}
      <Card className="h-fit">
        <CardContent className="flex flex-col items-center py-7 text-center">
          <UserAvatar name={user.nome} color={user.avatarColor} size="lg" className="text-lg" />
          <p className="mt-3 text-[15px] font-semibold text-graphite-900">{user.nome}</p>
          <p className="mt-0.5 text-[13px] text-graphite-500">{user.cargo}</p>
          <Badge variant="navy" className="mt-2.5">{profile.nome}</Badge>
          <Separator className="my-4" />
          <dl className="w-full space-y-2.5 text-left text-[13px]">
            <div className="flex items-center gap-2 text-graphite-600"><Mail className="size-3.5 shrink-0 text-graphite-400" /> <span className="truncate">{user.email}</span></div>
            {user.telefone && <div className="flex items-center gap-2 text-graphite-600"><Phone className="size-3.5 shrink-0 text-graphite-400" /> {user.telefone}</div>}
            <div className="flex items-center gap-2 text-graphite-600"><Building2 className="size-3.5 shrink-0 text-graphite-400" /> {unitName}</div>
            <div className="flex items-center gap-2 text-graphite-600"><IdCard className="size-3.5 shrink-0 text-graphite-400" /> {unit?.sigla} · {unit?.codigo}</div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="pessoal">
        <TabsList>
          <TabsTrigger value="pessoal">Informação pessoal</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="actividade">Actividade</TabsTrigger>
        </TabsList>

        <TabsContent value="pessoal" className="pt-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Dados pessoais</CardTitle>
                <CardDescription>Estes dados são geridos pela Direcção de Recursos Humanos</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><Label>Nome completo</Label><Input value={user.nome} disabled /></div>
              <div><Label>Cargo</Label><Input value={user.cargo} disabled /></div>
              <div><Label>E-mail institucional</Label><Input value={user.email} disabled /></div>
              <div><Label>Telefone</Label><Input value={user.telefone ?? "—"} disabled /></div>
              <div><Label>Unidade orgânica</Label><Input value={unitName} disabled /></div>
              <div><Label>Perfil de acesso</Label><Input value={profile.nome} disabled /></div>
            </CardContent>
            <CardFooter>
              <p className="mr-auto text-2xs text-graphite-400">Para corrigir estes dados, contacte a Direcção de Recursos Humanos.</p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="pt-5 space-y-5">
          <Card>
            <CardHeader><CardTitle>Palavra-passe</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><Label>Palavra-passe actual</Label><Input type="password" placeholder="••••••••" /></div>
              <div />
              <div><Label>Nova palavra-passe</Label><Input type="password" placeholder="••••••••" /></div>
              <div><Label>Confirmar nova palavra-passe</Label><Input type="password" placeholder="••••••••" /></div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast({ title: "Palavra-passe actualizada", variant: "success" })}>
                <KeyRound className="size-3.5" /> Actualizar palavra-passe
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader><CardTitle>Verificação em dois passos</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-success-50 text-success-600"><ShieldCheck className="size-[18px]" /></span>
                <div>
                  <p className="text-[13px] font-medium text-graphite-800">Activa via SMS</p>
                  <p className="text-2xs text-graphite-500">Dispositivo terminado em •• 88</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">Reconfigurar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sessões activas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <SessionRow icon={Monitor} device="Windows · Chrome" location="Maputo, Moçambique" current />
              <SessionRow icon={Smartphone} device="Android · Aplicação móvel" location="Maputo, Moçambique" lastSeen="há 2 dias" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias" className="pt-5 space-y-5">
          <Card>
            <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
            <CardContent className="space-y-3.5">
              <PrefRow icon={Bell} label="Notificações no sistema" description="Alertas de tarefas, aprovações e prazos" defaultChecked />
              <PrefRow icon={Mail} label="Notificações por e-mail" description="Resumo diário de processos pendentes" defaultChecked />
              <PrefRow icon={Smartphone} label="Notificações por SMS" description="Apenas para processos urgentes" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Idioma e região</CardTitle></CardHeader>
            <CardContent className="space-y-3.5">
              <PrefRow icon={Globe} label="Português (Moçambique)" description="Idioma da interface" defaultChecked disabled />
              <PrefRow icon={Moon} label="Modo escuro" description="Disponível numa fase futura do sistema" disabled />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actividade" className="pt-5">
          <Card>
            <CardHeader>
              <CardTitle>Actividade recente</CardTitle>
              <CardDescription>Últimas acções realizadas por si no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length > 0 ? <Timeline events={activity} /> : <p className="text-[13px] text-graphite-400">Sem actividade registada recentemente.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionRow({ icon: Icon, device, location, current, lastSeen }: { icon: React.ComponentType<{ className?: string }>; device: string; location: string; current?: boolean; lastSeen?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-graphite-150 px-3.5 py-2.5">
      <Icon className="size-4 shrink-0 text-graphite-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-graphite-800">{device}</p>
        <p className="text-2xs text-graphite-400">{location}{lastSeen ? ` · Última actividade ${lastSeen}` : ""}</p>
      </div>
      {current ? <Badge variant="success">Sessão actual</Badge> : <Button variant="ghost" size="sm" className="text-crimson-700 hover:bg-crimson-50"><LogOut className="size-3.5" /> Terminar</Button>}
    </div>
  );
}

function PrefRow({ icon: Icon, label, description, defaultChecked, disabled }: { icon: React.ComponentType<{ className?: string }>; label: string; description: string; defaultChecked?: boolean; disabled?: boolean }) {
  const [checked, setChecked] = React.useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-graphite-400" />
        <div>
          <p className="text-[13px] font-medium text-graphite-800">{label}</p>
          <p className="text-2xs text-graphite-500">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} disabled={disabled} />
    </div>
  );
}
