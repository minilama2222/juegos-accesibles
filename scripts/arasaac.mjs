#!/usr/bin/env node
// Herramienta local de arte: busca pictogramas en ARASAAC y monta una hoja de
// contacto al tamaño real del juego. No forma parte de la web ni del test:
// se lanza a mano para elegir pictogramas mirando.
//
//   node scripts/arasaac.mjs buscar gato perro
//   node scripts/arasaac.mjs hoja "gato=7114" "perro=8123" --px 288
//   node scripts/arasaac.mjs bajar 7114 8123 --destino assets/arasaac
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://api.arasaac.org/api';
const STATIC = 'https://static.arasaac.org/pictograms';

const args = process.argv.slice(2);
const orden = args.shift();
const opciones = {};
const resto = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) opciones[args[i].slice(2)] = args[++i];
  else resto.push(args[i]);
}

async function json(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

async function buscar(terminos) {
  const salida = [];
  for (const t of terminos) {
    const hits = await json(`${API}/pictograms/es/search/${encodeURIComponent(t)}`);
    salida.push({
      termino: t,
      ids: hits.slice(0, 8).map((p) => p._id),
      // `schematic: true` = tiene versión de trazo negro.
      esquema: hits.slice(0, 8).map((p) => p.schematic),
      total: hits.length,
    });
  }
  return salida;
}

function urlPictograma(id, tam = 500) {
  return `${STATIC}/${id}/${id}_${tam}.png`;
}

async function descargar(id, destino) {
  // `id` o `id:esquema`. La variante de esquema (trazo negro sin relleno) da
  // más contraste a tamaños pequeños. No está en `static.arasaac.org` con una
  // ruta fija conocida: se pide a la API, que documenta `?download=false`
  // para no contar la descarga. Si no existe, se cae al color y se avisa.
  const [base, estilo] = String(id).split(':');
  const urls = [
    ...(estilo === 'esquema' ? [`${API}/pictograms/${base}?download=false&color=false`] : []),
    urlPictograma(base),
  ];
  let r;
  let url = '';
  for (url of urls) {
    r = await fetch(url);
    if (r.ok) break;
  }
  if (!r.ok) throw new Error(`${id}: ${r.status} ${url}`);
  if (estilo === 'esquema' && !url.includes('download')) {
    console.warn(`aviso: ${base} no tiene esquema; se usa color`);
  }
  const buf = Buffer.from(await r.arrayBuffer());
  if (destino) {
    await mkdir(destino, { recursive: true });
    const ruta = join(destino, `${base}.png`);
    await writeFile(ruta, buf);
    return ruta;
  }
  return buf.toString('base64');
}

// Hoja de contacto: cada pictograma dibujado al tamaño en px que tendrá en el
// juego, sobre el mismo fondo (plato del mundo) para juzgarlo como se verá.
async function hoja(entradas, px) {
  const celdas = [];
  for (const par of entradas) {
    const [nombre, id] = par.includes('=') ? par.split('=') : [par, par];
    const datos = await descargar(id);
    celdas.push(
      `<figure><div class="plato" style="width:${px}px;height:${px}px"><img src="data:image/png;base64,${datos}"></div><figcaption>${nombre}</figcaption></figure>`,
    );
  }
  return `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#2e6b3d;font:14px system-ui;color:#fff;display:flex;flex-wrap:wrap;gap:28px;padding:28px}
  figure{margin:0;text-align:center}
  .plato{display:grid;place-items:center;border-radius:50%;background:#f9a825;border:3px solid #fff}
  .plato img{width:78%;height:78%;object-fit:contain}
  figcaption{margin-top:6px;opacity:.8}
  </style>${celdas.join('')}`;
}

switch (orden) {
  case 'buscar':
    console.log(JSON.stringify(await buscar(resto), null, 1));
    break;
  case 'hoja': {
    const html = await hoja(resto, Number(opciones.px ?? 288));
    const ruta = opciones.salida ?? '/tmp/opencode/hoja-arasaac.html';
    await writeFile(ruta, html);
    console.log(ruta);
    break;
  }
  case 'bajar':
    for (const id of resto) console.log(await descargar(id, opciones.destino));
    break;
  case 'perfil': {
    // Versión de esquema del pictograma, pero con relleno plano del color del
    // mundo: un solo color negro para trazo y relleno, que es lo que aguanta a
    // 40–100 px. Sin antialias del original: se rellena por regiones.
    const [id, color = '#ffffff', salida = '/tmp/opencode/perfil.png'] = resto;
    // `color=true` devuelve el pictograma de color sin oscurecer los bordes
    // (anticolor): es la máscara de lo que es figura y lo que es fondo.
    const mascara = await fetch(`${API}/pictograms/${id}?download=false&color=true`);
    if (!mascara.ok) throw new Error(`${id}: máscara ${mascara.status}`);
    const { decodificar, codificar } = await import('./png.mjs');
    const { writeFile } = await import('node:fs/promises');
    const base = decodificar(Buffer.from(await mascara.arrayBuffer()));
    const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
    const { ancho, alto, datos } = base;
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        const o = (y * ancho + x) * 4;
        const dentro = datos[o + 3] > 127;
        const oscuro = datos[o] + datos[o + 1] + datos[o + 2] < 200;
        const borde = [];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 2], [-2, -2], [2, -2], [-2, 2]]) {
          const nx = x + dx;
          const ny = y + dy;
          const fuera = nx < 0 || ny < 0 || nx >= ancho || ny >= alto;
          borde.push(fuera || datos[(ny * ancho + nx) * 4 + 3] <= 127);
        }
        if (!dentro) {
          datos[o + 3] = 0;
          continue;
        }
        // Trazo negro del propio pictograma, o figura pegada al fondo.
        const enTrazo = oscuro || borde.some(Boolean);
        datos[o] = enTrazo ? 17 : rgb[0];
        datos[o + 1] = enTrazo ? 17 : rgb[1];
        datos[o + 2] = enTrazo ? 17 : rgb[2];
        datos[o + 3] = 255;
      }
    }
    await writeFile(salida, codificar(base));
    console.log(salida);
    break;
  }
  default:
    console.log('uso: buscar | hoja | bajar');
    process.exit(existsSync('.') ? 1 : 1);
}
