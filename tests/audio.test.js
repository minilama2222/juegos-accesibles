import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAVE_SONIDO,
  CLAVE_MUSICA,
  leerSilenciado,
  guardarSilenciado,
  leerMusica,
  guardarMusica,
  estadoSonido,
} from '../js/audio.js';

function almacenFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    getItem(clave) {
      return datos.has(clave) ? datos.get(clave) : null;
    },
    setItem(clave, valor) {
      datos.set(clave, String(valor));
    },
  };
}

test('sin preferencia guardada el sonido está encendido y la música apagada', () => {
  const almacen = almacenFalso();
  assert.equal(leerSilenciado(almacen), false);
  assert.equal(leerMusica(almacen), false);
  assert.deepEqual(estadoSonido(), { silenciado: false, musica: false, reproduciendo: false });
});

test('el silencio se guarda y se lee', () => {
  const almacen = almacenFalso();
  assert.equal(guardarSilenciado(true, almacen), true);
  assert.equal(almacen.getItem(CLAVE_SONIDO), 'apagado');
  assert.equal(leerSilenciado(almacen), true);

  guardarSilenciado(false, almacen);
  assert.equal(almacen.getItem(CLAVE_SONIDO), 'encendido');
  assert.equal(leerSilenciado(almacen), false);
});

test('la música es opt-in y se guarda', () => {
  const almacen = almacenFalso();
  assert.equal(guardarMusica(true, almacen), true);
  assert.equal(almacen.getItem(CLAVE_MUSICA), 'si');
  assert.equal(leerMusica(almacen), true);

  guardarMusica(false, almacen);
  assert.equal(almacen.getItem(CLAVE_MUSICA), 'no');
  assert.equal(leerMusica(almacen), false);
});

test('sin almacén no se rompe y mantiene los valores por defecto', () => {
  assert.equal(leerSilenciado(null), false);
  assert.equal(leerMusica(null), false);
  assert.doesNotThrow(() => guardarSilenciado(true, null));
  assert.doesNotThrow(() => guardarMusica(true, null));
});
