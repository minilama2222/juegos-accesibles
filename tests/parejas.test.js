import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAREJAS_POR_DEFECTO,
  TABLEROS,
  TIEMPO_PAR_BASE_MS,
  TIEMPO_PAR_MAX_MS,
  crearBaraja,
  crearJuegoParejas,
  disposicionTablero,
  indiceCartaEn,
  normalizarParejas,
  tiempoVisiblePar,
} from '../js/parejas.js';
import { MINIMO_PX } from '../js/objetivo.js';

test('solo se ofrecen tableros de 4, 6 u 8 parejas', () => {
  assert.deepEqual(TABLEROS, [4, 6, 8]);
  assert.equal(PAREJAS_POR_DEFECTO, 4);
  assert.equal(normalizarParejas(6), 6);
  assert.equal(normalizarParejas('8'), 8);
  assert.equal(normalizarParejas(5), 4, 'un tablero desconocido cae en el más fácil');
  assert.equal(normalizarParejas(null), 4);
});

test('la baraja tiene dos cartas de cada pareja y no se repite ningún símbolo', () => {
  const simbolos = ['regalo', 'estrella', 'bolita', 'reno', 'copo', 'campana', 'galleta', 'calcetin'];
  const cartas = crearBaraja({ parejas: 6, simbolos, azar: () => 0.5 });

  assert.equal(cartas.length, 12);
  const porPareja = new Map();
  for (const c of cartas) {
    porPareja.set(c.pareja, (porPareja.get(c.pareja) ?? 0) + 1);
  }
  assert.equal(porPareja.size, 6);
  assert.ok([...porPareja.values()].every((n) => n === 2), 'cada pareja aparece dos veces');
  assert.equal(new Set(cartas.map((c) => c.simbolo)).size, 6, 'hay seis dibujos distintos');
  assert.ok(cartas.every((c) => c.estado === 'oculta'), 'todas empiezan boca abajo');
  assert.deepEqual(
    cartas.map((c) => c.id),
    Array.from({ length: 12 }, (_, i) => i),
    'cada carta tiene un id estable',
  );
});

test('la baraja se reparte mezclada, sin depender del orden de los símbolos', () => {
  const simbolos = ['a', 'b', 'c', 'd'];
  const barajada = crearBaraja({ parejas: 4, simbolos, azar: () => 0 });
  const otra = crearBaraja({ parejas: 4, simbolos, azar: () => 0.999 });
  assert.notDeepEqual(
    barajada.map((c) => c.simbolo),
    otra.map((c) => c.simbolo),
    'el azar cambia el reparto',
  );
  assert.equal(barajada.length, 8);
});

test('sin suficientes símbolos no se inventa una baraja rota', () => {
  assert.deepEqual(crearBaraja({ parejas: 8, simbolos: ['a', 'b'] }), []);
});

test('el tablero reparte todas las cartas dentro de la pantalla, sin solaparse', () => {
  for (const parejas of TABLEROS) {
    const d = disposicionTablero({ parejas, ancho: 1600, alto: 900, margen: 40 });
    assert.equal(d.cartas.length, parejas * 2);
    for (const c of d.cartas) {
      assert.ok(c.lado * 2 >= MINIMO_PX, `${parejas}: cartas grandes`);
      assert.ok(c.x - c.lado / 2 >= 40, 'cabe por la izquierda');
      assert.ok(c.x + c.lado / 2 <= 1600 - 40, 'cabe por la derecha');
      assert.ok(c.y - c.lado / 2 >= 40, 'cabe por arriba');
      assert.ok(c.y + c.lado / 2 <= 900 - 40, 'cabe por abajo');
    }
    for (let i = 0; i < d.cartas.length; i++) {
      for (let j = i + 1; j < d.cartas.length; j++) {
        const a = d.cartas[i];
        const b = d.cartas[j];
        const separados =
          Math.abs(a.x - b.x) >= (a.lado + b.lado) / 2 ||
          Math.abs(a.y - b.y) >= (a.lado + b.lado) / 2;
        assert.ok(separados, `${parejas}: las cartas no se pisan`);
      }
    }
  }
});

test('el tablero se adapta a una pantalla estrecha y las cartas siguen siendo grandes', () => {
  const ancho = 600;
  const alto = 1000;
  const d = disposicionTablero({ parejas: 4, ancho, alto, margen: 24 });
  assert.equal(d.cartas.length, 8);
  assert.ok(d.columnas < d.filas, 'en vertical se apila en más filas que columnas');
  assert.ok(d.lado * 2 >= MINIMO_PX);
  assert.ok(d.cartas.every((c) => c.x - c.lado / 2 >= 0 && c.y + c.lado / 2 <= alto));
});

test('en una pantalla pequeña todas las cartas siguen por encima de 44 px', () => {
  for (const parejas of TABLEROS) {
    const d = disposicionTablero({ parejas, ancho: 800, alto: 600, margen: 20 });
    assert.ok(d.cartas.every((c) => c.lado >= MINIMO_PX), `${parejas}: cartas grandes en 800×600`);
  }
});

