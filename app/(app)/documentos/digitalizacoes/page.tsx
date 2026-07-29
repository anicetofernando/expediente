import Link from "next/link";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ScanPanel } from "@/components/documents/scan-panel";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { allExpedients } from "@/data/expedients";

export const metadata = { title: "Digitalizações" };

export default function DigitalizacoesPage() {
  const digitalizados = allExpedients
    .flatMap((e) => e.documentos.filter((d) => d.origem === "digitalizado").map((d) => ({ ...d, protocolo: e.protocolo, expedienteId: e.id })))
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  return (
    <div>
      <PageHeader
        title="Digitalizações"
        description="Digitalização de documentos físicos e histórico de capturas realizadas"
        breadcrumb={[{ label: "Documentos", href: "/documentos" }, { label: "Digitalizações" }]}
      />

      <div className="space-y-5 p-6">
        <ScanPanel />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Histórico de digitalizações</CardTitle>
              <CardDescription>Documentos capturados por digitalização e associados a processos de expediente</CardDescription>
            </div>
          </CardHeader>
          {digitalizados.length === 0 ? (
            <EmptyState icon={History} title="Sem digitalizações registadas" description="Ainda não foi digitalizado nenhum documento no sistema." />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell className="min-w-[240px]">Nome</TableHeaderCell>
                    <TableHeaderCell>Protocolo</TableHeaderCell>
                    <TableHeaderCell>Páginas</TableHeaderCell>
                    <TableHeaderCell>Tamanho</TableHeaderCell>
                    <TableHeaderCell>Criado em</TableHeaderCell>
                    <TableHeaderCell>Criado por</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {digitalizados.map((doc) => (
                    <TableRow key={`${doc.expedienteId}-${doc.id}`}>
                      <TableCell className="max-w-[280px] truncate font-medium text-graphite-800" title={doc.nome}>{doc.nome}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/expedientes/${doc.expedienteId}`} className="font-medium text-navy-700 hover:underline">
                          {doc.protocolo}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular-nums">{doc.paginas}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{doc.tamanho}</TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{formatDate(doc.criadoEm)}</TableCell>
                      <TableCell className="whitespace-nowrap">{doc.criadoPor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
