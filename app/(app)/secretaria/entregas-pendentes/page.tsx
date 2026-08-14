import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Entregas pendentes"};
export default function Page(){return <PersistentExpedientList view="secretary-deliveries" title="Entregas pendentes" description="Respostas aprovadas, disponibilizadas ou por arquivar" emptyTitle="Sem entregas pendentes"/>;}
