const fs = require("fs");
const Database = require("better-sqlite3");

function getDbPath() {
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("file:")) {
    throw new Error("DATABASE_URL must use the SQLite file: format.");
  }
  return url.slice("file:".length);
}

function ensureDir(filePath) {
  const path = require("path");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function hasCoreTables(db) {
  const names = db
    .prepare("select name from sqlite_master where type = 'table'")
    .all()
    .map((row) => row.name);

  return names.includes("User") && names.includes("WatchEntry");
}

function runSchemaInit(db) {
  const sql = fs.readFileSync("/app/init-schema.sql", "utf8");
  db.exec(sql);
}

function main() {
  const dbPath = getDbPath();
  ensureDir(dbPath);

  const db = new Database(dbPath);
  try {
    if (!hasCoreTables(db)) {
      runSchemaInit(db);
    }
  } finally {
    db.close();
  }
}

main();
