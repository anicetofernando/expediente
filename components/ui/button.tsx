import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "destructive"
  | "outline"
  | "ghost"
  | "toolbar"
  | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-navy-800 border-b-navy-500 bg-navy-800 text-white hover:border-navy-900 hover:border-b-navy-600 hover:bg-navy-900 active:border-navy-950 active:bg-navy-950 disabled:border-graphite-200 disabled:bg-graphite-200 disabled:text-graphite-400",
  secondary:
    "border border-graphite-300 bg-graphite-50 text-graphite-800 hover:border-graphite-400 hover:bg-graphite-100 active:bg-graphite-150 disabled:border-graphite-200 disabled:bg-graphite-50 disabled:text-graphite-300",
  subtle:
    "border border-transparent bg-graphite-100 text-graphite-700 hover:bg-graphite-150 active:bg-graphite-200 disabled:text-graphite-300",
  destructive:
    "border border-crimson-700 bg-crimson-700 text-white hover:border-crimson-800 hover:bg-crimson-800 active:border-crimson-900 active:bg-crimson-900 disabled:border-graphite-200 disabled:bg-graphite-200 disabled:text-graphite-400",
  outline:
    "border border-graphite-400 bg-white text-graphite-800 hover:border-navy-600 hover:bg-graphite-50 hover:text-navy-900 active:border-navy-800 active:bg-graphite-100 disabled:border-graphite-200 disabled:text-graphite-300",
  ghost:
    "border border-transparent bg-transparent text-graphite-600 hover:bg-graphite-100 hover:text-graphite-900 active:bg-graphite-150 disabled:text-graphite-300",
  toolbar:
    "border border-transparent bg-transparent text-graphite-700 hover:border-graphite-300 hover:bg-white hover:text-cfm-900 active:border-cfm-500 active:bg-graphite-100 disabled:text-graphite-300",
  link: "h-auto border-none bg-transparent p-0 text-navy-800 underline-offset-4 hover:text-navy-950 hover:underline disabled:text-graphite-300",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 gap-1.5 rounded-sm px-2.5 text-xs",
  md: "h-8 gap-1.5 rounded-sm px-3 text-[13px]",
  lg: "h-8 gap-2 rounded-sm px-4 text-[13px]",
  icon: "size-8 shrink-0 rounded-sm",
  "icon-sm": "size-7 shrink-0 rounded-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-100",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-500",
          "disabled:cursor-not-allowed",
          variant !== "link" && sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && (
              <span
                className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
                aria-hidden
              />
            )}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";
