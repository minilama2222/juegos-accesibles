// Movimiento lento: la trayectoria del objetivo y el escalado de velocidad.
// Lógica pura, probada en node; la escena solo aplica la posición y dibuja.
//
// La velocidad se mide en radianes por segundo sobre la curva: empieza lenta,
// sube con los aciertos y tiene techo. La ayuda adaptativa la multiplica por
// `factorVelocidad` (<1), así que pedir ayuda siempre frena el dibujo.

export const VELOCIDAD_BASE = 0.5; // rad/s: una vuelta cada ~12,6 s
export const VELOCIDAD_MAX = 1; // techo humano: una vuelta cada ~6,3 s
export const PASO_VELOCIDAD = 0.12;
export const ACIERTOS_POR_PASO = 2;
export const VELOCIDAD_MINIMA = 0.05;

export const MARGEN_TRAYECTORIA = 10;
export const LOBULOS = 3;
export const ONDULACION = 0.14;

function numero(valor, porDefecto) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : porDefecto;
}

export function acotarVelocidad(velocidad, { base = VELOCIDAD_BASE, techo = VELOCIDAD_MAX } = {}) {
  const b = Math.max(0, numero(base, VELOCIDAD_BASE));
  const t = Math.max(b, numero(techo, VELOCIDAD_MAX));
  return Math.min(t, Math.max(b, numero(velocidad, b)));
}

// Velocidad que toca con N aciertos. Es monótona y se queda en el techo:
// acertar mucho acelera, pero nunca hasta volverse imposible de seguir.
export function velocidadPorAciertos(aciertos, opciones = {}) {
  const { base = VELOCIDAD_BASE, techo = VELOCIDAD_MAX, paso = PASO_VELOCIDAD, cada = ACIERTOS_POR_PASO } =
    opciones;
  const n = Math.max(0, Math.trunc(numero(aciertos, 0)));
  const salto = Math.max(1, Math.trunc(numero(cada, ACIERTOS_POR_PASO)));
  const avance = Math.max(0, numero(paso, PASO_VELOCIDAD));
  const v = base + Math.floor(n / salto) * avance;
  return acotarVelocidad(v, { base, techo });
}

// La ayuda no cambia la escalera: frena lo que toca en ese momento. Nunca deja
// el dibujo completamente parado, que dejaría de ser el juego de seguimiento.
export function velocidadEfectiva(velocidad, factorVelocidad, { techo = VELOCIDAD_MAX } = {}) {
  const v = Math.max(0, numero(velocidad, VELOCIDAD_BASE));
  const f = numero(factorVelocidad, 1);
  const factor = f > 0 ? f : 1;
  return Math.min(numero(techo, VELOCIDAD_MAX), Math.max(VELOCIDAD_MINIMA, v * factor));
}

// La curva radial (r = 1 + ondulación·sen(lóbulos·ángulo)) es cerrada, suave y
// simple: el ángulo siempre crece, así que ningún rayo desde el centro la corta
// dos veces. Eso evita que el objetivo se solape consigo mismo de forma confusa.
export function crearTrayectoria({
  ancho,
  alto,
  radio,
  margen = MARGEN_TRAYECTORIA,
  fase = 0,
  giro = 1,
  lobulos = LOBULOS,
  ondulacion = ONDULACION,
} = {}) {
  const w = Math.max(0, numero(ancho, 0));
  const h = Math.max(0, numero(alto, 0));
  const r = Math.max(0, numero(radio, 0));
  const m = Math.max(0, numero(margen, MARGEN_TRAYECTORIA));
  const centro = { x: w / 2, y: h / 2 };

  // Se reserva el hueco del dibujo y el margen; la ondulación se reparte dentro
  // de ese hueco para que el pico de la curva tampoco se salga.
  const amplitud = Math.max(0, numero(ondulacion, ONDULACION));
  const escala = 1 + amplitud;
  const radioX = Math.max(0, (w - 2 * (r + m)) / 2) / escala;
  const radioY = Math.max(0, (h - 2 * (r + m)) / 2) / escala;
  const lobulosValidos = Math.max(1, Math.trunc(numero(lobulos, LOBULOS)));
  const sentido = numero(giro, 1) < 0 ? -1 : 1;
  const desfase = numero(fase, 0);

  const posicion = (angulo) => {
    const a = numero(angulo, 0) * sentido + desfase;
    const onda = 1 + amplitud * Math.sin(lobulosValidos * a);
    return {
      x: centro.x + Math.cos(a) * radioX * onda,
      y: centro.y + Math.sin(a) * radioY * onda,
    };
  };

  return { centro, radioX, radioY, posicion };
}

export function avanzarAngulo(angulo, velocidad, dtSegundos) {
  const a = numero(angulo, 0);
  const v = numero(velocidad, 0);
  const dt = numero(dtSegundos, 0);
  if (dt <= 0 || v <= 0) return a;
  const vuelta = Math.PI * 2;
  return (((a + v * dt) % vuelta) + vuelta) % vuelta;
}
