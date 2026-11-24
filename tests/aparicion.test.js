import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VENTANA_MIN_MS,
  VENTANA_MAX_MS,
  HUECO_MS,
  acotarVentana,
  avanzarAparicion,
  crearEstadoAparicion,
  registrarAcierto,
  registrarFallo,
  reajustarVentana,
  ventanaDeAyuda,
} from '../js/aparicion.js';

test('la ventana de ayuda respeta el suelo y el techo de 4 a 8 segundos', () => {
  assert.equal(VENTANA_MIN_MS, 4000);
  assert.equal(VENTANA_MAX_MS, 8000);
  assert.equal(ventanaDeAyuda(0), 4500);
  assert.equal(ventanaDeAyuda(2), 5850, 'el nivel 2 alarga la ventana un 30 %');
  assert.ok(ventanaDeAyuda(99) <= VENTANA_MAX_MS && ventanaDeAyuda(99) > VENTANA_MIN_MS);
  assert.equal(acotarVentana(1000), VENTANA_MIN_MS);
  assert.equal(acotarVentana(9000), VENTANA_MAX_MS);
});

test('la mecánica puede declarar su ventana base sin salirse de 4–8 s', () => {
  assert.equal(ventanaDeAyuda(0, 5000), 5000);
  assert.equal(ventanaDeAyuda(5, 5000), 8000, 'el techo sigue mandando');
  const estado = crearEstadoAparicion({ nivel: 0, baseMs: 5000, huecoMs: 900 });
  assert.equal(estado.ventanaMs, 5000);
  assert.equal(estado.huecoMs, 900);
});

test('el objetivo empieza visible y pasa al hueco al agotarse la ventana', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  assert.equal(estado.fase, 'visible');
  assert.equal(estado.ventanaMs, 4500);
  assert.equal(estado.restanteMs, 4500);

  estado = avanzarAparicion(estado, 2000);
  assert.equal(estado.fase, 'visible', 'a mitad de ventana sigue visible');
  assert.equal(estado.restanteMs, 2500);
  assert.equal(estado.cambio, null);

  estado = avanzarAparicion(estado, 2600);
  assert.equal(estado.fase, 'hueco');
  assert.equal(estado.cambio, 'seOculto');
  assert.equal(estado.restanteMs, HUECO_MS);
});

test('tras el hueco el objetivo vuelve a aparecer con la ventana vigente', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  estado = avanzarAparicion(estado, 4500);
  assert.equal(estado.fase, 'hueco');

  estado = avanzarAparicion(estado, HUECO_MS - 1);
  assert.equal(estado.fase, 'hueco');

  estado = avanzarAparicion(estado, 1);
  assert.equal(estado.fase, 'visible');
  assert.equal(estado.cambio, 'aparece');
  assert.equal(estado.restanteMs, estado.ventanaMs);
});

test('dos aciertos a tiempo seguidos acortan la ventana 300 ms para subir el reto', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  estado = registrarAcierto(estado);
  assert.equal(estado.ventanaMs, 4500, 'un acierto suelto no cambia la ventana');
  assert.equal(estado.aciertosSeguidos, 1);
  assert.equal(estado.fase, 'hueco');

  estado = registrarAcierto(estado);
  assert.equal(estado.ventanaMs, 4200);
  assert.equal(estado.aciertosSeguidos, 0);
});

test('la ventana no baja del suelo aunque se acierte mucho', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  for (let i = 0; i < 10; i++) estado = registrarAcierto(estado);
  assert.equal(estado.ventanaMs, VENTANA_MIN_MS);
});

test('un fallo suave alarga la ventana 600 ms y no resta progreso', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  estado = registrarFallo(estado);
  assert.equal(estado.ventanaMs, 5100);
  assert.equal(estado.fase, 'visible', 'el fallo no cambia la fase por sí solo');
  assert.equal(estado.aciertosSeguidos, 0);
});

test('un fallo corta la racha: dos aciertos no seguidos no acortan la ventana', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  estado = registrarAcierto(estado);
  estado = registrarFallo(estado);
  estado = registrarAcierto(estado);
  assert.equal(estado.ventanaMs, 5100, 'solo se sumó el paso de ayuda');
});

test('la ventana nunca se sale de 4–8 s por muchos fallos que haya', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  for (let i = 0; i < 20; i++) estado = registrarFallo(estado);
  assert.equal(estado.ventanaMs, VENTANA_MAX_MS);
});

test('subir la ayuda a mitad de partida alarga la ventana sin acortarla nunca', () => {
  let estado = crearEstadoAparicion({ nivel: 0 });
  estado = reajustarVentana(estado, 3);
  assert.equal(estado.ventanaMs, ventanaDeAyuda(3));

  const yaLarga = { ...estado, ventanaMs: 7000 };
  const sinCambios = reajustarVentana(yaLarga, 1);
  assert.equal(sinCambios.ventanaMs, 7000, 'la ayuda nunca quita tiempo ya ganado');
});
