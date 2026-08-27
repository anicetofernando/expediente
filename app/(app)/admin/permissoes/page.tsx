import { PermissionMatrix } from "@/components/administration/permission-matrix";
import { listProfiles } from "@/lib/admin-db";
import { requireAdminArea } from "@/lib/auth";

export const metadata = { title: "Permissões" };

export default async function PermissoesPage() {
  await requireAdminArea("permissoes");
  const profiles = await listProfiles();
  return <PermissionMatrix profiles={profiles} />;
}
