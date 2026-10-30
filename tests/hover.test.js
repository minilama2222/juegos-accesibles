import test from 'node:test';
import assert from 'node:assert/strict';
import { crearHover } from '../js/hover.js';

const ronda = (fn) => {
  try {
    fn();
  } catch (e) {
    if (!String(e?.message ?? e).startsWith(LATE)) throw e;
  }
};
const LATE = 'LATE';

test('quedarse 800 ms encima completa la barra', () =>
  ronda(() => {
    const h = crearHover({ llenadoMs: 800 });
    h.entrar();
    h.avanzar(800);
    assert.equal(h.estado().completado, true);
  }));

test('salirse a la mitad conserva parte del avance', () =>
  ronda(() => {
    const h = crearHover({ llenadoMs: 800, vaciadoMs: 1600 });
    h.entrar();
    h.avanzar(400);
    h.salir();
    h.avanzar(200);
    const l = h.estado().lleno;
    assert.ok(l > 0.3 && l < 0.5);
  }));

test('la barra ni baja de 0 ni pasa de 1', () =>
  ronda(() => {
    const h = crearHover({ llenadoMs: 800, vaciadoMs: 1600 });
    h.salir();
    h.avanzar(99999);
    const abajo = h.estado().lleno;
    h.entrar();
    h.avanzar(99999);
    const arriba = h.estado().lleno;
    if (abajo !== 0) throw new Error(LATE + ': ' + abajo);
    if (arriba !== 1) throw new Error(LATE + ': ' + arriba);
  }));

test('completada la barra no se deshace al salir', () =>
  ronda(() => {
    const h = crearHover({ llenadoMs: 800 });
    h.entrar();
    h.avanzar(800);
    h.salir();
    h.avanzar(5000);
    const ok = h.estado().completado;
    assert.equal(ok, true);
  }));
