import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Protocolos"};
export default function Page(){return <PersistentExpedientList view="secretary-protocols" title="Protocolos" description="Expedientes recebidos e protocolados" emptyTitle="Sem protocolos pendentes"/>;}
