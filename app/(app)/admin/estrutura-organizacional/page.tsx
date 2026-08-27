import { OrgStructure } from "@/components/administration/org-structure";
import { listUsers } from "@/lib/admin-db";
import { CatalogsProvider } from "@/lib/catalogs";
import { requireAdminArea } from "@/lib/auth";

export const metadata = { title: "Estrutura organizacional" };

export default async function EstruturaOrganizacionalPage() {
  await requireAdminArea("estrutura-organizacional");
  const users = await listUsers();
  return <CatalogsProvider><OrgStructure users={users} /></CatalogsProvider>;
}
