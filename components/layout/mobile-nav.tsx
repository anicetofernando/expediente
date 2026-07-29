"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Files, Menu, X } from "lucide-react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  getActiveGroup,
  getActiveHref,
  getGroupIcon,
  getGroupLabel,
  getNavigationIcon,
  getVisibleNavigation,
} from "@/components/layout/navigation-model";

export function MobileNav() {
  const pathname = usePathname() ?? "";
  const { perfilNavegacao, unitName } = useSession();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const visibleGroups = getVisibleNavigation(perfilNavegacao);
  const activeHref = getActiveHref(pathname, visibleGroups);
  const activeGroup = getActiveGroup(pathname, visibleGroups, activeHref);
  const activeGroupLabel = activeGroup?.label;
  const [expandedGroup, setExpandedGroup] = useState<string | null>(
    activeGroupLabel ?? visibleGroups[0]?.label ?? null
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (activeGroupLabel) setExpandedGroup(activeGroupLabel);
  }, [activeGroupLabel]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-8 shrink-0 items-center justify-center text-cfm-100 hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Abrir menu principal"
        aria-haspopup="dialog"
      >
        <Menu className="size-[18px]" aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        aria-labelledby="mobile-navigation-title"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[calc(100vw-2rem)] max-w-xs border-y-0 border-l-0 border-r border-graphite-200 bg-white p-0 text-graphite-700 shadow-modal backdrop:bg-graphite-950/45 lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-11 shrink-0 items-center border-b border-graphite-200 bg-graphite-25 px-3">
            <Files className="size-4 shrink-0 text-cfm-700" aria-hidden />
            <div className="ml-2 min-w-0 flex-1">
              <p id="mobile-navigation-title" className="truncate text-[12.5px] font-semibold text-cfm-900">
                Gestão de expediente
              </p>
              <p className="truncate text-[10px] text-graphite-500">{unitName}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-8 items-center justify-center text-graphite-500 hover:bg-graphite-100 hover:text-cfm-900"
              aria-label="Fechar menu"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-1.5" aria-label="Navegação móvel">
            {visibleGroups.map((group) => {
              const GroupIcon = getGroupIcon(group);
              const groupActive = activeGroup?.label === group.label;
              const expanded = expandedGroup === group.label;

              return (
                <section key={group.label}>
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(expanded ? null : group.label)}
                    className={cn(
                      "flex h-10 w-full items-center gap-2.5 px-3 text-left text-[13px] font-medium hover:bg-graphite-50 hover:text-cfm-900",
                      groupActive ? "text-cfm-900" : "text-graphite-700"
                    )}
                    aria-expanded={expanded}
                  >
                    <GroupIcon
                      className={cn("size-4 shrink-0", groupActive ? "text-cfm-700" : "text-graphite-500")}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{getGroupLabel(group)}</span>
                    <ChevronDown
                      className={cn("size-3.5 shrink-0 text-graphite-400", expanded && "rotate-180")}
                      aria-hidden
                    />
                  </button>

                  {expanded && (
                    <ul className="border-y border-graphite-100 bg-graphite-25 py-0.5">
                      {group.items.map((item) => {
                        const Icon = getNavigationIcon(item.icon);
                        const active = item.href === activeHref;

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex h-10 items-center gap-2.5 border-l-2 px-3 pl-7 text-[13px]",
                                active
                                  ? "border-cfm-400 bg-cfm-800 font-medium text-white"
                                  : "border-transparent text-graphite-600 hover:bg-graphite-100 hover:text-cfm-900"
                              )}
                              aria-current={active ? "page" : undefined}
                            >
                              <Icon
                                className={cn(
                                  "size-[15px] shrink-0",
                                  active ? "text-cfm-100" : "text-graphite-400"
                                )}
                                aria-hidden
                              />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </nav>
        </div>
      </dialog>
    </>
  );
}
