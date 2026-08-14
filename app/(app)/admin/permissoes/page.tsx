import { PermissionMatrix } from "@/components/administration/permission-matrix";
import { listProfiles } from "@/lib/admin-db";

export const metadata = { title: "Permissões" };

export default async function PermissoesPage() {
  const profiles = await listProfiles();
  return <PermissionMatrix profiles={profiles} />;
}
