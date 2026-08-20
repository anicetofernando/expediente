"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-8 w-full items-center justify-between gap-2 rounded-sm border border-graphite-300 bg-white px-2.5 text-[13px] text-graphite-900",
      "hover:border-graphite-400 focus:border-cfm-700 focus:outline-none",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cfm-500",
      "disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-graphite-400",
      "data-[placeholder]:text-graphite-400",
      className
    )}
    {...props}
  >
    <span className="min-w-0 flex-1 truncate text-left">{children}</span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-3.5 shrink-0 text-graphite-400" aria-hidden />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-sm border border-graphite-400 bg-white",
        position === "popper" && "translate-y-1 w-[var(--radix-select-trigger-width)]",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-0.5">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-[13px] leading-4 text-graphite-700 outline-none",
      "focus:bg-graphite-100 focus:text-cfm-900 data-[state=checked]:bg-graphite-100 data-[state=checked]:font-medium data-[state=checked]:text-cfm-900",
      "data-[disabled]:pointer-events-none data-[disabled]:text-graphite-300",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-3.5" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide text-graphite-500", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("my-1 h-px bg-graphite-150", className)} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";
