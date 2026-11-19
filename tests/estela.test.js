import test from 'node:test';
import assert from 'node:assert/strict';
import { crearEstela } from '../js/estela.js';

test('una ruta corta genera tramos con vida decreciente', () => {
  const e = crearEstela({ vidaMs: 300, huecos: 10 });
  e.añadir(0, 0, 0);
  e.añadir(10, 0, 50);
  e.añadir(20, 0, 100);
  const tramos = e.tramos(100);
  assert.equal(tramos.length, 2);
  const [viejo, nuevo] = tramos;
  assert.ok(viejo.vida < nuevo.vida);
});

test('los puntos más viejos que la vida desaparecen', () => {
  const e = crearEstela({ vidaMs: 300, huecos: 10 });
  e.añadir(0, 0, 0);
  e.añadir(10, 0, 50);
  e.añadir(20, 0, 100);
  e.añadir(30, 0, 400);
  const tramos = e.tramos(401);
  assert.equal(tramos.length, 0);
});

test('no se acumulan más puntos que huecos', () => {
  const e = crearEstela({ vidaMs: 300, huecos: 5 });
  for (let i = 0; i < 50; i++) e.añadir(i * 10, 0, i * 5);
  assert.ok(e.puntos().length <= 5);
});

test('moverse menos de un píxel no añade puntos', () => {
  const e = crearEstela({ vidaMs: 300, huecos: 10 });
  e.añadir(5, 5, 0);
  e.añadir(5.4, 5, 16);
  assert.equal(e.puntos().length, 1);
});
