"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { perfisNavegacao, type PerfilNavegacao } from "@/config/navigation";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  getActiveGroup,
  getActiveHref,
  getGroupIcon,
  getGroupLabel,
  getGroupLandingHref,
  getProfileLandingHref,
  getVisibleNavigation,
} from "@/components/layout/navigation-model";
import { useSession } from "@/lib/session";
import { cn, initials } from "@/lib/utils";

const AVATAR_CLASSES: Record<string, string> = {
  navy: "bg-navy-600 text-white",
  info: "bg-info-600 text-white",
  success: "bg-success-600 text-white",
  amber: "bg-amber-500 text-white",
  crimson: "bg-crimson-700 text-white",
  graphite: "bg-graphite-500 text-white",
};

export function Topbar() {
  const pathname = usePathname() ?? "";
  const { perfilNavegacao, unitName } = useSession();
  const visibleGroups = getVisibleNavigation(perfilNavegacao);
  const activeHref = getActiveHref(pathname, visibleGroups);
  const activeGroup = getActiveGroup(pathname, visibleGroups, activeHref);
  const landingHref = getProfileLandingHref(perfilNavegacao);
  const [today, setToday] = useState({ display: "--/--/----", iso: "" });

  useEffect(() => {
    const date = new Date();
    setToday({
      display: new Intl.DateTimeFormat("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date),
      iso: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-"),
    });
  }, []);

  return (
    <header className="shrink-0 text-white">
      <div className="hidden h-9 items-center bg-cfm-900 lg:flex">
        <Link
          href={landingHref}
          className="flex h-full w-[236px] shrink-0 items-center gap-2 border-r border-white/10 px-3 focus-visible:outline-white"
          aria-label="CFM Expediente — painel principal"
        >
          <span className="text-[13px] font-bold tracking-tight text-white">CFM</span>
          <span className="h-4 w-0.5 bg-cfm-300" aria-hidden />
          <span className="text-[11px] font-semibold tracking-[0.14em] text-cfm-100">SGE</span>
          <span className="truncate text-[10px] text-cfm-300">Gestão de Expediente</span>
        </Link>

        <div className="ml-auto flex h-full min-w-0 items-center">
          <div className="flex h-full items-center gap-1.5 border-l border-white/10 px-2.5 text-[11px] text-cfm-100">
            <CalendarRange className="size-3.5 shrink-0" aria-hidden />
            <span>Exercício:</span>
            <strong className="font-semibold text-white">2026</strong>
          </div>

          <div
            className="flex h-full min-w-0 max-w-64 items-center gap-1.5 border-l border-white/10 px-2.5 text-[11px] text-cfm-100"
            title={unitName}
          >
            <Building2 className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate text-white">{unitName}</span>
          </div>

          <div className="flex h-full items-center gap-1.5 border-l border-white/10 px-2.5 text-[11px] text-cfm-100">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            <time dateTime={today.iso || undefined}>{today.display}</time>
          </div>

          <NotificationLink />
          <CompactUserMenu desktop />
        </div>
      </div>

      <nav
        className="hidden h-11 items-stretch overflow-x-auto bg-cfm-700 scrollbar-none lg:flex"
        aria-label="Módulos"
      >
        {visibleGroups.map((group) => {
          const Icon = getGroupIcon(group);
          const active = activeGroup?.label === group.label;

          return (
            <Link
              key={group.label}
              href={getGroupLandingHref(group)}
              className={cn(
                "flex h-full shrink-0 items-center gap-2 border-b-2 border-r border-white/10 px-3.5 text-[12px] font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-b-cfm-300 bg-cfm-900 text-white"
                  : "border-b-transparent text-cfm-50 hover:bg-cfm-800 hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-[15px] shrink-0" aria-hidden />
              {getGroupLabel(group)}
            </Link>
          );
        })}
      </nav>

      <div className="flex h-11 items-center bg-cfm-900 px-2 lg:hidden">
        <MobileNav />
        <Link
          href={landingHref}
          className="ml-1.5 flex min-w-0 items-center gap-2 focus-visible:outline-white"
          aria-label="CFM Expediente — painel principal"
        >
          <span className="text-[12.5px] font-bold tracking-tight">CFM</span>
          <span className="h-4 w-0.5 bg-cfm-300" aria-hidden />
          <span className="text-[10.5px] font-semibold tracking-[0.12em] text-cfm-100">SGE</span>
        </Link>
        <div className="ml-auto flex h-full items-center">
          <NotificationLink />
          <CompactUserMenu />
        </div>
      </div>
    </header>
  );
}

function NotificationLink() {
  return (
    <Link
      href="/notificacoes"
      className="relative flex h-full w-9 items-center justify-center border-l border-white/10 text-cfm-100 transition-colors hover:bg-white/10 hover:text-white"
      aria-label="Abrir notificações"
    >
      <Bell className="size-3.5" aria-hidden />
      <span className="absolute right-2 top-2 size-1.5 bg-crimson-400" aria-hidden />
    </Link>
  );
}

function CompactUserMenu({ desktop = false }: { desktop?: boolean }) {
  const {
    user,
    profile,
    perfilNavegacao,
    setPerfilNavegacao,
  } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePress(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative h-full border-l border-white/10">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-full items-center gap-1.5 px-2 text-left text-white transition-colors hover:bg-white/10"
        aria-label={`Abrir menu de ${user.nome}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <AvatarMark name={user.nome} color={user.avatarColor} />
        {desktop && (
          <>
            <span className="max-w-28 truncate text-[11px] font-medium">{user.nome.split(" ")[0]}</span>
            <ChevronDown className="size-3 text-cfm-200" aria-hidden />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu do utilizador"
          className={cn(
            "absolute right-1 z-50 w-64 border border-graphite-200 bg-white p-1 text-graphite-700 shadow-popover",
            desktop ? "top-[calc(100%+88px)]" : "top-[calc(100%+44px)]"
          )}
        >
          <div className="border-b border-graphite-150 px-2.5 py-2">
            <p className="truncate text-xs font-semibold text-graphite-900">{user.nome}</p>
            <p className="mt-0.5 truncate text-2xs text-graphite-500">{user.email}</p>
            <p className="mt-1 truncate text-2xs text-cfm-700">{profile.nome}</p>
          </div>

          <label className="flex h-9 items-center gap-2 border-b border-graphite-150 px-2.5">
            <ShieldCheck className="size-3.5 shrink-0 text-graphite-500" aria-hidden />
            <span className="sr-only">Perfil de demonstração</span>
            <select
              value={perfilNavegacao}
              onChange={(event) => {
                setPerfilNavegacao(event.target.value as PerfilNavegacao);
                setOpen(false);
              }}
              className="h-7 min-w-0 flex-1 border-0 bg-transparent text-[11px] font-medium text-graphite-700 outline-none"
              aria-label="Perfil de demonstração"
            >
              {perfisNavegacao.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="py-1">
            <Link
              href="/perfil"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-8 items-center gap-2 px-2.5 text-xs hover:bg-graphite-50 hover:text-cfm-900"
            >
              <UserCircle2 className="size-3.5" aria-hidden />
              O meu perfil
            </Link>
            {perfilNavegacao === "administracao" && (
              <Link
                href="/admin/configuracoes"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex h-8 items-center gap-2 px-2.5 text-xs hover:bg-graphite-50 hover:text-cfm-900"
              >
                <Settings className="size-3.5" aria-hidden />
                Configurações
              </Link>
            )}
          </div>

          <Link
            href="/login"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex h-8 items-center gap-2 px-2.5 text-xs text-crimson-700 hover:bg-crimson-50"
          >
            <LogOut className="size-3.5" aria-hidden />
            Terminar sessão
          </Link>
        </div>
      )}
    </div>
  );
}

function AvatarMark({ name, color }: { name: string; color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ring-1 ring-white/25",
        AVATAR_CLASSES[color ?? "navy"] ?? AVATAR_CLASSES.navy
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
