import test from 'node:test';
import assert from 'node:assert/strict';
import {
  prefiereMenosMovimiento,
  alCambiarPreferencia,
  cantidadConfeti,
  CONFETI_REDUCIDO,
  CONFETI_NORMAL,
} from '../js/movimiento-reducido.js';

const falso = (matches) => (consulta) => ({
  matches,
  media: consulta,
  addEventListener() {},
  removeEventListener() {},
});

test('detecta la preferencia del sistema', () => {
  assert.equal(prefiereMenosMovimiento(falso(true)), true);
  assert.equal(prefiereMenosMovimiento(falso(false)), false);
});

test('sin matchMedia no rompe y asume movimiento normal', () => {
  assert.equal(prefiereMenosMovimiento(undefined), false);
  assert.equal(prefiereMenosMovimiento(null), false);
});

test('si matchMedia lanza, asume movimiento normal', () => {
  assert.equal(
    prefiereMenosMovimiento(() => {
      throw new Error('sin soporte');
    }),
    false,
  );
});

test('avisa cuando el sistema cambia la preferencia y se puede desuscribir', () => {
  const oyentes = new Map();
  const mql = {
    matches: false,
    addEventListener(tipo, fn) {
      oyentes.set(tipo, fn);
    },
    removeEventListener(tipo) {
      oyentes.delete(tipo);
    },
  };
  const recibido = [];
  const desuscribir = alCambiarPreferencia((valor) => recibido.push(valor), () => mql);

  oyentes.get('change')({ matches: true });
  oyentes.get('change')({ matches: false });
  assert.deepEqual(recibido, [true, false]);

  desuscribir();
  assert.equal(oyentes.size, 0);
});

test('el confeti se reduce cuando hay menos movimiento', () => {
  assert.equal(cantidadConfeti(true), CONFETI_REDUCIDO);
  assert.equal(cantidadConfeti(false), CONFETI_NORMAL);
  assert.ok(CONFETI_REDUCIDO < CONFETI_NORMAL);
});
