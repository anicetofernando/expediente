import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Histórico de decisões"};
export default function Page(){return <PersistentExpedientList view="approval-history" title="Histórico de decisões" description="Expedientes já decididos, devolvidos ou arquivados" emptyTitle="Sem decisões registadas"/>;}
