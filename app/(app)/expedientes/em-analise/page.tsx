import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Em análise" };

export default function EmAnalisePage() { return <PersistentExpedientList view="analysis" title="Em análise" description="Processos actualmente em avaliação técnica pela unidade responsável" emptyTitle="Nenhum processo em análise" emptyDescription="Não existem processos em avaliação técnica neste momento." />; }
