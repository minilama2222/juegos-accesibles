#!/usr/bin/env bash
# check.sh — comprobaciones mecánicas del repo
# Uso: bash scripts/check.sh
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

fallos=0
fallo() {
  printf 'FALLO: %s\n' "$1"
  fallos=$((fallos + 1))
}

# 1. Sintaxis de todos los JS
while IFS= read -r -d '' fichero; do
  if ! node --check "$fichero" >/dev/null 2>&1; then
    fallo "sintaxis JS en $fichero"
  fi
done < <(find js -type f -name '*.js' -print0)

# 2. Los juegos no escriben transiciones/animaciones inline (ADR 0003)
if coincidencias=$(grep -RInE 'style\.(transition|animation)' js/juegos 2>/dev/null); then
  printf '%s\n' "$coincidencias"
  fallo "hay transiciones o animaciones inline en js/juegos"
fi

# 3. Transiciones y keyframes de juego solo en movimiento.css (ADR 0003)
if coincidencias=$(grep -RInE '@keyframes|transition[[:space:]]*:' css --exclude='movimiento.css' 2>/dev/null); then
  printf '%s\n' "$coincidencias"
  fallo "hay transiciones o keyframes fuera de css/movimiento.css"
fi

# 4. El confeti es pieza única de comun.js (ADR 0003)
if coincidencias=$(grep -RIn 'confeti' js --exclude='comun.js' 2>/dev/null); then
  printf '%s\n' "$coincidencias"
  fallo "hay confeti fuera de js/comun.js"
fi

# 5. Las rutas del catálogo de arte existen
if ! node - <<'NODE'
const fs = require('fs');
const vm = require('vm');

const codigo = fs.readFileSync('js/arte.js', 'utf8');
const contexto = {};
vm.createContext(contexto);
vm.runInContext(codigo + '\n;globalThis.__ARTE = ARTE;', contexto);

const arte = contexto.__ARTE;
let mal = 0;
for (const set of arte.lista()) {
  for (const pieza of set.piezas) {
    if (!fs.existsSync(pieza.ruta)) {
      console.error(`FALLO: arte ${set.id}: no existe ${pieza.ruta}`);
      mal++;
    }
  }
  if (set.miniatura && !fs.existsSync(set.miniatura)) {
    console.error(`FALLO: arte ${set.id}: no existe la miniatura ${set.miniatura}`);
    mal++;
  }
}
process.exit(mal ? 1 : 0);
NODE
then
  fallo "el catálogo de arte apunta a rutas inexistentes"
fi

if [ "$fallos" -eq 0 ]; then
  echo "check.sh: todo correcto"
  exit 0
fi

printf 'check.sh: %d fallo(s)\n' "$fallos"
exit 1
