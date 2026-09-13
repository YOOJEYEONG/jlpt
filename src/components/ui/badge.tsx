import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { JlptLevel } from "@/lib/types";

const TONE: Record<string, string> = {
  default: "bg-background text-muted border-line",
  primary: "bg-primary-soft text-primary border-transparent",
  accent: "bg-accent-soft text-accent border-transparent",
  success: "bg-[#e8f7ee] text-success border-transparent",
  danger: "bg-[#fdeaea] text-danger border-transparent",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof TONE }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}

const LEVEL_TONE: Record<JlptLevel, keyof typeof TONE> = {
  BASIC: "default",
  N5: "success",
  N4: "success",
  N3: "primary",
  N2: "accent",
  N1: "danger",
};

export function LevelBadge({ level, className }: { level: JlptLevel; className?: string }) {
  const label = level === "BASIC" ? "기초" : level;
  return (
    <Badge tone={LEVEL_TONE[level]} className={className}>
      {label}
    </Badge>
  );
}
