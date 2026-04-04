import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth-actions";
import Link from "next/link";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={session?.user ? "/catalog" : "/"}
          className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Watch catalog
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          {session?.user ? (
            <>
              <Link
                href="/catalog"
                className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Catalog
              </Link>
              <Link
                href="/add"
                className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Add watched
              </Link>
              <span className="hidden text-zinc-400 sm:inline" aria-hidden>
                |
              </span>
              <span className="hidden max-w-[12rem] truncate text-zinc-500 sm:inline" title={session.user.email ?? ""}>
                {session.user.email}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
