"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials } from "@/lib/utils";

const colorMap: Record<string, string> = {
  navy: "bg-navy-700 text-white",
  info: "bg-info-600 text-white",
  success: "bg-success-600 text-white",
  amber: "bg-amber-500 text-white",
  crimson: "bg-crimson-700 text-white",
  graphite: "bg-graphite-500 text-white",
};

export function UserAvatar({
  name,
  color = "navy",
  size = "md",
  className,
}: {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-9 text-[13px]", lg: "size-12 text-base" };
  return (
    <AvatarPrimitive.Root className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", sizes[size], colorMap[color] ?? colorMap.navy, className)}>
      <AvatarPrimitive.Fallback delayMs={0}>{initials(name)}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
