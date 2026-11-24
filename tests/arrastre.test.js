import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOLERANCIA,
  elegirReparto,
  estaDentro,
  huboArrastre,
  resultadoSuelte,
} from '../js/arrastre.js';

// Arrastre: el dibujo sale a un lado y la zona al otro; hay que pulsarlo,
// mantenerlo y soltarlo dentro. Estas pruebas cubren la geometría y la regla
// de soltado sin navegador.

test('el reparto deja el dibujo y la zona dentro de la pantalla, separados y grandes', () => {
  for (const [ancho, alto] of [
    [1600, 900],
    [1200, 800],
    [800, 600],
    [900, 1200],
    [420, 800],
  ]) {
    const reparto = elegirReparto({ ancho, alto, radioObjetivo: 70 });
    const { inicio, zona } = reparto;

    assert.ok(inicio.x - inicio.radio >= 0, `${ancho}x${alto}: el dibujo cabe por la izquierda`);
    assert.ok(inicio.x + inicio.radio <= ancho, `${ancho}x${alto}: el dibujo cabe por la derecha`);
    assert.ok(inicio.y - inicio.radio >= 0, `${ancho}x${alto}: el dibujo cabe arriba`);
    assert.ok(inicio.y + inicio.radio <= alto, `${ancho}x${alto}: el dibujo cabe abajo`);

    assert.ok(zona.x - zona.radio >= 0, `${ancho}x${alto}: la zona cabe por la izquierda`);
    assert.ok(zona.x + zona.radio <= ancho, `${ancho}x${alto}: la zona cabe por la derecha`);
    assert.ok(zona.y - zona.radio >= 0, `${ancho}x${alto}: la zona cabe arriba`);
    assert.ok(zona.y + zona.radio <= alto, `${ancho}x${alto}: la zona cabe abajo`);

    const separacion = Math.hypot(zona.x - inicio.x, zona.y - inicio.y);
    assert.ok(
      separacion >= inicio.radio + zona.radio + 8,
      `${ancho}x${alto}: hay recorrido entre el dibujo y la zona (${separacion} px)`,
    );
    assert.ok(zona.radio >= inicio.radio, `${ancho}x${alto}: la zona no es más pequeña que el dibujo`);
  }
});

test('el reparto cambia de eje según la forma de la pantalla', () => {
  const ancha = elegirReparto({ ancho: 1600, alto: 900, radioObjetivo: 60 });
  assert.ok(ancha.inicio.x < ancha.zona.x, 'en pantalla ancha el recorrido es horizontal');

  const alta = elegirReparto({ ancho: 800, alto: 1100, radioObjetivo: 60 });
  assert.ok(alta.inicio.y < alta.zona.y, 'en pantalla alta el recorrido es vertical');
});

test('soltar dentro de la zona acierta; en el centro y en el borde', () => {
  const zona = { x: 500, y: 300, radio: 100 };
  assert.equal(resultadoSuelte({ zona, x: 500, y: 300 }).acierto, true, 'centro');
  assert.equal(resultadoSuelte({ zona, x: 600, y: 300 }).acierto, true, 'borde justo');
  assert.equal(resultadoSuelte({ zona, x: 500 - 99, y: 300 }).acierto, true, 'borde izquierdo');
});

test('la zona perdona un poco más allá del borde: soltar cerca también acierta', () => {
  const zona = { x: 500, y: 300, radio: 100 };
  const tolerancia = zona.radio * TOLERANCIA;
  const casi = resultadoSuelte({ zona, x: 500 + 118, y: 300, tolerancia });
  assert.equal(casi.acierto, true, 'un pelín fuera del borde sigue valiendo');
  assert.ok(casi.distancia > zona.radio, 'de verdad estaba fuera del círculo');

  const lejos = resultadoSuelte({ zona, x: 500 + 180, y: 300, tolerancia });
  assert.equal(lejos.acierto, false, 'demasiado lejos ya no vale');
  assert.ok(lejos.distancia > zona.radio + tolerancia);
});

test('soltar lejos de la zona no acierta y lo dice con la distancia', () => {
  const zona = { x: 800, y: 450, radio: 90 };
  const r = resultadoSuelte({ zona, x: 100, y: 450 });
  assert.equal(r.acierto, false);
  assert.equal(r.distancia, 700);
});

test('el dibujo se agarra solo si se pulsa encima de él', () => {
  const dibujo = { x: 200, y: 300, radio: 60 };
  assert.equal(estaDentro(dibujo, 200, 300), true);
  assert.equal(estaDentro(dibujo, 259, 300), true);
  assert.equal(estaDentro(dibujo, 280, 300), false);
  assert.equal(estaDentro(dibujo, 200, 380), false);
});

test('un clic sin mover no cuenta como arrastre; moverse sí', () => {
  const desde = { x: 100, y: 100 };
  assert.equal(huboArrastre(desde, { x: 102, y: 101 }, 20), false);
  assert.equal(huboArrastre(desde, { x: 160, y: 100 }, 20), true);
});
