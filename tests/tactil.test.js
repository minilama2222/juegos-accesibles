import test from 'node:test';
import assert from 'node:assert/strict';
import { AVISO_TACTIL, CONSULTA_PUNTERO_GRUESO, hayPunteroGrueso } from '../js/tactil.js';

test('el aviso táctil se enciende solo con puntero grueso', () => {
  assert.equal(CONSULTA_PUNTERO_GRUESO, '(pointer: coarse)');
  assert.equal(hayPunteroGrueso({ matches: true }), true);
  assert.equal(hayPunteroGrueso({ matches: false }), false);
  assert.equal(hayPunteroGrueso(null), false, 'sin matchMedia no se rompe');
});

test('el aviso al padre no añade texto visible', () => {
  assert.ok(AVISO_TACTIL.length > 0);
  assert.ok(!/[<>]/.test(AVISO_TACTIL), 'es texto para aria-label, no HTML');
});
