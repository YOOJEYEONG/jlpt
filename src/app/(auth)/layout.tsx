import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-5xl px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="jp flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            日
          </span>
          <span className="text-sm font-bold">니혼고 로드맵</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
