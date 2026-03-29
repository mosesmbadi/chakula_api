#!/bin/sh
set -e

echo "Waiting for Postgres…"
RETRIES=30
until node -e "
  const {Client} = require('pg');
  const c = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
  });
  c.connect().then(() => { c.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null || [ "$RETRIES" -le 0 ]; do
  RETRIES=$((RETRIES - 1))
  echo "  Postgres not ready, retrying ($RETRIES left)…"
  sleep 1
done

echo "Running migrations…"
node core/database/migrate.js

echo "Starting Chakula API…"
exec node app.js
