import { OrgStructure } from "@/components/administration/org-structure";
import { users } from "@/data/organization";

export const metadata = { title: "Estrutura organizacional" };

export default function EstruturaOrganizacionalPage() {
  return <OrgStructure users={users} />;
}
