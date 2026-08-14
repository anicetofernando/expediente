import { UserManagement } from "@/components/administration/user-management";
import { listProfiles, listUnits, listUsers } from "@/lib/admin-db";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "Utilizadores" };

export default async function UtilizadoresPage() {
  await requireProfile("administracao");
  const [users, organizationalUnits, profiles] = await Promise.all([listUsers(),listUnits(),listProfiles()]);
  return <UserManagement initialUsers={users} units={organizationalUnits} profiles={profiles} />;
}
