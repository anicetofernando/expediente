"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { size?: "sm" | "md" | "lg" | "xl" }
>(({ className, children, size = "md", ...props }, ref) => {
  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-xl", xl: "max-w-3xl" };
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-graphite-950/35 animate-fade-in" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-[calc(100vw-2rem)] border-l border-graphite-200 bg-white shadow-modal animate-slide-in-right flex flex-col",
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3.5 top-3.5 rounded-md p-1 text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700 focus:outline-none focus:ring-2 focus:ring-navy-500/30">
          <X className="size-4" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
DrawerContent.displayName = "DrawerContent";

export function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-graphite-150 px-5 py-4 shrink-0", className)} {...props} />;
}

export function DrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-2 border-t border-graphite-150 px-5 py-3.5 shrink-0", className)} {...props} />;
}

export const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-[15px] font-semibold text-graphite-900", className)} {...props} />
));
DrawerTitle.displayName = "DrawerTitle";

export const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("mt-1 text-[13px] text-graphite-500", className)} {...props} />
));
DrawerDescription.displayName = "DrawerDescription";
