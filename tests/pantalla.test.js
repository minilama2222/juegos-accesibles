import test from 'node:test';
import assert from 'node:assert/strict';
import { estaEnPantallaCompleta, alternarPantallaCompleta } from '../js/pantalla.js';

function documentoFalso({ soporte = true } = {}) {
  let pantalla = null;
  return {
    get fullscreenElement() {
      return pantalla;
    },
    documentElement: {
      async requestFullscreen() {
        if (!soporte) throw new Error('sin soporte');
        pantalla = { id: 'raiz' };
      },
    },
    async exitFullscreen() {
      if (!soporte) throw new Error('sin soporte');
      pantalla = null;
    },
  };
}

test('entra y sale de pantalla completa', async () => {
  const doc = documentoFalso();
  assert.equal(estaEnPantallaCompleta(doc), false);
  assert.equal(await alternarPantallaCompleta(doc), true);
  assert.equal(estaEnPantallaCompleta(doc), true);
  assert.equal(await alternarPantallaCompleta(doc), false);
  assert.equal(estaEnPantallaCompleta(doc), false);
});

test('sin soporte no rompe: se queda como estaba', async () => {
  const doc = documentoFalso({ soporte: false });
  assert.equal(await alternarPantallaCompleta(doc), false);
  assert.equal(estaEnPantallaCompleta(doc), false);
});

test('sin documento no rompe', async () => {
  assert.equal(estaEnPantallaCompleta(null), false);
  assert.equal(await alternarPantallaCompleta(null), false);
});
