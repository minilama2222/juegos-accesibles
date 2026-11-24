import test from 'node:test';
import assert from 'node:assert/strict';
import { siguienteAvatar, leerAvatar, guardarAvatar } from '../js/menu.js';

test('el avatar pasa al siguiente y vuelve a empezar', () => {
  const ids = ['gato', 'perro', 'pato'];
  assert.equal(siguienteAvatar('gato', ids), 'perro');
  assert.equal(siguienteAvatar('perro', ids), 'pato');
  assert.equal(siguienteAvatar('pato', ids), 'gato');
});

test('un avatar que ya no existe cae en el primero', () => {
  assert.equal(siguienteAvatar('balon', ['gato', 'perro']), 'gato');
  assert.equal(siguienteAvatar(null, ['gato', 'perro']), 'gato');
});

test('sin lista no se rompe', () => {
  assert.equal(siguienteAvatar('gato', []), 'gato');
  assert.equal(siguienteAvatar('gato', null), 'gato');
});

test('sin localStorage no se rompe', () => {
  assert.equal(leerAvatar(), null);
  assert.doesNotThrow(() => guardarAvatar('gato'));
});
