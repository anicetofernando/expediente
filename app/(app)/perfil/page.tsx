import { PageHeader } from "@/components/shared/page-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";

export const metadata = { title: "O meu perfil" };

export default function PerfilPage() {
  return (
    <div>
      <PageHeader title="O meu perfil" description="Dados pessoais, segurança da conta e preferências do sistema" breadcrumb={[{ label: "O meu perfil" }]} />
      <div className="p-6">
        <ProfileTabs />
      </div>
    </div>
  );
}
