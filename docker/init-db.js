const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function getDbPath() {
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must use the SQLite file: format.");
  }
  return url.slice("file:".length);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function hasCoreTables(db) {
  const names = db
    .prepare("select name from sqlite_master where type = 'table'")
    .all()
    .map((row) => row.name);

  return names.includes("User") && names.includes("WatchEntry");
}

function runMigrations(db) {
  const migrationsDir = "/app/prisma/migrations";
  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const entry of entries) {
    const sqlPath = path.join(migrationsDir, entry, "migration.sql");
    if (!fs.existsSync(sqlPath)) continue;
    const sql = fs.readFileSync(sqlPath, "utf8");
    db.exec(sql);
  }
}

function main() {
  const dbPath = getDbPath();
  ensureDir(dbPath);

  const db = new Database(dbPath);
  try {
    if (!hasCoreTables(db)) {
      runMigrations(db);
    }
  } finally {
    db.close();
  }
}

main();
