import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Pendentes" };

export default function PendentesPage() { return <PersistentExpedientList view="pending" title="Pendentes" description="Processos em tramitação que ainda aguardam conclusão de uma etapa" emptyTitle="Sem processos pendentes" emptyDescription="Todos os processos foram concluídos ou arquivados." />; }
