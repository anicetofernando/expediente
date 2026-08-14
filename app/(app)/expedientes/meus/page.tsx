import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Meus expedientes" };

export default function MeusExpedientesPage() { return <PersistentExpedientList view="mine" title="Meus expedientes" description="Processos que criou ou dos quais é actualmente responsável" emptyTitle="Ainda não tem expedientes" emptyDescription="Os processos que criar ou pelos quais for responsável aparecerão aqui." />; }
