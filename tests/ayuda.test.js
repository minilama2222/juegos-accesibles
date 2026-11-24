import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLAVE_AYUDA,
  NIVEL_MAX,
  aplicarEventoAyuda,
  crearAyuda,
  estadoAyudaInicial,
  guardarAyuda,
  leerAyuda,
  normalizarAyuda,
  parametrosDeAyuda,
} from '../js/ayuda.js';

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

test('el nivel 0 no cambia nada', () => {
  assert.deepEqual(parametrosDeAyuda(0), {
    nivel: 0,
    factorTamano: 1,
    factorVentana: 1,
    factorVelocidad: 1,
  });
});

test('cada nivel agranda el objetivo, alarga la ventana y ralentiza el movimiento', () => {
  const p = parametrosDeAyuda(2);
  assert.equal(p.nivel, 2);
  assert.equal(p.factorTamano, 1.24);
  assert.equal(p.factorVentana, 1.3);
  assert.ok(Math.abs(p.factorVelocidad - 1 / 1.24) < 1e-9);
});

test('el nivel nunca se sale de la escalera', () => {
  assert.equal(parametrosDeAyuda(-4).nivel, 0);
  assert.equal(parametrosDeAyuda(99).nivel, NIVEL_MAX);
  assert.equal(parametrosDeAyuda('basura').nivel, 0);
});

test('dos fallos seguidos suben un nivel y reinician la racha', () => {
  let estado = estadoAyudaInicial();
  estado = aplicarEventoAyuda(estado, 'fallo');
  assert.equal(estado.nivel, 0);
  assert.equal(estado.fallosSeguidos, 1);
  estado = aplicarEventoAyuda(estado, 'fallo');
  assert.equal(estado.nivel, 1);
  assert.equal(estado.fallosSeguidos, 0);
});

test('un acierto corta la racha de fallos: no se sube por fallos sueltos', () => {
  let estado = estadoAyudaInicial();
  estado = aplicarEventoAyuda(estado, 'fallo');
  estado = aplicarEventoAyuda(estado, 'acierto');
  estado = aplicarEventoAyuda(estado, 'fallo');
  assert.equal(estado.nivel, 0);
  assert.equal(estado.fallosSeguidos, 1);
});

test('cuatro aciertos seguidos bajan un nivel y reinician la racha', () => {
  let estado = estadoAyudaInicial(2);
  for (let i = 0; i < 3; i++) estado = aplicarEventoAyuda(estado, 'acierto');
  assert.equal(estado.nivel, 2);
  estado = aplicarEventoAyuda(estado, 'acierto');
  assert.equal(estado.nivel, 1);
  assert.equal(estado.aciertosSeguidos, 0);
});

test('la ayuda no baja por debajo de 0 ni sube por encima del techo', () => {
  let bajo = estadoAyudaInicial(0);
  for (let i = 0; i < 8; i++) bajo = aplicarEventoAyuda(bajo, 'acierto');
  assert.equal(bajo.nivel, 0);

  let alto = estadoAyudaInicial(NIVEL_MAX);
  for (let i = 0; i < 6; i++) alto = aplicarEventoAyuda(alto, 'fallo');
  assert.equal(alto.nivel, NIVEL_MAX);
});

test('el nivel se guarda por juego y no contamina a otro juego', () => {
  const almacen = almacenFalso();
  const hover = crearAyuda({ juego: 'hover', almacen });
  hover.anotarFallo();
  hover.anotarFallo();
  assert.equal(hover.leer().nivel, 1);
  assert.deepEqual(JSON.parse(almacen.getItem(CLAVE_AYUDA)), { hover: 1 });

  const click = crearAyuda({ juego: 'clickEstatico', almacen });
  assert.equal(click.leer().nivel, 0, 'otro juego empieza sin ayuda');
});

test('el nivel persistido se recupera en la siguiente sesión', () => {
  const almacen = almacenFalso();
  const primera = crearAyuda({ juego: 'hover', almacen });
  primera.anotarFallo();
  primera.anotarFallo();

  const segunda = crearAyuda({ juego: 'hover', almacen });
  assert.equal(segunda.leer().nivel, 1);
});

test('al volver al nivel 0 se borra la entrada guardada', () => {
  const almacen = almacenFalso();
  const ayuda = crearAyuda({ juego: 'hover', almacen, nivel: 1 });
  for (let i = 0; i < 4; i++) ayuda.anotarAcierto();
  assert.equal(ayuda.leer().nivel, 0);
  assert.deepEqual(JSON.parse(almacen.getItem(CLAVE_AYUDA)), {});
});

test('un JSON roto no rompe la ayuda', () => {
  const almacen = almacenFalso({ [CLAVE_AYUDA]: '{{{' });
  assert.deepEqual(leerAyuda(almacen), {});
});

test('los datos basura se descartan y los niveles se acotan', () => {
  const almacen = almacenFalso({
    [CLAVE_AYUDA]: JSON.stringify({ hover: 9, click: 'x', negativo: -2, cero: 0 }),
  });
  assert.deepEqual(leerAyuda(almacen), { hover: NIVEL_MAX });
  assert.deepEqual(normalizarAyuda({ hover: 2, otro: 1.9 }), { hover: 2, otro: 1 });
});

test('guardar y leer la ayuda conserva todos los juegos', () => {
  const almacen = almacenFalso();
  guardarAyuda({ hover: 2, clickEstatico: 1 }, almacen);
  assert.deepEqual(leerAyuda(almacen), { hover: 2, clickEstatico: 1 });
});
