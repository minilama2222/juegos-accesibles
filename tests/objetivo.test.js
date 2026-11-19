import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularRadio } from '../js/objetivo.js';

test('el radio varía entre el mínimo y el máximo pedidos', () => {
  const chico = calcularRadio({ vmin: 9, minimo: 12, maximo: 22, azar: () => 0 });
  const grande = calcularRadio({ vmin: 9, minimo: 12, maximo: 22, azar: () => 1 });
  assert.equal(chico, 108);
  assert.equal(grande, 198);
});

test('con azar intermedio cae en el punto medio del rango', () => {
  const medio = calcularRadio({ vmin: 9, minimo: 12, maximo: 22, azar: () => 0.5 });
  assert.equal(medio, 153);
});

test('nunca baja del mínimo de 44 px de diámetro', () => {
  const radio = calcularRadio({ vmin: 2, minimo: 5, maximo: 8, azar: () => 0 });
  assert.equal(radio, 22);
});

test('dos tiradas seguidas dan tamaños distintos', () => {
  const a = calcularRadio({ vmin: 9, minimo: 12, maximo: 22, azar: () => 0.1 });
  const b = calcularRadio({ vmin: 9, minimo: 12, maximo: 22, azar: () => 0.9 });
  assert.notEqual(a, b);
});
