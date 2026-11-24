import test from 'node:test';
import assert from 'node:assert/strict';
import { crearGuardaUnica } from '../js/partida.js';

test('una misma partida solo se cierra una vez', () => {
  const guarda = crearGuardaUnica();
  assert.equal(guarda.reclamar(7), true);
  assert.equal(guarda.reclamar(7), false, 'el segundo aviso de fin no vuelve a entregar premio');
  assert.equal(guarda.reclamar(7), false);
});

test('una partida nueva vuelve a cerrarse', () => {
  const guarda = crearGuardaUnica();
  assert.equal(guarda.reclamar(1), true);
  assert.equal(guarda.reclamar(2), true);
  assert.equal(guarda.reclamar(2), false);
});
