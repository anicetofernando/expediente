import { PermissionMatrix } from "@/components/administration/permission-matrix";
import { profiles } from "@/data/organization";

export const metadata = { title: "Permissões" };

export default function PermissoesPage() {
  return <PermissionMatrix profiles={profiles} />;
}
