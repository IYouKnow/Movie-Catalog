import { AddMovieForm } from "@/components/add-movie-form";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AddPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="relative isolate lg:flex lg:h-[calc(100dvh-3.5rem)] lg:max-h-[calc(100dvh-3.5rem)] lg:flex-col lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute -top-24 left-1/2 h-[280px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-200/35 to-transparent blur-3xl dark:from-violet-950/35 dark:to-transparent" />
        <div className="absolute -right-20 top-24 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl dark:bg-cyan-950/25" />
        <div className="absolute -left-16 top-1/3 h-48 w-48 rounded-full bg-amber-200/15 blur-3xl dark:bg-amber-950/15" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:py-3">
        <nav className="mb-3 shrink-0" aria-label="Breadcrumb">
          <Link
            href="/catalog"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 sm:text-sm"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200/80 text-zinc-600 transition group-hover:bg-zinc-300/80 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700"
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
            Back to catalog
          </Link>
        </nav>

        <header className="mb-3 shrink-0 max-w-2xl lg:mb-2">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
            Add a watched title
          </h1>
          <p className="mt-1 text-xs leading-snug text-zinc-600 sm:text-sm dark:text-zinc-400">
            Search OMDb, pick a poster, rate it — cast, genres, and plot save automatically.
          </p>
        </header>

        <div className="min-h-0 flex-1 lg:overflow-hidden">
          <AddMovieForm />
        </div>
      </div>
    </div>
  );
}
