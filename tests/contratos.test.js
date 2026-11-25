import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MECANICAS, ORDEN } from '../js/contenido.js';

const fuenteEscena = readFileSync(new URL('../js/escena.js', import.meta.url), 'utf8');

test('ORDEN no repite mecánicas y respeta la progresión de la spec', () => {
  assert.equal(new Set(ORDEN).size, ORDEN.length);
  assert.deepEqual(ORDEN, [
    'causaEfecto',
    'hover',
    'clickEstatico',
    'aparicion',
    'movimientoLento',
    'tiroAPorteria',
    'parejas',
    'arrastre',
  ]);
});

test('cada mecánica del menú está implementada y declara icono', () => {
  for (const id of ORDEN) {
    const mecanica = MECANICAS[id];
    assert.ok(mecanica, `${id} está en ORDEN pero no en MECANICAS`);
    assert.equal(mecanica.id, id);
    assert.equal(mecanica.implementada, true, `${id} debe estar implementada`);
    assert.equal(typeof mecanica.icono, 'string', `${id} debe declarar icono`);
    assert.ok(mecanica.icono.length > 0, `${id} no puede tener icono vacío`);
  }
});

test('no hay mecánicas declaradas fuera de ORDEN', () => {
  for (const id of Object.keys(MECANICAS)) {
    assert.ok(ORDEN.includes(id), `${id} está en MECANICAS pero falta en ORDEN`);
  }
});

test('cada mecánica tiene arranque en el registro de escenas', () => {
  // Hover es la escena base: no necesita entrada en ARRANQUES.
  for (const id of ORDEN.filter((x) => x !== 'hover')) {
    assert.match(fuenteEscena, new RegExp(`\\b${id}\\s*:`), `${id} falta en ARRANQUES`);
  }
  assert.doesNotMatch(fuenteEscena, /\bhover\s*:/, 'hover debe seguir siendo la escena base');
});

test('el despacho de escenas es un mapa, no una cascada de ifs', () => {
  assert.doesNotMatch(
    fuenteEscena,
    /opciones\.mecanica\?\.id\s*===/,
    'el despacho por id debe vivir en ARRANQUES',
  );
});
