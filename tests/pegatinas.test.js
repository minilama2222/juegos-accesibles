import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PEGATINAS,
  CLAVE_PEGATINAS,
  leerColeccion,
  guardarColeccion,
  ganarPegatina,
  coleccionVisible,
} from '../js/pegatinas.js';

function almacenFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial).map(([k, v]) => [k, String(v)]));
  return {
    datos,
    getItem(clave) {
      return datos.has(clave) ? datos.get(clave) : null;
    },
    setItem(clave, valor) {
      datos.set(clave, String(valor));
    },
  };
}

test('sin nada guardado la colección está vacía', () => {
  assert.deepEqual(leerColeccion(almacenFalso()), {});
});

test('una tirada guarda la primera pegatina que falta', () => {
  const almacen = almacenFalso();
  const premio = ganarPegatina({ almacen });
  assert.equal(premio.id, PEGATINAS[0].id);
  assert.equal(premio.nueva, true);
  assert.deepEqual(JSON.parse(almacen.getItem(CLAVE_PEGATINAS)), { [PEGATINAS[0].id]: 1 });
});

test('las pegatinas se ganan sin repetir hasta completar la colección', () => {
  const almacen = almacenFalso();
  const ids = [];
  for (let i = 0; i < PEGATINAS.length; i++) ids.push(ganarPegatina({ almacen }).id);
  assert.deepEqual(ids, PEGATINAS.map((p) => p.id));
  assert.equal(new Set(ids).size, PEGATINAS.length);
});

test('con la colección completa se sigue premiando sin marcarlo como castigo', () => {
  const almacen = almacenFalso();
  for (const p of PEGATINAS) guardarColeccion({ ...leerColeccion(almacen), [p.id]: 1 }, almacen);
  const premio = ganarPegatina({ almacen, azar: () => 0 });
  assert.equal(premio.nueva, false);
  assert.equal(premio.id, PEGATINAS[0].id);
  assert.equal(premio.coleccion[PEGATINAS[0].id], 2);
});

test('un JSON roto no rompe la colección', () => {
  const almacen = almacenFalso({ [CLAVE_PEGATINAS]: '{{{' });
  assert.deepEqual(leerColeccion(almacen), {});
});

test('los datos basura se descartan y solo quedan pegatinas conocidas', () => {
  const almacen = almacenFalso({
    [CLAVE_PEGATINAS]: JSON.stringify({ [PEGATINAS[0].id]: 2, inventada: 9, [PEGATINAS[1].id]: -3 }),
  });
  assert.deepEqual(leerColeccion(almacen), { [PEGATINAS[0].id]: 2 });
});

test('la vista de colección marca cuáles están ganadas', () => {
  const visible = coleccionVisible({ [PEGATINAS[1].id]: 1 });
  assert.equal(visible.length, PEGATINAS.length);
  assert.equal(visible[0].ganada, false);
  assert.equal(visible[1].ganada, true);
  assert.equal(visible[1].veces, 1);
});
