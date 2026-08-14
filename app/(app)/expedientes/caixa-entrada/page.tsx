import { PersistentExpedientList } from "@/components/expedients/persistent-expedient-list";

export const metadata = { title: "Caixa de entrada" };

export default function CaixaEntradaPage() { return <PersistentExpedientList view="inbox" title="Caixa de entrada" description="Expedientes actualmente à sua responsabilidade, aguardando acção" emptyTitle="Caixa de entrada vazia" emptyDescription="Não existem expedientes atribuídos a si neste momento." />; }
