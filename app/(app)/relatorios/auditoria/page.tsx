import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AuditLogTable } from "@/components/reports/audit-log-table";
import { requireProfile } from "@/lib/auth";
import { query } from "@/lib/db";
import type { AuditEntry } from "@/types";

export const metadata = { title: "Auditoria" };

export default async function AuditoriaPage() {
  await requireProfile("administracao");
  const result=await query<{id:string;created_at:string;user_name:string|null;action:string;entity_type:string;entity_id:string;details:Record<string,unknown>;ip:string|null;result:AuditEntry["resultado"]}>(`SELECT a.id::text,a.created_at,u.full_name user_name,a.action,a.entity_type,a.entity_id,a.details,a.ip::text,a.result FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 1000`);
  const auditEntries:AuditEntry[]=result.rows.map((entry)=>({id:entry.id,data:new Date(entry.created_at).toISOString(),utilizador:entry.user_name??"Desconhecido",accao:entry.action,entidade:entry.entity_type,entidadeId:entry.entity_id,detalhes:typeof entry.details.message==="string"?entry.details.message:JSON.stringify(entry.details),ip:entry.ip??"—",resultado:entry.result}));
  const total = auditEntries.length;
  const sucessos = auditEntries.filter((e) => e.resultado === "sucesso").length;
  const bloqueadosOuFalhas = auditEntries.filter((e) => e.resultado === "falha" || e.resultado === "bloqueado").length;
  const utilizadoresUnicos = new Set(auditEntries.map((e) => e.utilizador)).size;

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Registo global de eventos de segurança e actividade do sistema: sessões, acções sobre expedientes, documentos e relatórios."
        breadcrumb={[{ label: "Relatórios", href: "/relatorios" }, { label: "Auditoria" }]}
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total de eventos" value={total} icon="ShieldCheck" tone="navy" />
          <StatCard label="Sucessos" value={sucessos} icon="CheckCircle2" tone="success" />
          <StatCard label="Bloqueados / falhas" value={bloqueadosOuFalhas} icon="ShieldAlert" tone="crimson" />
          <StatCard label="Utilizadores únicos" value={utilizadoresUnicos} icon="Users2" tone="info" />
        </div>

        <AuditLogTable entries={auditEntries} />
      </div>
    </div>
  );
}
