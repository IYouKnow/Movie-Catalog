#!/bin/sh
set -eu

node /app/init-db.js

exec node server.js
