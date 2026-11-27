import test from 'node:test';
import assert from 'node:assert/strict';
import { MUNDOS } from '../js/contenido.js';
import { fondoSvg } from '../js/fondos.js';
import { PICTOGRAMAS } from '../js/pictogramas.js';
import { PICTOGRAMAS_ARASAAC } from '../js/arasaac.js';

// Un mundo completo es un paquete visual y sonoro intercambiable (spec 0001).
const CAMPOS = ['fondo', 'acento', 'paleta', 'objetivo', 'imagen', 'refuerzo', 'fondoArte', 'sonidos'];

test('los cuatro mundos declaran todo el paquete visual y sonoro', () => {
  assert.equal(MUNDOS.length, 4);
  for (const m of MUNDOS) {
    for (const campo of CAMPOS) {
      assert.ok(m[campo], `${m.id} debe declarar ${campo}`);
    }
    assert.ok(Array.isArray(m.paleta) && m.paleta.length >= 4, `${m.id} necesita una paleta propia`);
    assert.ok(m.paleta.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `${m.id}: colores hex`);
    for (const sonido of ['acierto', 'entrada', 'error']) {
      assert.ok(Number.isFinite(m.sonidos[sonido]) && m.sonidos[sonido] > 0, `${m.id}: sonido ${sonido}`);
    }
    assert.ok(
      Array.isArray(m.sonidos.fanfarria) && m.sonidos.fanfarria.length >= 3,
      `${m.id} necesita su propia fanfarria`,
    );
  }
});

test('cada mundo tiene al menos ocho pictogramas distintos para las parejas', () => {
  for (const m of MUNDOS) {
    assert.ok(Array.isArray(m.parejas), `${m.id}: declara sus pictogramas de parejas`);
    assert.ok(m.parejas.length >= 8, `${m.id}: hay bastantes para el tablero de 8`);
    assert.equal(new Set(m.parejas).size, m.parejas.length, `${m.id}: sin dibujos repetidos`);
    for (const nombre of m.parejas) {
      assert.ok(PICTOGRAMAS_ARASAAC[nombre], `${m.id}: falta el pictograma ${nombre}`);
    }
  }
});

test('cada mundo usa un refuerzo dibujado, no una forma genérica', () => {
  for (const m of MUNDOS) {
    assert.ok(PICTOGRAMAS_ARASAAC[m.refuerzo] || PICTOGRAMAS[m.refuerzo], `${m.id}: falta el refuerzo`);
  }
});

test('refuerzos y tonos de acierto son distintos en cada mundo', () => {
  assert.equal(new Set(MUNDOS.map((m) => m.refuerzo)).size, MUNDOS.length);
  assert.equal(new Set(MUNDOS.map((m) => m.sonidos.acierto)).size, MUNDOS.length);
  assert.equal(new Set(MUNDOS.map((m) => m.fondoArte)).size, MUNDOS.length);
});

test('cada mundo tiene un fondo SVG propio y sin texto', () => {
  const fondos = MUNDOS.map((m) => fondoSvg(m));
  assert.equal(new Set(fondos).size, MUNDOS.length, 'ningún fondo se repite');
  for (const [i, svg] of fondos.entries()) {
    assert.match(svg, /^<svg /, `${MUNDOS[i].id}: es SVG`);
    assert.match(svg, /viewBox="0 0 \d+ \d+"/);
    assert.doesNotMatch(svg, /<text/i, 'el juego no usa texto');
    assert.doesNotMatch(svg, /<image|href=|url\(\s*https?:/i, 'sin recursos externos');
  }
});

test('los mundos no usan IP real ni assets de terceros', () => {
  const prohibido = /pok[eé]mon|pikachu|disney|mickey|mario|sonic|hello kitty|star wars/i;
  assert.doesNotMatch(JSON.stringify(MUNDOS), prohibido);
  // El monstruo amarillo se describe por su aspecto, no por una marca.
  assert.match(MUNDOS.find((m) => m.id === 'amarillo').nombre, /monstruo amarillo/i);
});
