import { UserManagement } from "@/components/administration/user-management";
import { listProfiles, listUnits, listUsers } from "@/lib/admin-db";
import { requireAdminArea } from "@/lib/auth";
import { CatalogsProvider } from "@/lib/catalogs";

export const metadata = { title: "Utilizadores" };

export default async function UtilizadoresPage() {
  await requireAdminArea("utilizadores");
  const [users, organizationalUnits, profiles] = await Promise.all([listUsers(),listUnits(),listProfiles()]);
  return <CatalogsProvider><UserManagement initialUsers={users} units={organizationalUnits} profiles={profiles} /></CatalogsProvider>;
}
