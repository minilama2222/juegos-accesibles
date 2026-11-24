import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACIERTOS_POR_PASO,
  VELOCIDAD_BASE,
  VELOCIDAD_MAX,
  avanzarAngulo,
  crearTrayectoria,
  velocidadEfectiva,
  velocidadPorAciertos,
} from '../js/movimiento-lento.js';

// Cruce de dos segmentos por orientación: sirve para comprobar que la curva
// no se pisa a sí misma. Los segmentos contiguos comparten un extremo y se
// descartan antes de llamar aquí.
function orientacion(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function seCruzan(a, b, c, d) {
  const o1 = orientacion(a, b, c);
  const o2 = orientacion(a, b, d);
  const o3 = orientacion(c, d, a);
  const o4 = orientacion(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

test('la trayectoria se queda entera dentro de la pantalla, con margen para el radio', () => {
  const ancho = 1600;
  const alto = 900;
  const radio = 100;
  const t = crearTrayectoria({ ancho, alto, radio, fase: 0.7 });
  for (let i = 0; i <= 360; i++) {
    const p = t.posicion((i * Math.PI) / 180);
    assert.ok(p.x >= radio, `x=${p.x} se sale por la izquierda`);
    assert.ok(p.x <= ancho - radio, `x=${p.x} se sale por la derecha`);
    assert.ok(p.y >= radio, `y=${p.y} se sale por arriba`);
    assert.ok(p.y <= alto - radio, `y=${p.y} se sale por abajo`);
  }
});

test('la trayectoria es una curva cerrada y suave que no se cruza consigo misma', () => {
  const t = crearTrayectoria({ ancho: 1200, alto: 800, radio: 80, fase: 0, lobulos: 3 });
  const n = 120;
  const puntos = Array.from({ length: n }, (_, i) => t.posicion((i / n) * Math.PI * 2));

  // Cierra el bucle para comparar también el último tramo con el primero.
  const segmentos = puntos.map((p, i) => [p, puntos[(i + 1) % n]]);

  // Sin saltos: cada paso es parecido a sus vecinos (curva suave, no poligonal).
  const pasos = puntos.map((p, i) => {
    const q = puntos[(i + 1) % n];
    return Math.hypot(q.x - p.x, q.y - p.y);
  });
  const medio = pasos.reduce((a, b) => a + b, 0) / pasos.length;
  for (const paso of pasos) assert.ok(paso < medio * 2.5, 'la curva no pega saltos');

  // Sin autointersección: ninguna pareja de tramos que no comparte extremo se cruza.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const contiguos = j === i + 1 || (i === 0 && j === n - 1);
      if (contiguos) continue;
      const [a, b] = segmentos[i];
      const [c, d] = segmentos[j];
      assert.equal(seCruzan(a, b, c, d), false, `la curva se cruza entre los tramos ${i} y ${j}`);
    }
  }
});

test('la trayectoria se adapta al tamaño del dibujo: con más radio, sigue dentro', () => {
  const grande = crearTrayectoria({ ancho: 800, alto: 600, radio: 180 });
  const pequena = crearTrayectoria({ ancho: 800, alto: 600, radio: 60 });
  assert.ok(grande.radioX < pequena.radioX, 'un dibujo más grande recorre menos sitio');
  for (let i = 0; i < 50; i++) {
    const p = grande.posicion((i / 50) * Math.PI * 2);
    assert.ok(p.x >= 180 && p.x <= 620);
    assert.ok(p.y >= 180 && p.y <= 420);
  }
});

test('la velocidad parte lenta y sube con aciertos hasta un techo humano', () => {
  assert.equal(velocidadPorAciertos(0), VELOCIDAD_BASE);
  assert.ok(velocidadPorAciertos(ACIERTOS_POR_PASO) > VELOCIDAD_BASE);
  assert.ok(velocidadPorAciertos(ACIERTOS_POR_PASO * 2) > velocidadPorAciertos(ACIERTOS_POR_PASO));

  let anterior = -1;
  for (let i = 0; i <= 40; i++) {
    const v = velocidadPorAciertos(i);
    assert.ok(v >= anterior, 'nunca se hace más lenta al acertar');
    assert.ok(v <= VELOCIDAD_MAX, 'no pasa del techo humano');
    anterior = v;
  }
  assert.equal(velocidadPorAciertos(1000), VELOCIDAD_MAX);
});

test('el escalado de velocidad se puede configurar desde el registro', () => {
  const opciones = { base: 0.4, techo: 0.8, paso: 0.1, cada: 1 };
  assert.equal(velocidadPorAciertos(0, opciones), 0.4);
  assert.ok(Math.abs(velocidadPorAciertos(1, opciones) - 0.5) < 1e-9);
  assert.ok(Math.abs(velocidadPorAciertos(3, opciones) - 0.7) < 1e-9);
  assert.equal(velocidadPorAciertos(99, opciones), 0.8);
});

test('la ayuda adaptativa ralentiza el movimiento con factorVelocidad', () => {
  const base = velocidadPorAciertos(6);
  const conAyuda = velocidadEfectiva(base, 0.6);
  assert.ok(conAyuda < base, 'más ayuda, más lento');
  assert.equal(velocidadEfectiva(base, 1), base);
  assert.equal(velocidadEfectiva(base, undefined), base);
  assert.ok(velocidadEfectiva(base, 0) > 0, 'nunca se queda parado del todo');
});

test('el ángulo avanza con el tiempo y da la vuelta sin saltos', () => {
  assert.ok(Math.abs(avanzarAngulo(0, 1, 0.5) - 0.5) < 1e-9);
  assert.equal(avanzarAngulo(1, 1, 0), 1);
  const vuelta = avanzarAngulo(Math.PI * 2 - 0.1, 1, 0.2);
  assert.ok(vuelta >= 0 && vuelta < 0.2);
  assert.equal(avanzarAngulo(1, undefined, 0.5), 1);
});
