import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAVE_EFECTOS,
  CLAVE_EFECTOS_ANTERIOR,
  CLAVE_MUSICA,
  leerEfectosSilenciados,
  guardarEfectosSilenciados,
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

test('sin preferencia guardada los efectos están encendidos y la música apagada', () => {
  const almacen = almacenFalso();
  assert.equal(leerEfectosSilenciados(almacen), false);
  assert.equal(leerMusica(almacen), false);
  assert.deepEqual(estadoSonido(), { efectos: false, musica: false, reproduciendo: false });
});

test('los efectos se silencian y se leen por separado de la música', () => {
  const almacen = almacenFalso();
  assert.equal(guardarEfectosSilenciados(true, almacen), true);
  assert.equal(almacen.getItem(CLAVE_EFECTOS), 'apagado');
  assert.equal(leerEfectosSilenciados(almacen), true);
  assert.equal(leerMusica(almacen), false, 'silenciar efectos no toca la música');

  guardarEfectosSilenciados(false, almacen);
  assert.equal(almacen.getItem(CLAVE_EFECTOS), 'encendido');
  assert.equal(leerEfectosSilenciados(almacen), false);
});

test('la música es opt-in y se guarda aparte de los efectos', () => {
  const almacen = almacenFalso();
  assert.equal(guardarMusica(true, almacen), true);
  assert.equal(almacen.getItem(CLAVE_MUSICA), 'si');
  assert.equal(leerMusica(almacen), true);
  assert.equal(leerEfectosSilenciados(almacen), false, 'encender música no toca los efectos');

  guardarMusica(false, almacen);
  assert.equal(almacen.getItem(CLAVE_MUSICA), 'no');
  assert.equal(leerMusica(almacen), false);
});

test('sin almacén no se rompe y mantiene los valores por defecto', () => {
  assert.equal(leerEfectosSilenciados(null), false);
  assert.equal(leerMusica(null), false);
  assert.doesNotThrow(() => guardarEfectosSilenciados(true, null));
  assert.doesNotThrow(() => guardarMusica(true, null));
});

test('la preferencia antigua de sonido se hereda como preferencia de efectos', () => {
  const almacen = almacenFalso({ [CLAVE_EFECTOS_ANTERIOR]: 'apagado' });
  assert.equal(leerEfectosSilenciados(almacen), true);

  // Lo nuevo manda sobre lo antiguo.
  almacen.setItem(CLAVE_EFECTOS, 'encendido');
  assert.equal(leerEfectosSilenciados(almacen), false);
});
