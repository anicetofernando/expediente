"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getActiveGroup,
  getActiveHref,
  getGroupLabel,
  getVisibleNavigation,
} from "@/components/layout/navigation-model";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

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
  const online = useOnlineStatus();

  return (
    <footer
      className="hidden h-6 shrink-0 items-center gap-2 bg-cfm-900 px-3 text-[10px] text-cfm-100 lg:flex"
      aria-label="Estado do sistema"
    >
      <span className="flex items-center gap-1.5">
        <span
          className={cn("size-1.5 rounded-full", online ? "bg-success-300" : "bg-crimson-400")}
          aria-hidden
        />
        {online ? "Ligado" : "Sem ligação"}
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
