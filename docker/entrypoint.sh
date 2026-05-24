#!/bin/sh
set -eu

DB_URL="${DATABASE_URL:-}"
DB_PATH=""

case "$DB_URL" in
  file:*)
    DB_PATH="${DB_URL#file:}"
    ;;
esac

if [ -n "$DB_PATH" ]; then
  DB_DIR="$(dirname "$DB_PATH")"
  mkdir -p "$DB_DIR"

  if [ ! -f "$DB_PATH" ] && [ -f /app/prisma-template.db ]; then
    cp /app/prisma-template.db "$DB_PATH"
  fi
fi

exec node server.js
