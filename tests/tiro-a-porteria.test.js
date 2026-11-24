import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLUMNAS,
  FILAS,
  asignarHueco,
  crearHuecos,
  destinoFallo,
  escalarHuecos,
  geometriaPorteria,
  resultadoTiro,
} from '../js/tiro-a-porteria.js';
import { MINIMO_PX, calcularRadio } from '../js/objetivo.js';

const ANCHO = 1600;
const ALTO = 900;

test('la portería ocupa el centro y deja sitio abajo para lanzar', () => {
  const porteria = geometriaPorteria({ ancho: ANCHO, alto: ALTO });
  assert.ok(porteria.ancho > ANCHO * 0.6, 'la portería es grande');
  assert.ok(porteria.alto > ALTO * 0.4, 'la portería tiene altura de sobra');
  assert.ok(porteria.x > 0 && porteria.y > 0);
  assert.ok(
    porteria.y + porteria.alto < ALTO * 0.9,
    'queda una franja inferior libre para el balón y el botón de salir',
  );
});

test('los huecos son grandes, no se solapan y caben dentro del marco', () => {
  const porteria = geometriaPorteria({ ancho: ANCHO, alto: ALTO });
  const radio = calcularRadio({ vmin: Math.min(ANCHO, ALTO) / 100, minimo: 9, maximo: 13, azar: () => 0 });
  const huecos = crearHuecos({ porteria, radio });

  assert.equal(huecos.length, COLUMNAS * FILAS);
  assert.ok(huecos.every((h) => h.radio * 2 >= MINIMO_PX), 'ningún hueco baja del mínimo de 44 px');
  for (const h of huecos) {
    assert.ok(h.x - h.radio >= porteria.x, 'cabe por la izquierda');
    assert.ok(h.x + h.radio <= porteria.x + porteria.ancho, 'cabe por la derecha');
    assert.ok(h.y - h.radio >= porteria.y, 'cabe por arriba');
    assert.ok(h.y + h.radio <= porteria.y + porteria.alto, 'cabe por abajo');
  }
  for (let i = 0; i < huecos.length; i++) {
    for (let j = i + 1; j < huecos.length; j++) {
      const d = Math.hypot(huecos[i].x - huecos[j].x, huecos[i].y - huecos[j].y);
      assert.ok(d >= huecos[i].radio + huecos[j].radio, 'los huecos no se pisan');
    }
  }
});

test('si la pantalla es pequeña el hueco sigue por encima de 44 px', () => {
  const radio = calcularRadio({ vmin: 6, minimo: 9, maximo: 13, azar: () => 0 });
  assert.ok(radio * 2 >= MINIMO_PX);
});

test('la ayuda agranda los huecos sin moverlos de sitio', () => {
  const porteria = geometriaPorteria({ ancho: ANCHO, alto: ALTO });
  const base = crearHuecos({ porteria, radio: 90 });
  const crecidos = escalarHuecos(base, 1.6);
  assert.equal(crecidos.length, base.length);
  crecidos.forEach((h, i) => {
    assert.equal(h.x, base[i].x);
    assert.equal(h.y, base[i].y);
    assert.equal(h.radioBase, base[i].radioBase);
    assert.ok(Math.abs(h.radio - base[i].radio * 1.6) < 1e-9);
  });
});

test('un clic dentro de un hueco se asigna a ese hueco', () => {
  const huecos = [
    { id: 0, x: 100, y: 100, radio: 40 },
    { id: 1, x: 300, y: 100, radio: 40 },
  ];
  assert.equal(asignarHueco(huecos, 100, 100), 0);
  assert.equal(asignarHueco(huecos, 340, 100), 1, 'el borde también cuenta');
  assert.equal(asignarHueco(huecos, 200, 100), -1, 'entre dos huecos no hay acierto');
  assert.equal(asignarHueco([], 10, 10), -1);
});

test('resultadoTiro distingue gol de fallo sin tocar el estado', () => {
  const huecos = [{ id: 0, x: 500, y: 300, radio: 70 }];
  assert.deepEqual(resultadoTiro(huecos, 520, 310), { acierto: true, hueco: 0 });
  assert.deepEqual(resultadoTiro(huecos, 100, 100), { acierto: false, hueco: -1 });
});

test('el destino del fallo se queda dentro de la pantalla con margen', () => {
  assert.deepEqual(destinoFallo({ ancho: ANCHO, alto: ALTO, x: 700, y: 500 }), { x: 700, y: 500 });
  assert.deepEqual(destinoFallo({ ancho: ANCHO, alto: ALTO, x: -40, y: ALTO + 90 }), { x: 28, y: ALTO - 28 });
  assert.deepEqual(destinoFallo({ ancho: ANCHO, alto: ALTO, x: ANCHO - 2, y: 4 }), { x: ANCHO - 28, y: 28 });
});
