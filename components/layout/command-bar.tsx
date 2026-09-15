"use client";

import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export function CommandBar() {
  const router = useRouter();
  const { perfilNavegacao } = useSession();
  const isRemetente = perfilNavegacao === "remetente";

  return (
    <nav
      className="flex h-10 shrink-0 items-center border-b border-graphite-200 bg-graphite-100 px-1.5 text-graphite-700 sm:px-2"
      aria-label="Comandos rápidos"
    >
      {isRemetente && (
        <Link
          href="/expedientes/novo"
          className="flex h-8 items-center gap-1.5 border-r border-graphite-200 px-2.5 text-[12px] font-medium hover:bg-white hover:text-graphite-950"
        >
          <Plus className="size-[14px]" aria-hidden />
          Novo
        </Link>
      )}

      <button
        type="button"
        onClick={() => router.refresh()}
        className="flex h-8 items-center gap-1.5 px-2.5 text-[12px] font-medium hover:bg-white hover:text-graphite-950"
      >
        <RefreshCw className="size-[14px]" aria-hidden />
        <span className="hidden sm:inline">Actualizar</span>
        <span className="sr-only sm:hidden">Actualizar</span>
      </button>
    </nav>
  );
}
