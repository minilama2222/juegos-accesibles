// Parejas: baraja, tablero y reglas de un juego tranquilo de memoria.
// Lógica pura, probada en node. La escena solo dibuja y anima; aquí se decide
// dónde está cada carta, qué se gira y cuándo se ha encontrado una pareja.
import { parametrosDeAyuda } from './ayuda.js';

export const TABLEROS = [4, 6, 8];
export const PAREJAS_POR_DEFECTO = 4;
export const COLUMNAS = 4;

export function normalizarParejas(valor) {
  const n = Math.trunc(Number(valor));
  return TABLEROS.includes(n) ? n : PAREJAS_POR_DEFECTO;
}

// Dos cartas por pareja. Se mezclan con el azar inyectable para poder probar
// el reparto sin depender de Math.random.
export function crearBaraja({ parejas, simbolos, azar = Math.random } = {}) {
  const numero = normalizarParejas(parejas);
  if (!Array.isArray(simbolos) || simbolos.length < numero) return [];

  const elegidos = simbolos.slice(0, numero);
  const cartas = [];
  for (let pareja = 0; pareja < numero; pareja++) {
    for (let copia = 0; copia < 2; copia++) {
      cartas.push({ id: cartas.length, pareja, simbolo: elegidos[pareja], estado: 'oculta' });
    }
  }

  const azarAcotado = () => {
    const n = Number(azar());
    return Number.isFinite(n) ? Math.min(0.999999, Math.max(0, n)) : 0;
  };
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(azarAcotado() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }
  // Los ids son estables y no dependen del sitio que ocupan tras mezclar.
  cartas.forEach((c, i) => {
    c.id = i;
  });
  return cartas;
}

const LADO_MINIMO_PX = 44;

// Tiempo que se quedan destapadas las dos cartas de un par fallido. La ayuda
// adaptativa lo alarga con el mismo factor de ventana que el resto de juegos.
export const TIEMPO_PAR_BASE_MS = 1500;
export const TIEMPO_PAR_MAX_MS = 3000;

export function tiempoVisiblePar(nivel = 0, baseMs = TIEMPO_PAR_BASE_MS) {
  const base = Number.isFinite(Number(baseMs)) ? Number(baseMs) : TIEMPO_PAR_BASE_MS;
  const ms = base * parametrosDeAyuda(nivel).factorVentana;
  return Math.round(Math.min(TIEMPO_PAR_MAX_MS, Math.max(0, ms)));
}

// Estado de una partida de parejas. Toda la verdad vive aquí: la escena solo
// refleja `leer()` en sprites y traduce un clic a `girar()`.
export function crearJuegoParejas({ parejas, simbolos, azar = Math.random } = {}) {
  const numero = normalizarParejas(parejas);
  const cartas = crearBaraja({ parejas: numero, simbolos, azar });
  const estado = {
    parejas: numero,
    cartas,
    encontradas: 0,
    fallos: 0,
    bloqueada: false,
    terminada: false,
    primera: null,
    pendientes: [],
  };

  const leer = () => ({
    parejas: estado.parejas,
    cartas: estado.cartas.map((c) => ({ ...c })),
    encontradas: estado.encontradas,
    fallos: estado.fallos,
    bloqueada: estado.bloqueada,
    terminada: estado.terminada,
  });

  function girar(indice) {
    const i = Number(indice);
    if (estado.terminada || estado.bloqueada) return { cambio: false };
    if (!Number.isInteger(i) || i < 0 || i >= estado.cartas.length) return { cambio: false };
    const carta = estado.cartas[i];
    if (carta.estado !== 'oculta') return { cambio: false };

    carta.estado = 'visible';

    if (estado.primera === null) {
      estado.primera = i;
      return { cambio: true, tipo: 'primera', indice: i };
    }

    const primera = estado.cartas[estado.primera];
    if (primera.pareja === carta.pareja) {
      primera.estado = 'encontrada';
      carta.estado = 'encontrada';
      estado.primera = null;
      estado.encontradas += 1;
      estado.terminada = estado.encontradas >= estado.parejas;
      return {
        cambio: true,
        tipo: 'pareja',
        indices: [primera.id, carta.id],
        encontradas: estado.encontradas,
        terminada: estado.terminada,
      };
    }

    // Par fallido: las dos se quedan visibles un momento para poder memorizarlas.
    // El fallo no toca `encontradas`: nunca se pierde progreso.
    estado.fallos += 1;
    estado.bloqueada = true;
    estado.pendientes = [primera.id, carta.id];
    estado.primera = null;
    return {
      cambio: true,
      tipo: 'fallo',
      indices: [...estado.pendientes],
      fallos: estado.fallos,
    };
  }

  function resolverFallo() {
    if (!estado.bloqueada) return { cambio: false };
    for (const i of estado.pendientes) {
      const carta = estado.cartas[i];
      if (carta && carta.estado === 'visible') carta.estado = 'oculta';
    }
    const indices = [...estado.pendientes];
    estado.pendientes = [];
    estado.bloqueada = false;
    return { cambio: true, tipo: 'resuelto', indices };
  }

  return { leer, girar, resolverFallo };
}

function candidatos(total) {
  const lista = [];
  for (let columnas = 1; columnas <= total; columnas++) {
    if (total % columnas !== 0) continue;
    lista.push({ columnas, filas: total / columnas });
  }
  return lista;
}

// El tablero ocupa el área libre de la pantalla (sin scroll) y elige la rejilla
// que hace las cartas más grandes. Así 4 parejas caben en 4×2 y, en una pantalla
// estrecha, se apilan en 2×4 sin encogerlas.
export function disposicionTablero({
  parejas,
  ancho,
  alto,
  margen = 24,
  margenSuperior = margen,
  margenInferior = margen,
  separacion = 0.12,
} = {}) {
  const numero = normalizarParejas(parejas);
  const total = numero * 2;
  const x0 = Math.max(0, margen);
  const y0 = Math.max(0, margenSuperior);
  const x1 = Math.max(x0, ancho - Math.max(0, margen));
  const y1 = Math.max(y0, alto - Math.max(0, margenInferior));
  const anchoUtil = x1 - x0;
  const altoUtil = y1 - y0;

  let mejor = null;
  for (const c of candidatos(total)) {
    const anchoCelda = anchoUtil / c.columnas;
    const altoCelda = altoUtil / c.filas;
    const lado = Math.min(anchoCelda, altoCelda);
    if (!mejor || lado > mejor.lado + 1e-9) mejor = { ...c, lado, anchoCelda, altoCelda };
  }
  if (!mejor) return { parejas: numero, columnas: 0, filas: 0, lado: 0, cartas: [] };

  const lado = Math.max(LADO_MINIMO_PX, mejor.lado * (1 - Math.max(0, Math.min(0.9, separacion))));
  const cartas = [];
  for (let fila = 0; fila < mejor.filas; fila++) {
    for (let columna = 0; columna < mejor.columnas; columna++) {
      cartas.push({
        indice: cartas.length,
        x: x0 + (columna + 0.5) * mejor.anchoCelda,
        y: y0 + (fila + 0.5) * mejor.altoCelda,
        lado,
      });
    }
  }

  return { parejas: numero, columnas: mejor.columnas, filas: mejor.filas, lado, cartas };
}

export function indiceCartaEn(disposicion, x, y) {
  if (!disposicion || !Array.isArray(disposicion.cartas)) return -1;
  for (const carta of disposicion.cartas) {
    if (Math.abs(x - carta.x) <= carta.lado / 2 && Math.abs(y - carta.y) <= carta.lado / 2) {
      return carta.indice;
    }
  }
  return -1;
}
