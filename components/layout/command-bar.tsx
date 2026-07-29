"use client";

import Link from "next/link";
import { Plus, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export function CommandBar() {
  const router = useRouter();
  const { perfilNavegacao } = useSession();
  const isRemetente = perfilNavegacao === "remetente";
  const showSearch = perfilNavegacao !== "administracao";

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
        className="flex h-8 items-center gap-1.5 border-r border-graphite-200 px-2.5 text-[12px] font-medium hover:bg-white hover:text-graphite-950"
      >
        <RefreshCw className="size-[14px]" aria-hidden />
        <span className="hidden sm:inline">Actualizar</span>
        <span className="sr-only sm:hidden">Actualizar</span>
      </button>

      {showSearch && (
        <form
          action="/expedientes"
          method="get"
          className="ml-2 flex h-7 min-w-0 flex-1 items-center border border-graphite-300 bg-white sm:max-w-sm"
          role="search"
        >
          <Search className="ml-2 size-[14px] shrink-0 text-graphite-400" aria-hidden />
          <input
            type="search"
            name="q"
            placeholder="Pesquisar expediente..."
            aria-label="Pesquisar expedientes"
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-[12px] text-graphite-800 outline-none placeholder:text-graphite-400"
          />
          <button
            type="submit"
            className="h-full border-l border-graphite-200 px-2.5 text-[11px] font-medium text-graphite-700 hover:bg-graphite-100 hover:text-graphite-950"
          >
            Pesquisar
          </button>
        </form>
      )}
    </nav>
  );
}
