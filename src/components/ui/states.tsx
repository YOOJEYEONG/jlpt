import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <p className="text-base font-bold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-[#eceef2]", className)} />;
}

export function LoadingBlock({ label = "불러오는 중입니다" }: { label?: string }) {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#f3c8c8] bg-[#fdeaea] p-5 text-sm text-danger" role="alert">
      <p className="font-semibold">문제가 발생했습니다</p>
      <p className="mt-1">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white">
          다시 시도
        </button>
      ) : null}
    </div>
  );
}
