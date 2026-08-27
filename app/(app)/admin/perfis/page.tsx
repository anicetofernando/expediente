import { ProfileManagement } from "@/components/administration/profile-management";
import { listProfiles, listUsers } from "@/lib/admin-db";
import { requireAdminArea } from "@/lib/auth";

export const metadata = { title: "Perfis" };

export default async function PerfisPage() {
  await requireAdminArea("perfis");
  const [profiles, users] = await Promise.all([listProfiles(), listUsers()]);
  return <ProfileManagement initialProfiles={profiles} users={users} />;
}
