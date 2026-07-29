import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AuditLogTable } from "@/components/reports/audit-log-table";
import { auditEntries } from "@/data/notifications";

export const metadata = { title: "Auditoria" };

export default function AuditoriaPage() {
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
