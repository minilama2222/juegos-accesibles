import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAVE_METRICAS,
  anotarFin,
  anotarInicio,
  crearMetricas,
  guardarMetricas,
  leerMetricas,
  metricasVacias,
  normalizarMetricas,
} from '../js/metricas.js';

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

test('sin nada guardado las métricas están a cero', () => {
  assert.deepEqual(leerMetricas(almacenFalso()), metricasVacias());
});

test('empezar una partida cuenta la partida y el juego', () => {
  const { metricas } = anotarInicio(metricasVacias(), { juego: 'hover' });
  assert.equal(metricas.partidas, 1);
  assert.equal(metricas.porJuego.hover.partidas, 1);
  assert.equal(metricas.porJuego.hover.aciertos, 0);
});

test('cambiar de juego cuenta el cambio; repetir el mismo no', () => {
  let { metricas } = anotarInicio(metricasVacias(), { juego: 'hover' });
  metricas = anotarInicio(metricas, { juego: 'hover' }).metricas;
  assert.equal(metricas.cambiosJuego, 0, 'el mismo juego no es un cambio');

  metricas = anotarInicio(metricas, { juego: 'causaEfecto' }).metricas;
  assert.equal(metricas.cambiosJuego, 1);

  metricas = anotarInicio(metricas, { juego: 'hover' }).metricas;
  assert.equal(metricas.cambiosJuego, 2);
});

test('terminar una partida acumula aciertos, fallos, duración y ayuda final por juego', () => {
  let metricas = anotarInicio(metricasVacias(), { juego: 'hover' }).metricas;
  metricas = anotarFin(metricas, {
    juego: 'hover',
    aciertos: 3,
    fallos: 2,
    duracionMs: 1500,
    ayudaFinal: 1,
  });
  assert.equal(metricas.aciertos, 3);
  assert.equal(metricas.fallos, 2);
  assert.equal(metricas.duracionMs, 1500);
  assert.equal(metricas.porJuego.hover.aciertos, 3);
  assert.equal(metricas.porJuego.hover.fallos, 2);
  assert.equal(metricas.porJuego.hover.duracionMs, 1500);
  assert.equal(metricas.porJuego.hover.ayudaFinal, 1);
});

test('las métricas de un juego no se mezclan con las de otro', () => {
  let metricas = anotarInicio(metricasVacias(), { juego: 'hover' }).metricas;
  metricas = anotarInicio(metricas, { juego: 'causaEfecto' }).metricas;
  metricas = anotarFin(metricas, { juego: 'hover', aciertos: 4, fallos: 1 });
  metricas = anotarFin(metricas, { juego: 'causaEfecto', aciertos: 12, fallos: 0 });
  assert.equal(metricas.porJuego.hover.aciertos, 4);
  assert.equal(metricas.porJuego.causaEfecto.aciertos, 12);
  assert.equal(metricas.aciertos, 16);
});

test('el almacén persiste y sobrevive a una recarga', () => {
  const almacen = almacenFalso();
  let metricas = anotarInicio(metricasVacias(), { juego: 'hover' }).metricas;
  metricas = anotarFin(metricas, { juego: 'hover', aciertos: 2, fallos: 0, duracionMs: 900 });
  guardarMetricas(metricas, almacen);

  const leidas = leerMetricas(almacen);
  assert.equal(leidas.partidas, 1);
  assert.equal(leidas.porJuego.hover.aciertos, 2);
  assert.equal(leidas.porJuego.hover.duracionMs, 900);
});

test('un JSON roto o datos basura no rompen las métricas', () => {
  assert.deepEqual(leerMetricas(almacenFalso({ [CLAVE_METRICAS]: '{{{' })), metricasVacias());
  const limpias = normalizarMetricas({
    partidas: -3,
    aciertos: '7',
    fallos: 1.9,
    duracionMs: Infinity,
    cambiosJuego: 2,
    porJuego: {
      hover: { partidas: 1, aciertos: 3, fallos: -2, duracionMs: '40', ayudaFinal: 1.8 },
      basura: null,
      '': { partidas: 1 },
    },
  });
  assert.equal(limpias.partidas, 0);
  assert.equal(limpias.aciertos, 7);
  assert.equal(limpias.fallos, 1);
  assert.equal(limpias.duracionMs, 0);
  assert.equal(limpias.porJuego.hover.aciertos, 3);
  assert.equal(limpias.porJuego.hover.fallos, 0);
  assert.equal(limpias.porJuego.hover.duracionMs, 40);
  assert.equal(limpias.porJuego.hover.ayudaFinal, 1);
  assert.equal(limpias.porJuego.basura, undefined);
  assert.equal(limpias.porJuego[''], undefined);
});

test('el registrador mide la duración entre empezar y terminar', () => {
  const almacen = almacenFalso();
  let ahora = 1000;
  const registro = crearMetricas({ almacen, ahora: () => ahora });

  registro.empezar('hover');
  ahora = 2500;
  registro.terminar({ aciertos: 3, fallos: 1, ayudaFinal: 2 });

  const datos = JSON.parse(almacen.getItem(CLAVE_METRICAS));
  assert.equal(datos.duracionMs, 1500);
  assert.equal(datos.porJuego.hover.duracionMs, 1500);
  assert.equal(datos.porJuego.hover.aciertos, 3);
  assert.equal(datos.porJuego.hover.fallos, 1);
  assert.equal(datos.porJuego.hover.ayudaFinal, 2);
});

test('empezar otra partida cierra la anterior sin perder la duración', () => {
  const almacen = almacenFalso();
  let ahora = 100;
  const registro = crearMetricas({ almacen, ahora: () => ahora });

  registro.empezar('hover');
  ahora = 400;
  registro.empezar('causaEfecto');
  ahora = 1000;
  registro.terminar({ aciertos: 12 });

  const datos = JSON.parse(almacen.getItem(CLAVE_METRICAS));
  assert.equal(datos.partidas, 2);
  assert.equal(datos.porJuego.hover.duracionMs, 300);
  assert.equal(datos.porJuego.causaEfecto.duracionMs, 600);
  assert.equal(datos.porJuego.causaEfecto.aciertos, 12);
});

test('exportar devuelve una copia de lo guardado', () => {
  const almacen = almacenFalso();
  const registro = crearMetricas({ almacen });
  registro.empezar('hover');
  registro.terminar({ aciertos: 1 });
  const exportado = registro.exportar();
  assert.equal(exportado.aciertos, 1);
  exportado.aciertos = 999;
  assert.equal(registro.leer().aciertos, 1, 'no se puede mutar el estado interno');
});
