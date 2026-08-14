import { ProfileManagement } from "@/components/administration/profile-management";
import { listProfiles, listUsers } from "@/lib/admin-db";

export const metadata = { title: "Perfis" };

export default async function PerfisPage() {
  const [profiles, users] = await Promise.all([listProfiles(), listUsers()]);
  return <ProfileManagement initialProfiles={profiles} users={users} />;
}
