"use client";

import { addWatchEntry, type AddWatchState } from "@/lib/watch-actions";
import type { CatalogSearchItem } from "@/lib/titles";
import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";

const initial: AddWatchState = {};

function PosterImg({
  src,
  className,
  fallback,
}: {
  src: string | null | undefined;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) {
    return <>{fallback}</>;
  }
  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function AddMovieForm() {
  const [state, formAction, pending] = useActionState(addWatchEntry, initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSearchItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState<CatalogSearchItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [rating, setRating] = useState(7);

  useEffect(() => {
    if (!state?.ok) return;
    setSuccessMsg("Saved to your catalog.");
    setSelected(null);
    setQuery("");
    setResults([]);
    setRating(7);
  }, [state?.ok]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const ac = new AbortController();
    const id = setTimeout(() => {
      void (async () => {
        setSearchLoading(true);
        setSearchError(null);
        try {
          const res = await fetch(
            `/api/omdb/search?q=${encodeURIComponent(q)}`,
            { signal: ac.signal },
          );
          const data: { results?: CatalogSearchItem[]; error?: string } =
            await res.json();
          if (!res.ok) {
            setSearchError(data.error ?? "Search failed.");
            setResults([]);
            return;
          }
          setResults(data.results ?? []);
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setSearchError("Could not reach the server.");
          setResults([]);
        } finally {
          if (!ac.signal.aborted) setSearchLoading(false);
        }
      })();
    }, 350);

    return () => {
      clearTimeout(id);
      ac.abort();
    };
  }, [query]);

  useEffect(() => {
    if (selected) setSuccessMsg(null);
  }, [selected]);

  const qTrim = query.trim();
  const showEmptyHint =
    qTrim.length >= 2 &&
    !searchLoading &&
    !searchError &&
    results.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
      <section
        className="flex min-h-[min(360px,50vh)] min-w-0 flex-1 flex-col gap-2.5 lg:min-h-0"
        aria-label="Search and select a title"
      >
        <div className="relative shrink-0">
          <label
            htmlFor="search"
            className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm sm:text-zinc-700 sm:dark:text-zinc-300"
          >
            Search titles
          </label>
          <div className="group relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition group-focus-within:text-zinc-600 dark:text-zinc-500 dark:group-focus-within:text-zinc-300" />
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Film or show name..."
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-zinc-200/80 bg-white/90 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none ring-zinc-400/25 transition placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 dark:border-zinc-700/80 dark:bg-zinc-900/80 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-600/20 sm:h-11 sm:pl-11 sm:text-[0.9375rem]"
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500 sm:text-xs">
            OMDb first, TMDB fallback if OMDb has no match.
          </p>
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200/80 bg-white/60 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/40"
          aria-live="polite"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-3.5">
            {qTrim.length < 2 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center lg:py-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
                  <SearchIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <p className="max-w-[240px] text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
                  Type to search, then tap a poster to select.
                </p>
              </div>
            ) : null}

            {searchLoading ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 lg:gap-3 xl:grid-cols-7 2xl:grid-cols-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg border border-zinc-200/60 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-800/40"
                  >
                    <div className="aspect-[2/3] animate-pulse bg-zinc-200 dark:bg-zinc-700/60" />
                    <div className="space-y-1.5 p-2">
                      <div className="h-3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700/60" />
                      <div className="h-2.5 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700/60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {searchError ? (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-8 text-center dark:border-red-900/50 dark:bg-red-950/30"
                role="alert"
              >
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{searchError}</p>
              </div>
            ) : null}

            {showEmptyHint ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No titles found</p>
                <p className="max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                  Try another spelling or a shorter phrase.
                </p>
              </div>
            ) : null}

            {!searchLoading && !searchError && results.length > 0 ? (
              <ul
                className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 lg:gap-3 xl:grid-cols-7 2xl:grid-cols-8"
                role="listbox"
                aria-label="Search results"
              >
                {results.map((item) => {
                  const active =
                    selected?.source === item.source &&
                    selected?.sourceId === item.sourceId;
                  return (
                    <li key={`${item.source}:${item.sourceId}`} className="min-w-0">
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => setSelected(item)}
                        className={`group flex w-full flex-col overflow-hidden rounded-lg border text-left shadow-sm transition ${
                          active
                            ? "border-emerald-500/80 ring-2 ring-emerald-500/30 dark:border-emerald-400/70 dark:ring-emerald-400/20"
                            : "border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow dark:border-zinc-700/90 dark:bg-zinc-900/50 dark:hover:border-zinc-600"
                        }`}
                      >
                        <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                          <PosterImg
                            src={item.posterUrl}
                            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            fallback={
                              <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                                No poster
                              </div>
                            }
                          />
                          {active ? (
                            <span className="absolute right-1 top-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm dark:bg-emerald-500">
                              Selected
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-0.5 p-2">
                          <span className="line-clamp-2 text-xs font-semibold leading-snug text-zinc-900 dark:text-zinc-50 sm:text-[13px]">
                            {item.title}
                          </span>
                          <span className="flex flex-wrap items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span>{item.year || "Unknown"}</span>
                            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
                              ·
                            </span>
                            <span className="capitalize">{item.type}</span>
                            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
                              ·
                            </span>
                            <span className="uppercase">{item.source}</span>
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="shrink-0 lg:max-h-full lg:w-[min(100%,300px)] lg:overflow-y-auto lg:overflow-x-hidden xl:w-[320px]">
        <form
          action={formAction}
          className="flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 p-4 shadow-lg shadow-zinc-200/30 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-950/80 dark:shadow-black/30 sm:gap-4 sm:p-5"
        >
          <input type="hidden" name="imdbId" value={selected?.imdbId ?? ""} />
          <input type="hidden" name="source" value={selected?.source ?? ""} />
          <input type="hidden" name="sourceId" value={selected?.sourceId ?? ""} />
          <input type="hidden" name="userRating" value={rating} />

          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Save to catalog
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Pick a title, set your rating, save.
            </p>
          </div>

          {selected ? (
            <div className="flex gap-3 rounded-xl border border-zinc-200/80 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="relative h-[5.5rem] w-[3.7rem] shrink-0 overflow-hidden rounded-lg bg-zinc-100 shadow-inner dark:bg-zinc-800">
                <PosterImg
                  src={selected.posterUrl}
                  className="absolute inset-0 h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-zinc-500">
                      No image
                    </div>
                  }
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <p className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                  {selected.title}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selected.year || "Unknown"}
                  <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="capitalize">{selected.type}</span>
                  <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                  <span className="uppercase">{selected.source}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300/90 bg-zinc-50/50 px-3 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/30">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
                Select a title from the results.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 sm:text-sm">
              Your rating (1-10)
            </span>
            <div
              className="grid grid-cols-5 gap-1 sm:gap-1.5"
              role="group"
              aria-label="Rating from 1 to 10"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const on = n === rating;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition sm:h-9 sm:text-sm ${
                      on
                        ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {state?.error ? (
            <p
              className="rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}
          {successMsg ? (
            <p
              className="rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-300"
              role="status"
            >
              {successMsg}{" "}
              <Link
                href="/catalog"
                className="font-semibold underline decoration-emerald-600/50 underline-offset-2 hover:decoration-emerald-600 dark:decoration-emerald-400/50"
              >
                Open catalog
              </Link>
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !selected}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white shadow-md shadow-zinc-900/20 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-zinc-100/10 dark:hover:bg-white"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-zinc-900/30 dark:border-t-zinc-900" />
                Saving...
              </span>
            ) : (
              "Mark as watched"
            )}
          </button>
        </form>
      </aside>
    </div>
  );
}
