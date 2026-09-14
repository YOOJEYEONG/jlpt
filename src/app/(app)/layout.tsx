"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { StudyTimer } from "@/components/layout/study-timer";
import { SyncProvider } from "@/components/layout/sync-provider";
import { LoadingBlock } from "@/components/ui/states";
import { useCurrentUser } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.data.onboarded && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [hydrated, user, router, pathname]);

  return (
    <div className="flex min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        본문으로 바로가기
      </a>
      <StudyTimer />
      <SyncProvider />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          {!hydrated || !user ? <LoadingBlock /> : children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
