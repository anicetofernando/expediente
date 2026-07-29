"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { users } from "@/data/organization";
import type { Stamp } from "@/types";

const SAMPLE_PROTOCOLS = ["CFM/DOF/2026/0421", "CFM/DMV/2026/0532", "CFM/SG/2026/1187", "CFM/DIN/2026/0299", "CFM/DFA/2026/0764", "CFM/DJU/2026/0158"];

function buildUsageLog(stamp: Stamp) {
  const seed = stamp.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const named = stamp.utilizadoresAutorizados.filter((n) => !n.toLowerCase().startsWith("todos"));
  const pool = named.length > 0 ? named : users.slice(0, 5).map((u) => u.nome);
  return Array.from({ length: 4 }).map((_, i) => {
    const daysAgo = ((seed + i * 7) % 13) + 1;
    const date = new Date(2026, 6, 25 - daysAgo, 8 + ((seed + i) % 9), (i * 17) % 60);
    return {
      data: date.toISOString(),
      utilizador: pool[(seed + i) % pool.length],
      protocolo: SAMPLE_PROTOCOLS[(seed + i * 3) % SAMPLE_PROTOCOLS.length],
    };
  });
}

export function StampUsageDialog({ stamp, open, onOpenChange }: { stamp: Stamp | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const rows = React.useMemo(() => (stamp ? buildUsageLog(stamp) : []), [stamp]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Histórico de utilização</DialogTitle>
          <DialogDescription>
            {stamp?.nome} · {stamp?.utilizacoes ?? 0} utilizações registadas no total
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="mb-3 text-2xs text-graphite-500">
            Amostra ilustrativa das utilizações mais recentes deste carimbo, apenas para efeitos de consulta.
          </p>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Data</TableHeaderCell>
                  <TableHeaderCell>Utilizador</TableHeaderCell>
                  <TableHeaderCell>Expediente</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap tabular-nums text-graphite-500">{formatDate(r.data, true)}</TableCell>
                    <TableCell className="text-graphite-800">{r.utilizador}</TableCell>
                    <TableCell className="font-medium text-navy-700">{r.protocolo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
