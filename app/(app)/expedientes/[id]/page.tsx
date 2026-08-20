import { notFound } from "next/navigation";
import type { Expedient } from "@/types";
import {
  User, Building2, CalendarClock, FileText, History as HistoryIcon,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge, PriorityBadge, ConfidentialityBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { Timeline } from "@/components/shared/timeline";
import { ActionPanel } from "@/components/expedients/detail/action-panel";
import { CommentsPanel } from "@/components/expedients/detail/comments-panel";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentList } from "@/components/documents/document-list";
import { requireSession } from "@/lib/auth";
import { getExpedient } from "@/lib/expedients-db";
import { CatalogsProvider } from "@/lib/catalogs";

export const dynamic = "force-dynamic";

export default async function ExpedientDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const result = await getExpedient(session, params.id);
  if (!result) notFound();
  const { expedient, audit } = result;

  const principal = expedient.documentos.find((d) => d.tipo === "principal") ?? expedient.documentos[0];

  return (
    <CatalogsProvider>
    <div>
      <div className="border-b border-graphite-200 bg-white px-4 py-3 lg:px-5">
        <Breadcrumb items={[{ label: "Expediente", href: "/expedientes" }, { label: expedient.protocolo }]} />
        <div className="mt-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-navy-800">{expedient.protocolo}</span>
              <span className="text-xs text-graphite-300">·</span>
              <span className="text-xs text-graphite-500">{expedient.tipoLabel}</span>
            </div>
            <h1 className="mt-1 max-w-5xl text-lg font-semibold leading-snug text-graphite-900">
              {expedient.assunto}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={expedient.estado} />
              <PriorityBadge priority={expedient.prioridade} />
              <ConfidentialityBadge level={expedient.confidencialidade} />
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-x-6 gap-y-2 border-t border-graphite-150 pt-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetaField icon={User} label="Responsável" value={expedient.responsavelActual} />
          <MetaField icon={Building2} label="Unidade de origem" value={expedient.unidadeOrigem} />
          <MetaField icon={CalendarClock} label="Entrada" value={formatDate(expedient.dataEntrada)} />
          <MetaField icon={CalendarClock} label="Prazo" value={formatDate(expedient.prazo)} highlight={expedient.atrasado} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:p-5">
        <div className="min-w-0">
          <Tabs defaultValue="visao-geral">
            <TabsList>
              <TabsTrigger value="visao-geral">Resumo</TabsTrigger>
              <TabsTrigger value="documentos">Documentos ({expedient.documentos.length})</TabsTrigger>
              <TabsTrigger value="tramitacao">Tramitação</TabsTrigger>
              <TabsTrigger value="comentarios">Comentários ({expedient.comentarios.length})</TabsTrigger>
              <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
            </TabsList>

            <TabsContent value="visao-geral" className="pt-5">
              <div className="space-y-5">
                <dl className="grid grid-cols-1 gap-4 text-[13px] md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Remetente" value={`${expedient.remetente.nome}${expedient.remetente.unidade ? ` · ${expedient.remetente.unidade}` : ""}`} />
                  <Field label="Destinatário" value={expedient.destinatario} />
                  <Field label="Tipo de expediente" value={expedient.tipoLabel} />
                  <Field label="Próxima etapa" value={expedient.proximaEtapa} />
                  <Field label="Descrição" value={expedient.descricao} block />
                  {expedient.observacoes && <Field label="Observações" value={expedient.observacoes} block />}
                </dl>
                <div className="min-h-[760px]">
                  <p className="mb-2 text-[13px] font-semibold text-graphite-800">Documento principal</p>
                  <div className="h-[78vh] min-h-[740px]">{principal ? <DocumentViewer document={principal} /> : <EmptyState title="Sem documento principal" />}</div>
                </div>
              </div>

              {expedient.processosRelacionados && expedient.processosRelacionados.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <p className="mb-2 text-[13px] font-semibold text-graphite-800">Processos relacionados</p>
                  <ul className="space-y-1.5">
                    {expedient.processosRelacionados.map((r) => (
                      <li key={r.protocolo} className="flex items-center gap-2 border border-graphite-150 px-3 py-2 text-[13px]">
                        <FileText className="size-3.5 text-graphite-400" />
                        <span className="font-medium text-navy-700">{r.protocolo}</span>
                        <span className="truncate text-graphite-500">{r.assunto}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </TabsContent>

            <TabsContent value="documentos" className="pt-5">
              <div className="space-y-5">
                {principal && (
                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-graphite-800">{principal.nome}</p>
                    <div className="h-[82vh] min-h-[780px]"><DocumentViewer document={principal} /></div>
                  </div>
                )}
                <DocumentList title="Todos os documentos" docs={expedient.documentos} />
              </div>
            </TabsContent>

            <TabsContent value="tramitacao" className="pt-5">
              <Timeline events={expedient.timeline} />
            </TabsContent>

            <TabsContent value="comentarios" className="pt-5">
              <CommentsPanel initialComments={expedient.comentarios} expedientId={expedient.id} />
            </TabsContent>

            <TabsContent value="auditoria" className="pt-5">
              {audit.length === 0 ? (
                <EmptyState icon={HistoryIcon} title="Sem registos de auditoria" description="Não existem eventos de auditoria específicos para este processo." />
              ) : (
                <div className="overflow-hidden border border-graphite-200">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-graphite-50 text-2xs uppercase tracking-wide text-graphite-500">
                      <tr>
                        <th className="px-4 py-2.5">Data</th>
                        <th className="px-4 py-2.5">Utilizador</th>
                        <th className="px-4 py-2.5">Acção</th>
                        <th className="px-4 py-2.5">Detalhes</th>
                        <th className="px-4 py-2.5">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-graphite-150">
                      {audit.map((a) => (
                        <tr key={a.id}>
                          <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-graphite-500">{formatDate(a.data, true)}</td>
                          <td className="px-4 py-2.5 text-graphite-800">{a.utilizador}</td>
                          <td className="px-4 py-2.5 text-graphite-700">{a.accao}</td>
                          <td className="px-4 py-2.5 text-graphite-500">{a.detalhes}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-graphite-400">{a.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader><CardTitle>Acções</CardTitle></CardHeader>
            <CardContent>
              <ActionPanel
                expedient={{
                  id: expedient.id,
                  estado: expedient.estado,
                  protocolo: expedient.protocolo,
                  assunto: expedient.assunto,
                  precisaEscalarDirector: expedient.precisaEscalarDirector,
                }}
                principalPdfUrl={principal?.pdfUrl}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </CatalogsProvider>
  );
}

function MetaField({ icon: Icon, label, value, highlight }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-2xs uppercase tracking-wide text-graphite-400"><Icon className="size-3" /> {label}</p>
      <p className={`mt-0.5 truncate text-[13px] font-medium ${highlight ? "text-crimson-600" : "text-graphite-800"}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, block }: { label: string; value: string; block?: boolean }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wide text-graphite-400">{label}</dt>
      <dd className={`mt-0.5 text-graphite-700 ${block ? "leading-relaxed" : "truncate"}`}>{value}</dd>
    </div>
  );
}

