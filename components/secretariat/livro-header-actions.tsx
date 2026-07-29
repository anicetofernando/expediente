"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function LivroHeaderActions() {
  const { toast } = useToast();
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Exportar livro"
        title="Exportar"
        onClick={() =>
          toast({
            title: "Exportação iniciada",
            description: "O livro digital de expediente está a ser exportado em formato PDF.",
          })
        }
      >
        <Download className="size-3.5" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Imprimir livro"
        title="Imprimir"
        onClick={() =>
          toast({
            title: "A preparar impressão",
            description: "O livro digital de expediente foi enviado para a impressora predefinida.",
          })
        }
      >
        <Printer className="size-3.5" aria-hidden="true" />
      </Button>
    </>
  );
}
