"use client";

import { useState, useRef, useCallback } from "react";
import { importEntries } from "@/lib/import-export-actions";

type ImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type Step = "upload" | "mapping" | "result";

const IMPORT_FIELDS = [
  { key: "title", label: "Title", required: true },
  { key: "imdbId", label: "IMDb ID", required: false },
  { key: "type", label: "Type", required: false },
  { key: "year", label: "Year", required: false },
  { key: "userRating", label: "Your Rating", required: false },
  { key: "watchedAt", label: "Watched Date", required: false },
  { key: "genre", label: "Genre", required: false },
  { key: "director", label: "Director", required: false },
  { key: "actors", label: "Actors", required: false },
  { key: "plot", label: "Plot", required: false },
  { key: "runtime", label: "Runtime", required: false },
  { key: "rated", label: "Rated", required: false },
];

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [rawData, setRawData] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{
    imported?: number;
    skipped?: number;
    updated?: number;
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const detectFormat = (filename: string, content: string): "csv" | "json" => {
    if (filename.endsWith(".json")) return "json";
    if (filename.endsWith(".csv")) return "csv";
    try {
      JSON.parse(content);
      return "json";
    } catch {
      return "csv";
    }
  };

  const parseCSVHeaders = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSVLine = (line: string): string[] => {
    return parseCSVHeaders(line);
  };

  const processFile = useCallback(async (selectedFile: File) => {
    const content = await selectedFile.text();
    setRawData(content);
    setFile(selectedFile);

    const detectedFormat = detectFormat(selectedFile.name, content);
    setFormat(detectedFormat);

    if (detectedFormat === "csv") {
      const lines = content.trim().split(/\r?\n/);
      if (lines.length > 0) {
        const fileHeaders = parseCSVHeaders(lines[0]);
        setHeaders(fileHeaders);
        setPreviewRows(lines.slice(1, 4).map(parseCSVLine));

        const autoMapping: Record<string, string> = {};
        for (const field of IMPORT_FIELDS) {
          const match = fileHeaders.find(
            (h) => h.toLowerCase() === field.label.toLowerCase(),
          );
          if (match) {
            autoMapping[field.key] = match;
          }
        }
        setColumnMapping(autoMapping);
      }
    } else {
      try {
        const parsed = JSON.parse(content);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        if (arr.length > 0) {
          const jsonKeys = Object.keys(arr[0] as object);
          setHeaders(jsonKeys);
          setPreviewRows(arr.slice(0, 3).map((item) => jsonKeys.map((k) => String((item as Record<string, unknown>)[k] ?? ""))));

          const autoMapping: Record<string, string> = {};
          for (const field of IMPORT_FIELDS) {
            const match = jsonKeys.find(
              (k) => k.toLowerCase() === field.label.toLowerCase(),
            );
            if (match) {
              autoMapping[field.key] = match;
            }
          }
          setColumnMapping(autoMapping);
        }
      } catch {
        setResult({ error: "Invalid JSON file." });
        return;
      }
    }

    setStep("mapping");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dropZoneRef.current?.classList.remove("border-blue-500", "bg-blue-50");
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        processFile(droppedFile);
      }
    },
    [processFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dropZoneRef.current?.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = () => {
    dropZoneRef.current?.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    const formData = new FormData();
    formData.set("format", format);
    formData.set("data", rawData);
    formData.set("columnMapping", JSON.stringify(columnMapping));
    formData.set("duplicateMode", duplicateMode);

    const importResult = await importEntries(undefined, formData);
    setResult(importResult);
    setStep("result");
    setIsImporting(false);

    if (importResult.ok) {
      onSuccess?.();
    }
  };

  const resetAndClose = () => {
    setStep("upload");
    setFile(null);
    setRawData("");
    setHeaders([]);
    setPreviewRows([]);
    setColumnMapping({});
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && resetAndClose()}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Import watchlist
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
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

        {step === "upload" && (
          <div className="space-y-4">
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-8 transition-colors hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
            >
              <svg
                className="mb-3 h-10 w-10 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Drop your file here, or click to browse
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Supports CSV and JSON files
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
              <svg
                className="h-4 w-4 flex-shrink-0 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="truncate text-zinc-600 dark:text-zinc-400">
                {file?.name}
              </span>
              <span className="ml-auto text-xs font-medium text-zinc-500">
                {format.toUpperCase()}
              </span>
            </div>

            {previewRows.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Preview
                </p>
                <div className="max-h-32 overflow-x-auto rounded border border-zinc-200 dark:border-zinc-700">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800">
                        {headers.map((h, i) => (
                          <th
                            key={i}
                            className="border border-zinc-200 px-2 py-1.5 text-left dark:border-zinc-700"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className="border border-zinc-200 px-2 py-1.5 dark:border-zinc-700"
                            >
                              <span className="line-clamp-1">{cell}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Column mapping
              </p>
              <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                Map your file columns to watchlist fields. Required fields are
                marked with{" "}
                <span className="text-red-500">*</span>
              </p>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                {IMPORT_FIELDS.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-3 text-sm"
                  >
                    <label className="w-28 flex-shrink-0 text-zinc-600 dark:text-zinc-400">
                      {field.label}
                      {field.required && (
                        <span className="ml-0.5 text-red-500">*</span>
                      )}
                    </label>
                    <select
                      value={columnMapping[field.key] || ""}
                      onChange={(e) =>
                        setColumnMapping((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                    >
                      <option value="">-- Not mapped --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Duplicate handling
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="duplicateMode"
                    value="skip"
                    checked={duplicateMode === "skip"}
                    onChange={() => setDuplicateMode("skip")}
                    className="h-4 w-4"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Skip duplicates
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="duplicateMode"
                    value="update"
                    checked={duplicateMode === "update"}
                    onChange={() => setDuplicateMode("update")}
                    className="h-4 w-4"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">
                    Update rating
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !columnMapping.title}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isImporting ? "Importing..." : "Import"}
              </button>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            {result.error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {result.error}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <p className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
                  Import complete!
                </p>
                <ul className="space-y-1 text-sm text-green-600 dark:text-green-400">
                  <li>Imported: {result.imported || 0}</li>
                  {result.updated ? <li>Updated: {result.updated}</li> : null}
                  <li>Skipped: {result.skipped || 0}</li>
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
