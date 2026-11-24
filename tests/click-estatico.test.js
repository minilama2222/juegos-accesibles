import test from 'node:test';
import assert from 'node:assert/strict';
import {
  distanciaEntre,
  distanciaMinima,
  elegirPosicionLejos,
  estaDentro,
  posicionesCandidatas,
} from '../js/click-estatico.js';

const MARGEN = 8;

test('la distancia mínima crece con el radio del objetivo', () => {
  assert.equal(distanciaMinima(50), 150);
  assert.equal(distanciaMinima(10), 30);
});

test('la distancia entre dos puntos es la euclídea', () => {
  assert.equal(distanciaEntre({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('sin referencia el primer objetivo empieza centrado', () => {
  const p = elegirPosicionLejos({ ancho: 800, alto: 600, radio: 50, desde: null });
  assert.deepEqual(p, { x: 400, y: 300 });
});

test('tras un acierto el objetivo se recoloca a la distancia mínima o más', () => {
  const desde = { x: 120, y: 100 };
  const radio = 40;
  for (const azar of [0, 0.2, 0.5, 0.8, 0.999]) {
    const p = elegirPosicionLejos({ ancho: 800, alto: 600, radio, desde, azar: () => azar });
    assert.ok(
      distanciaEntre(p, desde) >= distanciaMinima(radio),
      `con azar ${azar} se queda a ${distanciaEntre(p, desde)} px`,
    );
  }
});

test('todos los candidatos caben en pantalla con margen', () => {
  const radio = 60;
  const ancho = 1000;
  const alto = 700;
  const candidatas = posicionesCandidatas({ ancho, alto, radio });
  assert.equal(candidatas.length, 25);
  for (const p of candidatas) {
    assert.ok(p.x - radio >= MARGEN, 'no se sale por la izquierda');
    assert.ok(p.x + radio <= ancho - MARGEN, 'no se sale por la derecha');
    assert.ok(p.y - radio >= MARGEN, 'no se sale por arriba');
    assert.ok(p.y + radio <= alto - MARGEN, 'no se sale por abajo');
  }
  assert.ok(
    candidatas.some((p) => p.x === 68 && p.y === 68),
    'incluye la esquina real, no solo el centro de la celda',
  );
});

test('si ninguna posición queda lejos, elige la más lejana posible', () => {
  // Pantalla pequeña y objetivo enorme: los 25 candidatos caen casi en el centro.
  const p = elegirPosicionLejos({
    ancho: 300,
    alto: 300,
    radio: 120,
    desde: { x: 150, y: 150 },
    azar: () => 0.99,
  });
  // Esquina superior izquierda real: 128, y empata con la inferior derecha.
  assert.deepEqual(p, { x: 128, y: 128 });
  assert.ok(distanciaEntre(p, { x: 150, y: 150 }) > 0);
});

test('si ni siquiera cabe el objetivo, vuelve al centro', () => {
  const p = elegirPosicionLejos({ ancho: 100, alto: 100, radio: 200, desde: null });
  assert.deepEqual(p, { x: 50, y: 50 });
});

test('un clic dentro del radio acierta y uno fuera falla', () => {
  const objetivo = { x: 300, y: 200, radio: 80 };
  assert.equal(estaDentro(objetivo, 300, 200), true);
  assert.equal(estaDentro(objetivo, 380, 200), true);
  assert.equal(estaDentro(objetivo, 381, 200), false);
  assert.equal(estaDentro(null, 300, 200), false);
});
