import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Aguardando parecer"};
export default function Page(){return <PersistentExpedientList view="opinions" title="Aguardando parecer" description="Processos com parecer solicitado" emptyTitle="Sem pareceres pendentes"/>;}
