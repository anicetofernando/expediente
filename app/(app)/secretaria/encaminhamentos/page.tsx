import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Encaminhamentos"};
export default function Page(){return <PersistentExpedientList view="secretary-forwarding" title="Encaminhamentos" description="Expedientes protocolados que aguardam encaminhamento" emptyTitle="Sem encaminhamentos pendentes"/>;}
