"use client";

import { usePathname } from "next/navigation";
import {
  getActiveGroup,
  getActiveHref,
  getGroupLabel,
  getVisibleNavigation,
} from "@/components/layout/navigation-model";
import { useSession } from "@/lib/session";

const UNIT_STOP_WORDS = new Set(["a", "as", "de", "do", "da", "dos", "das", "e"]);

function abbreviateUnit(name: string) {
  const abbreviation = name
    .split(/\s+/)
    .filter((word) => word && !UNIT_STOP_WORDS.has(word.toLowerCase()))
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 6);

  return abbreviation || name.slice(0, 10);
}

export function StatusBar() {
  const pathname = usePathname() ?? "";
  const { perfilNavegacao, profile, unitName } = useSession();
  const visibleGroups = getVisibleNavigation(perfilNavegacao);
  const activeHref = getActiveHref(pathname, visibleGroups);
  const activeGroup = getActiveGroup(pathname, visibleGroups, activeHref) ?? visibleGroups[0];

  return (
    <footer
      className="hidden h-6 shrink-0 items-center gap-2 bg-cfm-900 px-3 text-[10px] text-cfm-100 lg:flex"
      aria-label="Estado do sistema"
    >
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-success-300" aria-hidden />
        Ligado
      </span>
      <span className="h-3 w-px bg-white/15" aria-hidden />
      <span title={unitName}>Unidade: {abbreviateUnit(unitName)}</span>
      <span className="h-3 w-px bg-white/15" aria-hidden />
      <span>{profile.nome}</span>
      {activeGroup && (
        <>
          <span className="h-3 w-px bg-white/15" aria-hidden />
          <span className="truncate">Módulo: {getGroupLabel(activeGroup)}</span>
        </>
      )}
    </footer>
  );
}
