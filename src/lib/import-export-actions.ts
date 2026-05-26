"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EXPORT_COLUMNS, ExportFormat } from "@/lib/export-types";
import { getTitleDetail } from "@/lib/titles";

function emptyToNull(v: string | undefined | null): string | null {
  if (v == null || v === "" || v === "N/A") return null;
  return v;
}

export type ExportState = {
  error?: string;
  data?: string;
  filename?: string;
  contentType?: string;
};

function getColumnValue(entry: Record<string, unknown>, key: string): string {
  const value = entry[key];
  if (value == null) return "";
  if (key === "watchedAt") {
    return new Date(value as string).toISOString().split("T")[0];
  }
  return String(value);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportEntries(
  _prev: ExportState | undefined,
  formData: FormData,
): Promise<ExportState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You need to be signed in." };
  }

  const format = (formData.get("format") as ExportFormat) || "csv";
  const columnsJson = formData.get("columns") as string;
  let columns: string[];

  try {
    columns = JSON.parse(columnsJson);
  } catch {
    return { error: "Invalid column selection." };
  }

  if (columns.length === 0) {
    return { error: "Select at least one column." };
  }

  const entries = await prisma.watchEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
  });

  const columnDefs = EXPORT_COLUMNS.filter((c) => columns.includes(c.key));
  const headers = columnDefs.map((c) => c.label);

  if (format === "csv") {
    const rows = entries.map((entry) => {
      return columnDefs
        .map((c) => escapeCSV(getColumnValue(entry as unknown as Record<string, unknown>, c.key)))
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    return {
      data: csv,
      filename: `watchlist-${new Date().toISOString().split("T")[0]}.csv`,
      contentType: "text/csv",
    };
  } else {
    const jsonData = entries.map((entry) => {
      const obj: Record<string, unknown> = {};
      columnDefs.forEach((c) => {
        obj[c.label] = entry[c.key as keyof typeof entry] ?? null;
      });
      return obj;
    });

    return {
      data: JSON.stringify(jsonData, null, 2),
      filename: `watchlist-${new Date().toISOString().split("T")[0]}.json`,
      contentType: "application/json",
    };
  }
}

export type ImportState = {
  error?: string;
  ok?: boolean;
  imported?: number;
  skipped?: number;
  updated?: number;
};

export async function importEntries(
  _prev: ImportState | undefined,
  formData: FormData,
): Promise<ImportState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You need to be signed in." };
  }

  const format = (formData.get("format") as "csv" | "json") || "csv";
  const data = (formData.get("data") as string) || "";
  const columnMappingJson = (formData.get("columnMapping") as string) || "{}";
  const duplicateMode = (formData.get("duplicateMode") as "skip" | "update") || "skip";

  let columnMapping: Record<string, string>;
  try {
    columnMapping = JSON.parse(columnMappingJson);
  } catch {
    return { error: "Invalid column mapping." };
  }

  let entries: Record<string, string>[];
  try {
    if (format === "csv") {
      entries = parseCSV(data, columnMapping);
    } else {
      entries = parseJSON(data, columnMapping);
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to parse data." };
  }

  if (entries.length === 0) {
    return { error: "No valid entries found in the file." };
  }

  let imported = 0;
  let skipped = 0;
  let updated = 0;

  const existingEntries = await prisma.watchEntry.findMany({
    where: { userId: session.user.id },
    select: { imdbId: true },
  });
  const existingIds = new Set(existingEntries.map((e) => e.imdbId));

  for (const entry of entries) {
    const imdbId = entry.imdbId?.trim() || null;
    const title = entry.title?.trim();

    if (!title) continue;

    if (imdbId && existingIds.has(imdbId)) {
      if (duplicateMode === "update") {
        const ratingStr = entry.userRating || entry.rating;
        const rating = ratingStr ? parseInt(String(ratingStr), 10) : null;
        if (rating !== null && rating >= 1 && rating <= 10) {
          await prisma.watchEntry.updateMany({
            where: { userId: session.user.id, imdbId },
            data: { userRating: rating },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
      continue;
    }

    const ratingStr = entry.userRating || entry.rating;
    const rating = ratingStr ? parseInt(String(ratingStr), 10) : null;
    const watchDateStr = entry.watchedAt || entry.watchedDate;

    let detail = null;
    if (imdbId) {
      try {
        detail = await getTitleDetail("omdb", imdbId, imdbId);
      } catch {
        // Metadata fetch failed, continue with imported data
      }
    }

    try {
      await prisma.watchEntry.create({
        data: {
          userId: session.user.id,
          imdbId: imdbId || `import-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          title,
          type: detail?.type || entry.type?.trim() || "movie",
          year: emptyToNull(entry.year?.trim()) || emptyToNull(detail?.year),
          runtime: emptyToNull(entry.runtime?.trim()) || emptyToNull(detail?.runtime),
          genre: emptyToNull(entry.genre?.trim()) || emptyToNull(detail?.genre),
          director: emptyToNull(entry.director?.trim()) || emptyToNull(detail?.director),
          actors: emptyToNull(entry.actors?.trim()) || emptyToNull(detail?.actors),
          plot: emptyToNull(entry.plot?.trim()) || emptyToNull(detail?.plot),
          rated: emptyToNull(entry.rated?.trim()) || emptyToNull(detail?.rated),
          posterUrl: emptyToNull(detail?.posterUrl),
          userRating: rating !== null && rating >= 1 && rating <= 10 ? rating : 5,
          watchedAt: watchDateStr ? new Date(watchDateStr) : new Date(),
        },
      });
      imported++;
      if (imdbId) existingIds.add(imdbId);
    } catch {
      skipped++;
    }
  }

  revalidatePath("/catalog");
  return { ok: true, imported, skipped, updated };
}

function parseCSV(
  csvData: string,
  columnMapping: Record<string, string>,
): Record<string, string>[] {
  const lines = csvData.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const dataLines = lines.slice(1);

  const reverseMapping: Record<string, number> = {};
  for (const [target, source] of Object.entries(columnMapping)) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase() === source.toLowerCase() || h === source,
    );
    if (idx !== -1) reverseMapping[target] = idx;
  }

  return dataLines
    .map((line) => {
      const values = parseCSVLine(line);
      const obj: Record<string, string> = {};
      for (const [target, idx] of Object.entries(reverseMapping)) {
        obj[target] = values[idx] || "";
      }
      return obj;
    })
    .filter((row) => Object.values(row).some((v) => v.trim()));
}

function parseCSVLine(line: string): string[] {
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
}

function parseJSON(
  jsonData: string,
  columnMapping: Record<string, string>,
): Record<string, string>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonData);
  } catch {
    throw new Error("Invalid JSON format.");
  }

  const arr = Array.isArray(parsed) ? parsed : [parsed];
  const reverseMapping: Record<string, string> = {};
  for (const [target, source] of Object.entries(columnMapping)) {
    reverseMapping[target] = source;
  }

  return arr
    .map((item) => {
      if (typeof item !== "object" || item === null) return {};
      const obj: Record<string, string> = {};
      for (const [target, source] of Object.entries(reverseMapping)) {
        const value = (item as Record<string, unknown>)[source];
        obj[target] = value != null ? String(value) : "";
      }
      return obj;
    })
    .filter((row) => Object.values(row).some((v) => v.trim()));
}
