import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Recepção"};
export default function Page(){return <PersistentExpedientList view="secretary-reception" title="Recepção" description="Expedientes submetidos que aguardam recepção pela Secretaria" emptyTitle="Sem expedientes por receber" emptyDescription="Não existem novos expedientes submetidos."/>;}