test('un clic se asigna a la carta que lo contiene y a ninguna si cae fuera', () => {
  const d = disposicionTablero({ parejas: 4, ancho: 1200, alto: 800, margen: 24 });
  const carta = d.cartas[3];
  assert.equal(indiceCartaEn(d, carta.x, carta.y), 3);
  assert.equal(indiceCartaEn(d, carta.x + carta.lado / 2 - 1, carta.y), 3);
  assert.equal(indiceCartaEn(d, 1, 1), -1);
  assert.equal(indiceCartaEn(d, carta.x + carta.lado, carta.y), -1);
});

test('girar una carta la deja visible y dos iguales se quedan encontradas', () => {
  const juego = crearJuegoParejas({ parejas: 4, simbolos: ['a', 'b', 'c', 'd'] });
  const pareja = juego.leer().cartas.filter((c) => c.pareja === 0);

  let r = juego.girar(pareja[0].id);
  assert.equal(r.tipo, 'primera');
  assert.equal(juego.leer().cartas[pareja[0].id].estado, 'visible');
  assert.equal(juego.leer().encontradas, 0);

  r = juego.girar(pareja[1].id);
  assert.equal(r.tipo, 'pareja');
  const e = juego.leer();
  assert.equal(e.cartas[pareja[0].id].estado, 'encontrada');
  assert.equal(e.cartas[pareja[1].id].estado, 'encontrada');
  assert.equal(e.encontradas, 1);
  assert.equal(e.fallos, 0, 'acertar no cuenta fallo');
  assert.equal(e.terminada, false);
});

test('un par distinto se queda visible, no quita progreso y luego se vuelve a esconder', () => {
  const juego = crearJuegoParejas({ parejas: 4, simbolos: ['a', 'b', 'c', 'd'] });
  const cartas = juego.leer().cartas;
  const a = cartas.find((c) => c.pareja === 0);
  const b = cartas.find((c) => c.pareja === 1);

  juego.girar(a.id);
  const r = juego.girar(b.id);
  assert.equal(r.tipo, 'fallo');
  let e = juego.leer();
  assert.equal(e.bloqueada, true);
  assert.equal(e.fallos, 1, 'el fallo se cuenta al descubrir que no son iguales');
  assert.equal(e.encontradas, 0, 'fallar no quita ni da progreso');
  assert.equal(e.cartas[a.id].estado, 'visible');
  assert.equal(e.cartas[b.id].estado, 'visible');

  // Mientras se ven las dos cartas, los clics no hacen nada.
  assert.equal(juego.girar(cartas.find((c) => c.pareja === 2).id).cambio, false);

  const resuelto = juego.resolverFallo();
  assert.equal(resuelto.tipo, 'resuelto');
  e = juego.leer();
  assert.equal(e.bloqueada, false);
  assert.equal(e.cartas[a.id].estado, 'oculta');
  assert.equal(e.cartas[b.id].estado, 'oculta');
  assert.equal(e.fallos, 1);
  assert.equal(e.encontradas, 0);
});

test('las cartas ya visibles o encontradas no se vuelven a girar', () => {
  const juego = crearJuegoParejas({ parejas: 4, simbolos: ['a', 'b', 'c', 'd'] });
  const pareja = juego.leer().cartas.filter((c) => c.pareja === 0);
  juego.girar(pareja[0].id);
  assert.equal(juego.girar(pareja[0].id).cambio, false, 'la misma carta no se gira dos veces');
  juego.girar(pareja[1].id);
  assert.equal(juego.girar(pareja[0].id).cambio, false, 'una pareja encontrada ya no se toca');
  assert.equal(juego.girar(99).cambio, false, 'un índice fuera de la baraja no rompe');
});

test('encontrar todas las parejas termina la partida', () => {
  const juego = crearJuegoParejas({ parejas: 4, simbolos: ['a', 'b', 'c', 'd'] });
  for (let pareja = 0; pareja < 4; pareja++) {
    const dos = juego.leer().cartas.filter((c) => c.pareja === pareja);
    juego.girar(dos[0].id);
    const r = juego.girar(dos[1].id);
    assert.equal(r.terminada, pareja === 3);
  }
  const e = juego.leer();
  assert.equal(e.encontradas, 4);
  assert.equal(e.terminada, true);
  assert.equal(juego.girar(0).cambio, false, 'terminada no acepta más giros');
});

test('la ayuda alarga el tiempo que se ven las cartas destapadas', () => {
  assert.equal(tiempoVisiblePar(0), TIEMPO_PAR_BASE_MS);
  assert.ok(tiempoVisiblePar(2) > tiempoVisiblePar(0));
  assert.ok(tiempoVisiblePar(5) <= TIEMPO_PAR_MAX_MS);
  assert.ok(tiempoVisiblePar(99) <= TIEMPO_PAR_MAX_MS);
});
