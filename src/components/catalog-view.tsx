"use client";

import { deleteWatchEntryForm, updateWatchRating } from "@/lib/watch-actions";
import type { WatchEntryModel as WatchEntry } from "@/generated/prisma/models/WatchEntry";
import Image from "next/image";
import { useMemo, useState } from "react";

type Tab = "all" | "movies" | "series";

function isMovieType(type: string) {
  return type.toLowerCase() === "movie";
}

function isSeriesType(type: string) {
  const t = type.toLowerCase();
  return t === "series" || t === "episode";
}

function filterEntries(entries: WatchEntry[], tab: Tab) {
  if (tab === "all") return entries;
  return entries.filter((e) =>
    tab === "movies" ? isMovieType(e.type) : isSeriesType(e.type),
  );
}

type CatalogViewProps = {
  entries: WatchEntry[];
};

export function CatalogView({ entries }: CatalogViewProps) {
  const [tab, setTab] = useState<Tab>("all");

  const counts = useMemo(() => {
    return {
      all: entries.length,
      movies: entries.filter((e) => isMovieType(e.type)).length,
      series: entries.filter((e) => isSeriesType(e.type)).length,
    };
  }, [entries]);

  const filtered = useMemo(() => filterEntries(entries, tab), [entries, tab]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "movies", label: "Movies", count: counts.movies },
    { id: "series", label: "Series", count: counts.series },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex flex-wrap gap-1 border-b border-zinc-200 dark:border-zinc-800"
        role="tablist"
        aria-label="Catalog type"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              id={`tab-${t.id}`}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`relative -mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums text-zinc-400 dark:text-zinc-500">
                ({t.count})
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800"
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {tab === "all"
              ? "Nothing here yet."
              : tab === "movies"
                ? "No movies in this view."
                : "No series in this view."}
          </p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                <th className="w-14 px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="sr-only">Poster</span>
                </th>
                <th className="px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Title
                </th>
                <th className="w-24 px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Year
                </th>
                <th className="w-28 px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Type
                </th>
                <th className="w-36 px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Your rating
                </th>
                <th className="w-32 px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Watched
                </th>
                <th className="w-28 px-3 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-zinc-100 bg-white last:border-0 dark:border-zinc-800/80 dark:bg-zinc-950"
                >
                  <td className="align-middle px-3 py-2">
                    <div className="relative h-[52px] w-[34px] overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
                      {entry.posterUrl ? (
                        <Image
                          src={entry.posterUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="34px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                          —
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[220px] align-middle px-3 py-2">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">
                      {entry.title}
                    </div>
                    {entry.genre ? (
                      <div className="mt-0.5 line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {entry.genre}
                      </div>
                    ) : null}
                  </td>
                  <td className="align-middle px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {entry.year ?? "—"}
                  </td>
                  <td className="align-middle px-3 py-2 capitalize text-zinc-600 dark:text-zinc-400">
                    {entry.type}
                  </td>
                  <td className="align-middle px-3 py-2">
                    <form
                      action={updateWatchRating}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <input type="hidden" name="entryId" value={entry.id} />
                      <select
                        name="userRating"
                        defaultValue={entry.userRating}
                        className="rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900"
                        aria-label={`Rating for ${entry.title}`}
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="align-middle whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {new Date(entry.watchedAt).toLocaleDateString()}
                  </td>
                  <td className="align-middle px-3 py-2">
                    <form action={deleteWatchEntryForm}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
