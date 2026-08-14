import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Devolvidos" };

export default function DevolvidosPage() { return <PersistentExpedientList view="returned" title="Devolvidos" description="Processos devolvidos para correcção ou rejeitados, aguardando nova acção" emptyTitle="Nenhum processo devolvido" emptyDescription="Não existem processos devolvidos ou rejeitados de momento." />; }
