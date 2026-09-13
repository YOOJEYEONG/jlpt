"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import { NAV_GROUPS } from "./nav-items";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";

export function Sidebar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const user = useCurrentUser();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-line bg-surface lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white jp">
            日
          </span>
          <span className="text-sm font-bold leading-tight">
            니혼고 로드맵
            <span className="block text-xs font-medium text-muted">JLPT · 일본 취업</span>
          </span>
        </Link>

        {hydrated && user ? (
          <div className="mx-4 mb-3 flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-primary">{user.account.name}님</p>
              <p className="truncate text-[11px] text-primary/70">목표 {user.data.targetJlpt}</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-accent">
              <Flame className="h-3.5 w-3.5" />
              {user.data.streak}
            </span>
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#9aa1ad]">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-white"
                            : "text-muted hover:bg-background hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
