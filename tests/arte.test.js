import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MUNDOS, MECANICAS } from '../js/contenido.js';
import { PEGATINAS } from '../js/pegatinas.js';
import { PICTOGRAMAS } from '../js/pictogramas.js';
import { PICTOGRAMAS_ARASAAC, imagenArasaac } from '../js/arasaac.js';

// Arte (docs/adr/0003-arte-arasaac-primero.md): todo lo que se nombra es un
// pictograma ARASAAC guardado en `assets/arasaac/`; el dibujo propio queda para
// iconos y gestos, y su lista está cerrada aquí.
const raiz = new URL('..', import.meta.url);
const existe = (ruta) => existsSync(fileURLToPath(new URL(ruta, raiz)));

// Lo que **sigue** siendo dibujo propio. Un dibujo nuevo que no esté en esta
// lista o que se use fuera de su sitio hace fallar el test: así no se cuelan
// otra vez objetos dibujados a mano.
const PROPIOS = [
  // Iconos de mecánica.
  'destello',
  'aguantar',
  'aparicion',
  'movimiento',
  'porteria',
  'arrastre',
  'parejas4',
  'parejas6',
  'parejas8',
  // Controles del menú.
  'lugar',
  'sonido',
  'silencio',
  'musica',
  'musicaApagada',
  'pantalla',
  'pantallaSalir',
  'coleccion',
  'tactil',
  'volver',
  // Punteros.
  'punteroEstrella',
  'punteroHuella',
  'punteroBalon',
  'punteroRayo',
  // Gestos y reservas.
  'chispa',
  'huella',
  'copo',
  'estrella',
  'bicho',
];

test('el dibujo propio es solo iconos y gestos, y nada más', () => {
  assert.deepEqual(Object.keys(PICTOGRAMAS).sort(), [...PROPIOS].sort());
  for (const [nombre, svg] of Object.entries(PICTOGRAMAS)) {
    assert.match(svg, /^<svg /, `${nombre}: es un SVG`);
    assert.doesNotMatch(svg, /<text/i, `${nombre}: el juego no usa texto`);
    assert.doesNotMatch(svg, /<image|href=|url\(/i, `${nombre}: sin recursos externos`);
  }
});

test('cada concepto de ARASAAC tiene su PNG de 500 px en el repo', () => {
  const ids = new Set(Object.values(PICTOGRAMAS_ARASAAC));
  assert.ok(ids.size >= 20, 'hay un catálogo, no cuatro sueltos');
  for (const [concepto, id] of Object.entries(PICTOGRAMAS_ARASAAC)) {
    assert.ok(Number.isInteger(id) && id > 0, `${concepto}: el id es un entero`);
    const ruta = `assets/arasaac/${id}.png`;
    assert.ok(existe(ruta), `${concepto}: falta ${ruta}`);
    const cabecera = readFileSync(fileURLToPath(new URL(ruta, raiz))).subarray(0, 24);
    assert.equal(cabecera.subarray(1, 4).toString('ascii'), 'PNG', `${concepto}: es PNG`);
    assert.equal(cabecera.readUInt32BE(16), 500, `${concepto}: 500 px de ancho`);
    assert.equal(cabecera.readUInt32BE(20), 500, `${concepto}: 500 px de alto`);
  }
});

test('no quedan PNG sueltos sin catálogo', () => {
  const usados = new Set(Object.values(PICTOGRAMAS_ARASAAC).map((id) => `${id}.png`));
  for (const fichero of readdirSync(fileURLToPath(new URL('assets/arasaac', raiz)))) {
    if (!fichero.endsWith('.png')) continue;
    assert.ok(usados.has(fichero), `assets/arasaac/${fichero} no lo usa ningún concepto`);
  }
});

test('imagenArasaac devuelve la ruta por id, nunca un nombre', () => {
  assert.equal(imagenArasaac('gato'), `assets/arasaac/${PICTOGRAMAS_ARASAAC.gato}.png`);
  assert.equal(imagenArasaac('no-existe'), null);
});

test('los objetivos de los cuatro mundos son pictogramas ARASAAC', () => {
  const esperados = { navidad: 'regalo', animalitos: 'gato', futbol: 'balon', amarillo: 'carita' };
  assert.deepEqual(Object.fromEntries(MUNDOS.map((m) => [m.id, m.objetivo])), esperados);
  for (const m of MUNDOS) {
    assert.equal(m.imagen, imagenArasaac(m.objetivo), `${m.id}: la imagen es la del objetivo`);
  }
});

test('cada carta de parejas, refuerzo y sprite es un pictograma ARASAAC', () => {
  for (const m of MUNDOS) {
    for (const campo of ['parejas', 'sprites']) {
      for (const concepto of m[campo]) {
        assert.ok(PICTOGRAMAS_ARASAAC[concepto], `${m.id}.${campo}: «${concepto}» no tiene pictograma`);
      }
    }
    assert.ok(PICTOGRAMAS_ARASAAC[m.refuerzo], `${m.id}: el refuerzo es un pictograma`);
  }
});

test('lo que se transformó deja de usar el dibujo propio', () => {
  const propiosEnMundos = MUNDOS.flatMap((m) => [m.objetivo, ...m.parejas, m.refuerzo]).filter(
    (n) => PICTOGRAMAS[n],
  );
  assert.deepEqual(propiosEnMundos, [], 'objetivos, cartas y refuerzos ya no se dibujan a mano');
  assert.ok(!PICTOGRAMAS[MECANICAS.clickEstatico.icono], 'el icono de click estático no es el balón de ARASAAC');
  for (const p of PEGATINAS) {
    assert.ok(PICTOGRAMAS_ARASAAC[p.pictograma], `pegatina ${p.id}: pictograma de ARASAAC`);
    assert.equal(p.icono, undefined, `pegatina ${p.id}: ya no lleva dibujo propio`);
  }
});

test('el mismo concepto usa el mismo pictograma en carta, objetivo y pegatina', () => {
  const futbol = MUNDOS.find((m) => m.id === 'futbol');
  const balon = PEGATINAS.find((p) => p.id === 'balon');
  assert.equal(imagenArasaac(balon.pictograma), futbol.imagen);
  const regalo = PEGATINAS.find((p) => p.id === 'regalo');
  assert.equal(imagenArasaac(regalo.pictograma), MUNDOS.find((m) => m.id === 'navidad').imagen);
});
