import { StampManagement } from "@/components/administration/stamp-management";
import { CatalogsProvider } from "@/lib/catalogs";
import { requireAdminArea } from "@/lib/auth";

export const metadata = { title: "Carimbos" };

export default async function CarimbosPage() {
  await requireAdminArea("carimbos");
  return <CatalogsProvider><StampManagement /></CatalogsProvider>;
}
