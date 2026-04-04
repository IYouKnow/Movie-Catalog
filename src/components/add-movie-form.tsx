"use client";

import { addWatchEntry, type AddWatchState } from "@/lib/watch-actions";
import type { OmdbSearchItem } from "@/lib/omdb";
import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";

const initial: AddWatchState = {};

export function AddMovieForm() {
  const [state, formAction, pending] = useActionState(addWatchEntry, initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OmdbSearchItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState<OmdbSearchItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.ok) return;
    setSuccessMsg("Saved to your catalog.");
    setSelected(null);
    setQuery("");
    setResults([]);
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
          const data: { results?: OmdbSearchItem[]; error?: string } =
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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="search" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Search OMDb
        </label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Title (e.g. The Matrix)"
          autoComplete="off"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Results appear after you type at least two characters.
        </p>
        {searchLoading ? (
          <p className="text-sm text-zinc-500">Searching…</p>
        ) : null}
        {searchError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {searchError}
          </p>
        ) : null}
        {results.length > 0 ? (
          <ul
            className="max-h-80 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"
            role="listbox"
            aria-label="Search results"
          >
            {results.map((item) => {
              const active = selected?.imdbID === item.imdbID;
              const hasPoster = Boolean(item.Poster && item.Poster !== "N/A");
              return (
                <li key={item.imdbID}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setSelected(item)}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                      active ? "bg-zinc-200 dark:bg-zinc-800" : ""
                    }`}
                  >
                    <div className="relative mt-0.5 h-[72px] w-[48px] shrink-0 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-700">
                      {hasPoster ? (
                        <Image
                          src={item.Poster}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-zinc-500 dark:text-zinc-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {item.Title}
                      </span>
                      <span className="text-xs capitalize text-zinc-500">
                        {item.Year} · {item.Type}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <form action={formAction} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <input type="hidden" name="imdbId" value={selected?.imdbID ?? ""} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="userRating" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Your rating (1–10)
          </label>
          <select
            id="userRating"
            name="userRating"
            defaultValue={7}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {selected ? (
          <div className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
              {selected.Poster && selected.Poster !== "N/A" ? (
                <Image
                  src={selected.Poster}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-zinc-500">
                  No image
                </div>
              )}
            </div>
            <p className="min-w-0 pt-1">
              Selected:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{selected.Title}</span>{" "}
              ({selected.Year})
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Pick a title from the search results.</p>
        )}

        {state?.error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        ) : null}
        {successMsg ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400" role="status">
            {successMsg}{" "}
            <Link href="/catalog" className="font-medium underline underline-offset-2">
              View catalog
            </Link>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !selected}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : "Mark as watched"}
        </button>
      </form>
    </div>
  );
}
