import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MUNDOS } from '../js/contenido.js';
import { PEGATINAS } from '../js/pegatinas.js';

const raiz = new URL('..', import.meta.url);

test('cada mundo declara el objeto que se toca y su pictograma', () => {
  for (const m of MUNDOS) {
    assert.ok(m.objetivo, `${m.id} debe declarar objetivo`);
    assert.ok(m.imagen, `${m.id} debe declarar imagen`);
  }
});

test('los pictogramas de los objetivos existen en el repo', () => {
  for (const m of MUNDOS) {
    const ruta = fileURLToPath(new URL(m.imagen, raiz));
    assert.ok(existsSync(ruta), `falta ${m.imagen}`);
  }
});

test('los cuatro objetivos son los esperados', () => {
  const porId = Object.fromEntries(MUNDOS.map((m) => [m.id, m.objetivo]));
  assert.deepEqual(porId, {
    navidad: 'regalo',
    animalitos: 'gato',
    futbol: 'balon',
    amarillo: 'carita',
  });
});

test('las pegatinas con pictograma propio existen en el repo', () => {
  const conImagen = PEGATINAS.filter((p) => p.imagen);
  assert.ok(conImagen.length > 0, 'alguna pegatina usa pictograma ARASAAC');
  for (const p of conImagen) {
    const ruta = fileURLToPath(new URL(p.imagen, raiz));
    assert.ok(existsSync(ruta), `falta ${p.imagen}`);
  }
});

test('la pegatina del balón usa el mismo ARASAAC que el objetivo de fútbol', () => {
  const balon = PEGATINAS.find((p) => p.id === 'balon');
  const futbol = MUNDOS.find((m) => m.id === 'futbol');
  assert.equal(balon.imagen, futbol.imagen);
});
