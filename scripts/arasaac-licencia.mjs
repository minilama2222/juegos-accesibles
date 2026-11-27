#!/usr/bin/env node
// Revisa el catálogo de pictogramas (js/arasaac.js) contra ARASAAC y contra el
// repo:
//
//   node scripts/arasaac-licencia.mjs              # comprueba lo que hay
//   node scripts/arasaac-licencia.mjs --scrape     # reescribe la tabla de ATTRIBUTION.md
//
// Comprueba, para cada id: que ARASAAC lo conoce, que el PNG está en
// `assets/arasaac/` y que mide 500×500, y escribe la tabla de atribución
// (la licencia CC BY-NC-SA 4.0 es única para todo el catálogo). La tabla de
// `ATTRIBUTION.md` se genera desde el catálogo para que no se quede vieja.
//
// Ojo con la API: `/api/pictograms/<id>` devuelve el PNG y
// `/api/pictograms/es/<id>` la ficha JSON.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = new URL('..', import.meta.url);
const ruta = (p) => fileURLToPath(new URL(p, raiz));
const API = 'https://api.arasaac.org/api/pictograms';

const { PICTOGRAMAS_ARASAAC } = await import(ruta('js/arasaac.js'));
const entradas = Object.entries(PICTOGRAMAS_ARASAAC);
const ids = [...new Set(entradas.map(([, id]) => id))];

const fallos = [];
const fichas = new Map(); // id -> ficha de ARASAAC

for (const id of ids) {
  const png = ruta(`assets/arasaac/${id}.png`);
  if (!existsSync(png)) {
    fallos.push(`${id}: falta assets/arasaac/${id}.png`);
  } else {
    const cabecera = readFileSync(png).subarray(0, 24);
    const esPng = cabecera.subarray(1, 4).toString('ascii') === 'PNG';
    const ancho = cabecera.readUInt32BE(16);
    const alto = cabecera.readUInt32BE(20);
    if (!esPng) fallos.push(`${id}: no es un PNG`);
    else if (ancho !== 500 || alto !== 500) fallos.push(`${id}: mide ${ancho}×${alto}, se espera 500×500`);
  }

  const r = await fetch(`${API}/es/${id}`);
  if (!r.ok) {
    fallos.push(`${id}: ARASAAC no conoce el pictograma (${r.status})`);
    continue;
  }
  const ficha = await r.json();
  fichas.set(id, ficha);
  if (!ficha.keywords?.length) fallos.push(`${id}: ARASAAC no da palabra clave`);
}

if (fallos.length === 0 && process.argv.includes('--scrape')) {
  const filas = ids
    .map((id) => {
      const conceptos = entradas.filter(([, v]) => v === id).map(([k]) => k);
      const palabra = fichas.get(id)?.keywords?.[0]?.keyword ?? '';
      return `| ${conceptos.join(', ')} | ${id} | ${palabra} |`;
    })
    .join('\n');
  const inicio = '<!-- arasaac:inicio -->';
  const fin = '<!-- arasaac:fin -->';
  const tabla = `${inicio}
| Conceptos | ID ARASAAC | Palabra clave | Trazo (esquema) |
|---|---|---|---|
${ids.map((id) => `| ${entradas.filter(([, v]) => v === id).map(([k]) => k).join(', ')} | ${id} | ${fichas.get(id)?.keywords?.[0]?.keyword ?? ''} | ${fichas.get(id)?.schematic ? 'sí' : 'no'} |`).join('\n')}
${fin}`;
  const previo = readFileSync(ruta('ATTRIBUTION.md'), 'utf8');
  const nuevo = previo.includes(inicio)
    ? previo.replace(new RegExp(`${inicio}[\\s\\S]*${fin}`), tabla)
    : `${previo.trimEnd()}\n\n${tabla}\n`;
  writeFileSync(ruta('ATTRIBUTION.md'), nuevo);
  console.log(`ATTRIBUTION.md: ${ids.length} pictogramas (${filas.split('\n').length} filas)`);
}

if (fallos.length > 0) {
  console.error('Pictogramas con problemas:');
  for (const f of fallos) console.error(` - ${f}`);
  process.exit(1);
}
console.log(`OK: ${ids.length} pictogramas de ARASAAC, todos en el repo`);
