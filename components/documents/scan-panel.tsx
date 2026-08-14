"use client";

import Link from "next/link";
import { ScanLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ScanPanel() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Registar digitalização</CardTitle>
          <CardDescription>Associe o PDF ou a imagem produzida pelo digitalizador a um expediente real.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-graphite-200 bg-graphite-50 px-6 py-10 text-center">
          <ScanLine className="size-8 text-graphite-400" />
          <p className="max-w-lg text-[13px] text-graphite-600">Crie um expediente, seleccione “Digitalizar documento” e carregue o ficheiro obtido no equipamento. O documento ficará guardado e aparecerá no histórico abaixo.</p>
          <Button asChild><Link href="/expedientes/novo"><ScanLine className="size-3.5" /> Criar expediente digitalizado</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}
