"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const PENDING_ATTRIBUTE = "data-navigation-pending";

function internalDestination(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin) return false;

  const current = `${window.location.pathname}${window.location.search}`;
  return `${destination.pathname}${destination.search}` !== current;
}

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<number>();

  useEffect(() => {
    document.body.removeAttribute(PENDING_ATTRIBUTE);
    if (timer.current) window.clearTimeout(timer.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    function show(event: PointerEvent | MouseEvent) {
      if (event.defaultPrevented || ("button" in event && event.button !== 0)) return;
      if (event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !internalDestination(anchor)) return;

      document.body.setAttribute(PENDING_ATTRIBUTE, "true");
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => document.body.removeAttribute(PENDING_ATTRIBUTE), 8_000);
    }

    function clear() {
      document.body.removeAttribute(PENDING_ATTRIBUTE);
    }

    document.addEventListener("pointerdown", show, { capture: true, passive: true });
    document.addEventListener("click", show, true);
    window.addEventListener("pageshow", clear);
    window.addEventListener("popstate", clear);
    return () => {
      document.removeEventListener("pointerdown", show, true);
      document.removeEventListener("click", show, true);
      window.removeEventListener("pageshow", clear);
      window.removeEventListener("popstate", clear);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return <div className="navigation-progress" aria-hidden="true" />;
}
