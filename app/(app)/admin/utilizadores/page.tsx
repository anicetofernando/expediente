import { UserManagement } from "@/components/administration/user-management";
import { users, organizationalUnits, profiles } from "@/data/organization";

export const metadata = { title: "Utilizadores" };

export default function UtilizadoresPage() {
  return <UserManagement initialUsers={users} units={organizationalUnits} profiles={profiles} />;
}
