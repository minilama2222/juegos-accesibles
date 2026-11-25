#!/usr/bin/env bash
# Crea un worktree listo para trabajar en paralelo:
#   - rama nueva desde opencode/juegos (o $BASE)
#   - node_modules enlazado al worktree principal (gitignored)
#
# Uso: scripts/worktree.sh <nombre> [rama-base]
set -euo pipefail

nombre="${1:-}"
base="${2:-${BASE:-opencode/juegos}}"
if [ -z "$nombre" ]; then
  echo "Uso: $0 <nombre> [rama-base]" >&2
  exit 1
fi

raiz="$(git rev-parse --show-toplevel)"
repo="$(basename "$raiz")"
destino="${WORKTREE_DIR:-$(dirname "$raiz")/${repo}-${nombre}}"

if git -C "$raiz" show-ref --verify --quiet "refs/heads/$nombre"; then
  echo "La rama '$nombre' ya existe. Elige otro nombre o bórrala." >&2
  exit 1
fi
if [ -e "$destino" ]; then
  echo "Ya existe el directorio '$destino'." >&2
  exit 1
fi

git -C "$raiz" worktree add -b "$nombre" "$destino" "$base" >&2

# Los worktrees no heredan node_modules; Playwright y el runner lo necesitan.
if [ -d "$raiz/node_modules" ] && [ ! -e "$destino/node_modules" ]; then
  ln -s "$raiz/node_modules" "$destino/node_modules"
fi

echo "$destino"
