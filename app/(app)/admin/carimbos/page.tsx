import { StampManagement } from "@/components/administration/stamp-management";
import { CatalogsProvider } from "@/lib/catalogs";

export const metadata = { title: "Carimbos" };

export default function CarimbosPage() {
  return <CatalogsProvider><StampManagement /></CatalogsProvider>;
}
