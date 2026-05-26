import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/catalog");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-10 px-4 py-24 text-center sm:px-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Your watched movies and series, in one place
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Log what you have watched, rate it, and keep rich details from OMDb
          with TMDB as a fallback when OMDb misses a title. Sign in to see only
          your catalog.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
        >
          Sign in
        </Link>
      </div>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-500">
        You will need a free API key from{" "}
        <a
          href="http://www.omdbapi.com/apikey.aspx"
          className="font-medium text-zinc-800 underline-offset-2 hover:underline dark:text-zinc-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          OMDb
        </a>{" "}
        set in your server environment as{" "}
        <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs dark:bg-zinc-800">
          OMDB_API_KEY
        </code>
        . You can optionally add{" "}
        <code className="rounded bg-zinc-200 px-1 py-0.5 text-xs dark:bg-zinc-800">
          TMDB_API_READ_TOKEN
        </code>{" "}
        for fallback search.
      </p>
    </div>
  );
}
