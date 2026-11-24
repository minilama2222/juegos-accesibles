import test from 'node:test';
import assert from 'node:assert/strict';
import { crearMarcador } from '../js/sesion.js';

test('la partida empieza sin aciertos y sin terminar', () => {
  const m = crearMarcador({ meta: 3 }).leer();
  assert.equal(m.aciertos, 0);
  assert.equal(m.terminada, false);
});

test('termina justo al llegar a la meta, no antes', () => {
  const marcador = crearMarcador({ meta: 3 });
  assert.equal(marcador.anotarAcierto().terminada, false);
  assert.equal(marcador.anotarAcierto().terminada, false);
  const final = marcador.anotarAcierto();
  assert.equal(final.aciertos, 3);
  assert.equal(final.terminada, true);
});

test('no cuenta toques después del final', () => {
  const marcador = crearMarcador({ meta: 2 });
  marcador.anotarAcierto();
  marcador.anotarAcierto();
  const despues = marcador.anotarAcierto();
  assert.equal(despues.aciertos, 2);
  assert.equal(despues.terminada, true);
});

test('la meta por defecto es la de la serie', () => {
  assert.equal(crearMarcador().leer().meta, 6);
});
