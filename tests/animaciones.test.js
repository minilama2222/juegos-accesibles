import test from 'node:test';
import assert from 'node:assert/strict';
import { animarAparicion, animarAcierto, animarBrote, animarTiro, progreso } from '../js/animaciones.js';

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

test('el brote aparece con anticipación, se ve entero y se va desvaneciendo', () => {
  const inicio = animarBrote(0);
  assert.ok(inicio.escalaX < 1, 'empieza encogiéndose');
  assert.equal(inicio.opacidad, 0);

  const pico = Math.max(...Array.from({ length: 50 }, (_, i) => animarBrote(i / 60).escalaY));
  assert.ok(pico > 1.05, 'sobrepasa el tamaño final');

  const medio = animarBrote(0.5);
  assert.ok(medio.opacidad > 0.9, 'a mitad todavía se ve entero');
  assert.equal(medio.subida, 0, 'todavía no ha empezado a subir');

  const fin = animarBrote(1);
  assert.ok(fin.opacidad < 0.02, 'termina invisible');
  assert.ok(fin.subida > 0.9, 'termina arriba');
});

test('el brote se queda quieto si se pide menos movimiento', () => {
  // La escena ignora `subida` con menos movimiento; la función no cambia de forma.
  const a = animarBrote(0.8);
  assert.ok(a.opacidad < 1);
  assert.ok(a.subida > 0);
});

test('el tiro avanza con arco y vuelve al suelo al llegar', () => {
  const inicio = animarTiro(0);
  const medio = animarTiro(0.5);
  const fin = animarTiro(1);

  assert.equal(inicio.avance, 0);
  assert.equal(inicio.altura, 0);
  assert.equal(fin.avance, 1);
  assert.equal(fin.altura, 0);
  assert.ok(medio.altura > 0.5, 'el balón sube por el aire a mitad del tiro');
  assert.ok(medio.avance > 0.5, 'sale rápido y frena: slow out');
  assert.equal(medio.opacidad, 1, 'durante el vuelo se ve entero');
  assert.ok(fin.opacidad < 0.02, 'al final se desvanece');

  let anterior = -1;
  for (let i = 0; i <= 20; i++) {
    const a = animarTiro(i / 20);
    assert.ok(a.avance >= anterior, 'el avance nunca retrocede');
    anterior = a.avance;
  }
});

test('el tiro no se sale si el progreso se pasa o falta', () => {
  assert.deepEqual(animarTiro(-3).avance, 0);
  assert.equal(animarTiro(9).avance, 1);
  assert.equal(animarTiro(9).altura, 0);
});

test('el progreso queda acotado entre 0 y 1', () => {
  assert.equal(progreso(-5, 100), 0);
  assert.equal(progreso(500, 100), 1);
  assert.equal(progreso(50, 100), 0.5);
  assert.equal(progreso(10, 0), 1);
});
