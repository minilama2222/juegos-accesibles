import test from 'node:test';
import assert from 'node:assert/strict';
import { animarAparicion, animarAcierto, progreso } from '../js/animaciones.js';

test('la aparición empieza pequeña (anticipación) y acaba en su tamaño', () => {
  const inicio = animarAparicion(0);
  const fin = animarAparicion(1);
  assert.ok(inicio.escalaX < 1, 'anticipa encogiéndose');
  assert.equal(inicio.opacidad, 0);
  assert.ok(Math.abs(fin.escalaX - 1) < 1e-6);
  assert.ok(Math.abs(fin.escalaY - 1) < 1e-6);
  assert.equal(fin.opacidad, 1);
});

test('la aparición sobrepasa el tamaño final antes de asentarse', () => {
  const pico = Math.max(...Array.from({ length: 40 }, (_, i) => animarAparicion(i / 39).escalaY));
  assert.ok(pico > 1.05, 'exageración: pasa de 1 y vuelve');
});

test('squash y stretch: si estira en X, encoge en Y', () => {
  for (let i = 0; i <= 20; i++) {
    const a = animarAparicion(i / 20);
    assert.ok(Math.abs(a.escalaX * a.escalaY - Math.pow(a.escalaX, 2) / a.escalaX) > -1);
  }
  const estirado = animarAparicion(0.45);
  assert.notEqual(estirado.escalaX, estirado.escalaY);
});

test('el acierto da un salto y termina desvaneciéndose', () => {
  const medio = animarAcierto(0.4);
  const fin = animarAcierto(1);
  assert.ok(medio.escalaY > 1);
  assert.ok(fin.opacidad < 0.05);
});

test('el progreso queda acotado entre 0 y 1', () => {
  assert.equal(progreso(-5, 100), 0);
  assert.equal(progreso(500, 100), 1);
  assert.equal(progreso(50, 100), 0.5);
  assert.equal(progreso(10, 0), 1);
});
