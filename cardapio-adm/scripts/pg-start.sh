#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGDIR="$ROOT/.pgdata"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PORT="${PGPORT_LOCAL:-55432}"

if [ ! -x "$PGBIN/pg_ctl" ]; then
  echo "PostgreSQL 16 não encontrado em $PGBIN"
  echo "Use Docker: docker compose up -d  (e ajuste DATABASE_URL para a porta 5432)"
  exit 1
fi

port_ready() {
  "$PGBIN/pg_isready" -h 127.0.0.1 -p "$PORT" -q
}

# Já tem Postgres na porta (este cluster ou outra cópia do projeto) — segue o predev.
if port_ready; then
  echo "Postgres já está aceitando conexões em 127.0.0.1:$PORT"
  exit 0
fi

if [ ! -f "$PGDIR/PG_VERSION" ]; then
  "$PGBIN/initdb" -D "$PGDIR" --auth-local=trust --auth-host=trust -U cardapio --locale=C --encoding=UTF8
fi

if "$PGBIN/pg_ctl" -D "$PGDIR" status >/dev/null 2>&1; then
  echo "Postgres já está rodando em .pgdata (porta $PORT)"
  exit 0
fi

# Quote -k path: dirs with spaces (e.g. "Área de trabalho") break unquoted -o args.
"$PGBIN/pg_ctl" -D "$PGDIR" -l "$PGDIR/logfile" start -o "-p $PORT -k '$PGDIR'"
sleep 1

if ! port_ready; then
  echo "Falha ao iniciar Postgres. Últimas linhas do log:"
  tail -n 30 "$PGDIR/logfile" 2>/dev/null || true
  exit 1
fi

"$PGBIN/createdb" -h 127.0.0.1 -p "$PORT" -U cardapio cardapio 2>/dev/null || true
echo "Postgres iniciado em 127.0.0.1:$PORT"
