#!/usr/bin/env bash
# Comprueba que GitHub Pages sirve el sitio y que el último build es el commit
# esperado (por defecto, HEAD).
#
# Uso: scripts/verificar-pages.sh [url] [commit-esperado]
set -euo pipefail

url="${1:-https://minilama2222.github.io/juegos-accesibles/}"
repo="${REPO:-minilama2222/juegos-accesibles}"
esperado="${2:-$(git rev-parse HEAD 2>/dev/null || true)}"

echo "Comprobando $url ..."
codigo="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
if [ "$codigo" != "200" ]; then
  echo "HTTP $codigo" >&2
  exit 1
fi
echo "HTTP 200"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh no está instalado: no puedo comprobar el build de Pages." >&2
  exit 0
fi

for intento in $(seq 1 30); do
  salida="$(gh api "repos/$repo/pages/builds/latest" --jq '.status + " " + .commit' 2>/dev/null || true)"
  echo "$intento: $salida"
  case "$salida" in
    "built $esperado"*)
      echo "OK: Pages compiló $esperado"
      exit 0
      ;;
    errored*)
      echo "El build de Pages falló." >&2
      exit 1
      ;;
  esac
  sleep 10
done

echo "Pages no llegó a compilar $esperado a tiempo." >&2
exit 1
