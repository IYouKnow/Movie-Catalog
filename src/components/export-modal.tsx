"use client";

import { useState, useRef } from "react";
import { EXPORT_COLUMNS, ExportFormat } from "@/lib/export-types";
import { exportEntries } from "@/lib/import-export-actions";

type ExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(EXPORT_COLUMNS.map((c) => c.key)),
  );
  const [isExporting, setIsExporting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedColumns(new Set(EXPORT_COLUMNS.map((c) => c.key)));
  };

  const deselectAll = () => {
    setSelectedColumns(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedColumns.size === 0) return;

    setIsExporting(true);
    const formData = new FormData();
    formData.set("format", format);
    formData.set("columns", JSON.stringify(Array.from(selectedColumns)));

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

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Columns to include
              </label>
              <div className="flex gap-2 text-sm">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Select all
                </button>
                <span className="text-zinc-400">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  Deselect all
                </button>
              </div>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              {EXPORT_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.has(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {col.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {selectedColumns.size === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Select at least one column to export.
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedColumns.size === 0 || isExporting}
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
