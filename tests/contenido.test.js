import test from 'node:test';
import assert from 'node:assert/strict';
import { ORDEN, MECANICAS, MUNDOS } from '../js/contenido.js';

test('las mecánicas implementadas van de más fácil a más difícil', () => {
  const implementadas = ORDEN.filter((id) => MECANICAS[id]?.implementada);
  assert.deepEqual(
    implementadas,
    [
      'causaEfecto',
      'hover',
      'clickEstatico',
      'aparicion',
      'movimientoLento',
      'tiroAPorteria',
      'parejas',
      'arrastre',
    ],
    'causa-efecto, hover, click estático, aparición, movimiento lento, tiro a portería, parejas y arrastre',
  );
});

test('parejas va después del tiro y ofrece tableros de 4, 6 u 8', () => {
  const m = MECANICAS.parejas;
  assert.equal(m.implementada, true);
  assert.deepEqual(m.tableros, [4, 6, 8]);
  assert.equal(m.parejasPorDefecto, 4);
  assert.ok(ORDEN.indexOf('parejas') > ORDEN.indexOf('tiroAPorteria'));
  assert.ok(ORDEN.indexOf('parejas') < ORDEN.indexOf('arrastre'), 'el arrastre llega después');
  assert.ok(m.tiempoParMs > 0);
});

test('el arrastre se registra al final, sin alterar la serie anterior', () => {
  const m = MECANICAS.arrastre;
  assert.equal(m.implementada, true);
  assert.ok(m.meta >= 4, 'una partida corta de arrastre');
  assert.ok(m.objetivoMinVmin >= 10, 'el dibujo es grande para agarrarlo');
  assert.ok(m.objetivoMaxVmin > m.objetivoMinVmin);
  assert.equal(ORDEN[ORDEN.length - 1], 'arrastre', 'llega después de todo lo demás');
  assert.ok(ORDEN.indexOf('arrastre') > ORDEN.indexOf('tiroAPorteria'));
  assert.ok(ORDEN.indexOf('arrastre') > ORDEN.indexOf('movimientoLento'));
});

test('aparición declara ventana, hueco y meta de aciertos', () => {
  const m = MECANICAS.aparicion;
  assert.equal(m.meta, 6);
  assert.ok(m.ventanaMs >= 4000 && m.ventanaMs <= 8000);
  assert.ok(m.huecoMs > 0);
  assert.ok(m.objetivoMinVmin >= 10);
  assert.ok(m.objetivoMaxVmin > m.objetivoMinVmin);
});

test('movimiento lento va después de aparición y antes del tiro a portería', () => {
  assert.ok(ORDEN.indexOf('movimientoLento') > ORDEN.indexOf('aparicion'));
  assert.ok(ORDEN.indexOf('movimientoLento') < ORDEN.indexOf('tiroAPorteria'));

  const m = MECANICAS.movimientoLento;
  assert.equal(m.implementada, true);
  assert.ok(m.meta >= 4);
  assert.ok(m.objetivoMinVmin >= 10, 'el objetivo es grande para poder seguirlo');
  assert.ok(m.objetivoMaxVmin > m.objetivoMinVmin);
  assert.ok(m.velocidadBase > 0);
  assert.ok(m.velocidadMax > m.velocidadBase, 'la velocidad sube con aciertos hasta un techo');
});

test('tiro a portería pide una meta de goles y huecos grandes', () => {
  assert.equal(MECANICAS.tiroAPorteria.meta, 6);
  assert.ok(MECANICAS.tiroAPorteria.objetivoMinVmin > 0);
  assert.ok(MECANICAS.tiroAPorteria.objetivoMaxVmin > MECANICAS.tiroAPorteria.objetivoMinVmin);
});

test('click estático pide un objetivo grande y una meta de aciertos', () => {
  assert.equal(typeof MECANICAS.clickEstatico.meta, 'number');
  assert.ok(MECANICAS.clickEstatico.objetivoMinVmin >= MECANICAS.hover.objetivoMinVmin);
  assert.ok(MECANICAS.clickEstatico.objetivoMaxVmin > MECANICAS.clickEstatico.objetivoMinVmin);
});

test('causa-efecto no pide puntería y termina a los 12 toques', () => {
  assert.equal(MECANICAS.causaEfecto.meta, 12);
  assert.equal(MECANICAS.causaEfecto.objetivoMinVmin, undefined);
});

test('hover sí tiene objetivo y meta de aciertos', () => {
  assert.equal(typeof MECANICAS.hover.meta, 'number');
  assert.ok(MECANICAS.hover.objetivoMinVmin > 0);
});

test('todos los mundos sirven para las dos mecánicas', () => {
  assert.equal(MUNDOS.length, 4);
  assert.ok(MUNDOS.every((m) => m.imagen && m.fondo && m.acento));
});
