"use client";

import { cn } from "@/lib/utils";

export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border font-semibold transition-colors",
              size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active
                ? "border-transparent bg-primary text-white"
                : "border-line bg-surface text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
