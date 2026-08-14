import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Caixa de saída" };

export default function CaixaSaidaPage() { return <PersistentExpedientList view="outbox" title="Caixa de saída" description="Correspondência e processos originados pela sua unidade orgânica" emptyTitle="Nenhum expediente enviado" emptyDescription="Os processos originados pela sua unidade aparecerão aqui." />; }
