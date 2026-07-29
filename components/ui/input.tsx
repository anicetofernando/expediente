import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, "aria-invalid": ariaInvalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || ariaInvalid}
        className={cn(
          "flex h-8 w-full rounded-sm border bg-white px-2.5 text-[13px] text-graphite-900 placeholder:text-graphite-400 transition-colors",
          "border-graphite-300 hover:border-graphite-400 focus:border-cfm-700 focus:outline-none",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cfm-500",
          "disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-graphite-400",
          "aria-[invalid=true]:border-crimson-500 aria-[invalid=true]:focus:border-crimson-600 aria-[invalid=true]:focus-visible:outline-crimson-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  InputProps & { onClear?: () => void }
>(({ className, onClear, value, invalid, "aria-invalid": ariaInvalid, ...props }, ref) => {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-graphite-400"
        aria-hidden
      />
      <input
        ref={ref}
        value={value}
        aria-invalid={invalid || ariaInvalid}
        className={cn(
          "h-8 w-full rounded-sm border border-graphite-300 bg-white pl-8 pr-8 text-[13px] text-graphite-900 placeholder:text-graphite-400 transition-colors",
          "hover:border-graphite-400 focus:border-cfm-700 focus:outline-none",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cfm-500",
          "disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-graphite-400",
          "aria-[invalid=true]:border-crimson-500 aria-[invalid=true]:focus:border-crimson-600 aria-[invalid=true]:focus-visible:outline-crimson-500",
          className
        )}
        {...props}
      />
      {onClear && value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-graphite-400 hover:bg-graphite-100 hover:text-graphite-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cfm-500"
          aria-label="Limpar pesquisa"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[72px] w-full rounded-sm border border-graphite-300 bg-white px-2.5 py-2 text-[13px] text-graphite-900 placeholder:text-graphite-400 transition-colors",
          "hover:border-graphite-400 focus:border-cfm-700 focus:outline-none",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cfm-500",
          "disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-graphite-400",
          "aria-[invalid=true]:border-crimson-500 aria-[invalid=true]:focus:border-crimson-600 aria-[invalid=true]:focus-visible:outline-crimson-500",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export function Label({ className, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("mb-1 block text-xs font-semibold leading-4 text-graphite-700", className)} {...props}>
      {props.children}
      {required && (
        <span className="ml-0.5 text-crimson-600" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export function FieldHint({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <p
      className={cn("mt-1 text-xs leading-4", error ? "text-crimson-600" : "text-graphite-500")}
      role={error ? "alert" : undefined}
    >
      {children}
    </p>
  );
}
