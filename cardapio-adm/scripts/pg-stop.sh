#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGDIR="$ROOT/.pgdata"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"

if "$PGBIN/pg_ctl" -D "$PGDIR" status >/dev/null 2>&1; then
  "$PGBIN/pg_ctl" -D "$PGDIR" stop -m fast
  echo "Postgres parado."
else
  echo "Postgres não está rodando."
fi
