import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";
export const metadata={title:"Recepção e encaminhamento"};
export default function Page(){return <PersistentExpedientList view="secretary-reception" title="Recepção e encaminhamento" description="Conferir, protocolar e encaminhar cada submissão numa única operação" emptyTitle="Sem submissões por tratar" emptyDescription="Não existem expedientes a aguardar intervenção da Secretaria."/>;}
