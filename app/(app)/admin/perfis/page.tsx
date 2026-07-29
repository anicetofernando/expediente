import { ProfileManagement } from "@/components/administration/profile-management";
import { profiles, users } from "@/data/organization";

export const metadata = { title: "Perfis" };

export default function PerfisPage() {
  return <ProfileManagement initialProfiles={profiles} users={users} />;
}
