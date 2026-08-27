"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { SearchInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Pesquisar…",
  emptyMessage = "Nenhum resultado.",
  disabled,
  className,
  id,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const selected = options.find((option) => option.value === value);

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(query) || option.description?.toLowerCase().includes(query),
    );
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setSearch(""); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-sm border border-graphite-300 bg-white px-2.5 text-[13px] text-graphite-900",
            "hover:border-graphite-400 focus:border-cfm-700 focus:outline-none",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cfm-500",
            "disabled:cursor-not-allowed disabled:bg-graphite-50 disabled:text-graphite-400",
            !selected && "text-graphite-400",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="size-3.5 shrink-0 text-graphite-400" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b border-graphite-150 p-2">
          <SearchInput
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 text-center text-[13px] text-graphite-500">{emptyMessage}</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onValueChange(option.value); setOpen(false); setSearch(""); }}
                className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-left text-[13px] leading-4 text-graphite-700 outline-none hover:bg-graphite-100 hover:text-cfm-900"
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {option.value === value && <Check className="size-3.5" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
