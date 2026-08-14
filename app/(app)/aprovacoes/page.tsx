import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Pendentes de decisão"};
export default function Page(){return <PersistentExpedientList view="approval" title="Pendentes de decisão" description="Expedientes encaminhados à sua unidade que aguardam análise" emptyTitle="Sem decisões pendentes"/>;}
