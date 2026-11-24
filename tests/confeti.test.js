import test from 'node:test';
import assert from 'node:assert/strict';
import { crearConfeti, avanzarConfeti, quedanVisibles } from '../js/confeti.js';

test('crea la cantidad pedida de piezas con colores válidos', () => {
  const piezas = crearConfeti({ ancho: 800, alto: 600, cantidad: 50, azar: () => 0.5 });
  assert.equal(piezas.length, 50);
  assert.ok(piezas.every((p) => typeof p.color === 'string' && p.color.startsWith('#')));
});

test('las piezas caen al avanzar el tiempo', () => {
  const piezas = crearConfeti({ ancho: 800, alto: 600, cantidad: 3, azar: () => 0.5 });
  const yAntes = piezas.map((p) => p.y);
  avanzarConfeti(piezas, 0.1);
  piezas.forEach((p, i) => assert.ok(p.y > yAntes[i]));
});

test('no quedan visibles cuando todo ha caído fuera', () => {
  const piezas = crearConfeti({ ancho: 800, alto: 600, cantidad: 2, azar: () => 0.5 });
  for (let i = 0; i < 200; i++) avanzarConfeti(piezas, 0.05);
  assert.equal(quedanVisibles(piezas, 600), false);
});

test('el confeti usa la paleta del mundo elegido', () => {
  const paleta = ['#010203', '#0a0b0c'];
  const piezas = crearConfeti({ ancho: 800, alto: 600, cantidad: 30, azar: () => 0.5, colores: paleta });
  assert.ok(piezas.every((p) => paleta.includes(p.color)));
});

test('las piezas se reparten por todo el ancho de la pantalla', () => {
  let n = 0;
  const azar = () => {
    n += 0.13;
    return n % 1;
  };
  const piezas = crearConfeti({ ancho: 1600, alto: 900, cantidad: 40, azar });
  const xs = piezas.map((p) => p.x);
  assert.ok(Math.min(...xs) < 200, 'alguna pieza empieza por la izquierda');
  assert.ok(Math.max(...xs) > 1400, 'alguna pieza empieza por la derecha');
});
