"use client";

import { useState, useRef } from "react";
import { EXPORT_COLUMNS, ExportFormat } from "@/lib/export-types";
import { exportEntries } from "@/lib/import-export-actions";

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ColumnPreset = "essential" | "details" | "extended" | "all" | "custom";

const PRESETS: { key: ColumnPreset; label: string; description: string; columns: string[] }[] = [
  {
    key: "essential",
    label: "Essential",
    description: "Basic info: title, type, year, rating, and watched date",
    columns: ["title", "type", "year", "userRating", "watchedAt"],
  },
  {
    key: "details",
    label: "With Details",
    description: "Essential plus genre, director, actors, and plot summary",
    columns: ["title", "type", "year", "userRating", "watchedAt", "genre", "director", "actors", "plot"],
  },
  {
    key: "extended",
    label: "Full",
    description: "Everything: all fields including runtime, rating, and IMDb ID",
    columns: EXPORT_COLUMNS.map((c) => c.key),
  },
];

const CUSTOM_PRESET = { key: "custom" as ColumnPreset, label: "Custom", description: "Choose exactly which columns you want to export", columns: [] as string[] };

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [preset, setPreset] = useState<ColumnPreset>("extended");
  const [customColumns, setCustomColumns] = useState<Set<string>>(
    new Set(EXPORT_COLUMNS.map((c) => c.key)),
  );
  const [isExporting, setIsExporting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!isOpen) return null;

  const getSelectedColumns = (): string[] => {
    if (preset === "custom") {
      return Array.from(customColumns);
    }
    const selectedPreset = PRESETS.find((p) => p.key === preset);
    return selectedPreset ? selectedPreset.columns : [];
  };

  const toggleCustomColumn = (key: string) => {
    setCustomColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedColumns = getSelectedColumns();
    if (selectedColumns.length === 0) return;

    setIsExporting(true);
    const formData = new FormData();
    formData.set("format", format);
    formData.set("columns", JSON.stringify(selectedColumns));

    const result = await exportEntries(undefined, formData);

    if (result.data && result.filename && result.contentType) {
      const blob = new Blob([result.data], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    }
    setIsExporting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Export watchlist
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                  className="h-4 w-4"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">CSV</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === "json"}
                  onChange={() => setFormat("json")}
                  className="h-4 w-4"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">JSON</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Columns
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {[...PRESETS, CUSTOM_PRESET].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    preset === p.key
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {[...PRESETS, CUSTOM_PRESET].find((p) => p.key === preset)?.description}
            </p>

            {preset === "custom" && (
              <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {EXPORT_COLUMNS.map((col) => (
                    <label key={col.key} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customColumns.has(col.key)}
                        onChange={() => toggleCustomColumn(col.key)}
                        className="h-3.5 w-3.5 rounded border-zinc-300"
                      />
                      <span className="text-zinc-600 dark:text-zinc-400">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(preset === "custom" && customColumns.size === 0) && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Select at least one column to export.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={getSelectedColumns().length === 0 || isExporting}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
