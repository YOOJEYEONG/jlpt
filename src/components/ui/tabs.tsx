"use client";

import { cn } from "@/lib/utils";

/**
 * 선택지를 고르는 토글 버튼 묶음.
 * 연결된 tabpanel이 없으므로 role="tab" 대신 aria-pressed를 씁니다.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
  size = "md",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  /** 스크린 리더가 이 묶음이 무엇을 고르는 것인지 알 수 있게 합니다. */
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
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
