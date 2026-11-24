import test from 'node:test';
import assert from 'node:assert/strict';
import { ORDEN, MECANICAS, MUNDOS } from '../js/contenido.js';

test('las mecánicas implementadas van de más fácil a más difícil', () => {
  const implementadas = ORDEN.filter((id) => MECANICAS[id]?.implementada);
  assert.deepEqual(
    implementadas,
    ['causaEfecto', 'hover', 'clickEstatico'],
    'causa-efecto (cualquier clic) antes que hover (acertar y aguantar) y click estático',
  );
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
