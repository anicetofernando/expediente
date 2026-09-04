"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TableRow } from "@/components/ui/table";

export function NavigableTableRow({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter();

  function isInteractive(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(target.closest("a,button,input,select,textarea,[role='button']"));
  }

  return (
    <TableRow
      clickable
      role="link"
      tabIndex={0}
      className={className}
      onPointerEnter={() => router.prefetch(href)}
      onClick={(event) => { if (!isInteractive(event.target)) router.push(href); }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !isInteractive(event.target)) {
          event.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </TableRow>
  );
}
