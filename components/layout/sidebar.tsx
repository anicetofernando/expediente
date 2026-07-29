"use client";

import Link from "next/link";
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
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

export function Sidebar() {
  const pathname = usePathname() ?? "";
  const { sidebarCollapsed, toggleSidebar, perfilNavegacao } = useSession();
  const visibleGroups = getVisibleNavigation(perfilNavegacao);
  const activeHref = getActiveHref(pathname, visibleGroups);
  const currentGroup = getActiveGroup(pathname, visibleGroups, activeHref) ?? visibleGroups[0];
  const GroupIcon = currentGroup ? getGroupIcon(currentGroup) : null;

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col overflow-hidden border-r border-graphite-200 bg-white lg:flex",
        sidebarCollapsed ? "w-[52px]" : "w-[236px]"
      )}
      aria-label={currentGroup ? `Navegação: ${getGroupLabel(currentGroup)}` : "Navegação"}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-graphite-200 bg-white px-3",
          sidebarCollapsed && "justify-center px-0"
        )}
      >
        {GroupIcon && (
          <span className="flex size-7 shrink-0 items-center justify-center border-l-2 border-cfm-500 bg-cfm-50 text-cfm-700">
            <GroupIcon className="size-[15px]" aria-hidden />
          </span>
        )}
        {!sidebarCollapsed && currentGroup && (
          <span className="ml-2.5 min-w-0 leading-tight">
            <span className="block truncate text-[12.5px] font-semibold text-cfm-900">
              {getGroupLabel(currentGroup)}
            </span>
            <span className="mt-0.5 block text-[10px] text-graphite-500">Navegação rápida</span>
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-1.5 scrollbar-none">
        <ul>
          {currentGroup?.items.map((item) => {
            const Icon = getNavigationIcon(item.icon);
            const active = item.href === activeHref;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex h-9 items-center border-l-2 text-[12.5px] transition-colors",
                    sidebarCollapsed ? "justify-center px-0" : "gap-2.5 px-3",
                    active
                      ? "border-cfm-400 bg-cfm-800 font-medium text-white"
                      : "border-transparent text-graphite-600 hover:bg-graphite-50 hover:text-cfm-900"
                  )}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn(
                      "size-[15px] shrink-0",
                      active ? "text-cfm-100" : "text-graphite-500"
                    )}
                    aria-hidden
                  />
                  {!sidebarCollapsed && <span className="min-w-0 truncate">{item.label}</span>}
                  {!sidebarCollapsed && active && (
                    <ChevronRight className="ml-auto size-3.5 shrink-0 text-cfm-100" aria-hidden />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-graphite-200">
        <button
          type="button"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expandir menu" : undefined}
          className={cn(
            "flex h-9 w-full items-center text-xs text-graphite-500 transition-colors hover:bg-graphite-50 hover:text-cfm-900",
            sidebarCollapsed ? "justify-center" : "gap-2.5 px-3"
          )}
          aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4" aria-hidden />
              <span>Recolher menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
