import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Concluídos" };

export default function ConcluidosPage() { return <PersistentExpedientList view="completed" title="Concluídos" description="Processos aprovados, entregues ou arquivados" emptyTitle="Nenhum processo concluído" emptyDescription="Os processos concluídos aparecerão aqui." />; }
