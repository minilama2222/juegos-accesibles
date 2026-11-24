// Aparición con tiempo: el objetivo alterna una ventana visible y un hueco.
// Lógica pura, probada en node. Los tiempos salen de la ayuda adaptativa:
// la ventana base se escala con `factorVentana` y se mueve en los pasos del
// ADR 0001 (300 ms al subir el reto, 600 ms al pedir ayuda), siempre entre 4 y
// 8 s. Un fallo solo puede dar más tiempo: nunca resta progreso ni castiga.
import { parametrosDeAyuda } from './ayuda.js';

export const VENTANA_MIN_MS = 4000;
export const VENTANA_MAX_MS = 8000;
export const VENTANA_BASE_MS = 4500;
export const HUECO_MS = 1200;
export const PASO_RETO_MS = 300;
export const PASO_AYUDA_MS = 600;
export const ACIERTOS_PARA_ACORTAR = 2;
// Un objetivo solo cuenta como visible cuando la animación de entrada ya lo
// ha sacado de la transparencia. Así un clic en el primer fotograma no acierta.
export const UMBRAL_VISIBLE = 0.5;

export function estaVisibleDeVerdad({ fase, opacidad, oculto = false, terminada = false } = {}) {
  const o = Number(opacidad);
  return fase === 'visible' && !oculto && !terminada && Number.isFinite(o) && o > UMBRAL_VISIBLE;
}

// Traduce un clic a resultado. Aunque el objetivo esté en su sitio, mientras
// la animación de entrada no lo haya hecho visible el clic nunca es acierto.
export function decidirClicAparicion({ visible, dentro }) {
  return visible && dentro ? 'acierto' : 'fallo';
}

export function acotarVentana(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n)) return VENTANA_BASE_MS;
  return Math.min(VENTANA_MAX_MS, Math.max(VENTANA_MIN_MS, n));
}

// Nivel persistido de ayuda → tiempo visible. Con nivel 0 son 4,5 s; el techo
// de la escalera se queda en 7,875 s, dentro del margen de 4–8 s.
export function ventanaDeAyuda(nivel, baseMs = VENTANA_BASE_MS) {
  const base = Number.isFinite(Number(baseMs)) ? Number(baseMs) : VENTANA_BASE_MS;
  return acotarVentana(base * parametrosDeAyuda(nivel).factorVentana);
}

function huecoValido(ms) {
  const n = Number(ms);
  return Number.isFinite(n) && n >= 0 ? n : HUECO_MS;
}

export function crearEstadoAparicion({ nivel = 0, ventanaMs, huecoMs = HUECO_MS, baseMs = VENTANA_BASE_MS } = {}) {
  const ventana = acotarVentana(ventanaMs ?? ventanaDeAyuda(nivel, baseMs));
  return {
    fase: 'visible',
    ventanaMs: ventana,
    restanteMs: ventana,
    huecoMs: huecoValido(huecoMs),
    aciertosSeguidos: 0,
    cambio: null,
  };
}

// Avanza el reloj. Una llamada hace como mucho una transición; si el fotograma
// se alarga, el resto se consume en el siguiente, sin saltarse estados.
export function avanzarAparicion(estado, deltaMs) {
  const delta = Number(deltaMs);
  if (!Number.isFinite(delta) || delta <= 0) return { ...estado, cambio: null };

  const restante = estado.restanteMs - delta;
  if (restante > 0) return { ...estado, restanteMs: restante, cambio: null };

  if (estado.fase === 'visible') {
    return { ...estado, fase: 'hueco', restanteMs: estado.huecoMs, cambio: 'seOculto' };
  }
  return { ...estado, fase: 'visible', restanteMs: estado.ventanaMs, cambio: 'aparece' };
}

// Un acierto a tiempo cierra la ventana y, cada dos seguidos, recorta 300 ms
// para subir el reto. Es el único camino que acorta: siempre se puede volver a
// alargar con ayuda.
export function registrarAcierto(estado) {
  const seguidos = (estado.aciertosSeguidos ?? 0) + 1;
  let ventana = estado.ventanaMs;
  let racha = seguidos;
  if (seguidos >= ACIERTOS_PARA_ACORTAR) {
    ventana = acotarVentana(ventana - PASO_RETO_MS);
    racha = 0;
  }
  return {
    ...estado,
    ventanaMs: ventana,
    aciertosSeguidos: racha,
    fase: 'hueco',
    restanteMs: estado.huecoMs,
    cambio: 'seOculto',
  };
}

// Fallo suave (clic en el hueco, clic fuera o ventana agotada): más ayuda, sin
// sonido duro y sin tocar aciertos ni progreso.
export function registrarFallo(estado) {
  return {
    ...estado,
    ventanaMs: acotarVentana(estado.ventanaMs + PASO_AYUDA_MS),
    aciertosSeguidos: 0,
    cambio: null,
  };
}

// Si la escalera de ayuda sube a mitad de partida, la ventana se alarga hasta
// el mínimo que marca ese nivel; nunca se quita tiempo ya ganado.
export function reajustarVentana(estado, nivel, baseMs = VENTANA_BASE_MS) {
  const minimo = ventanaDeAyuda(nivel, baseMs);
  return { ...estado, ventanaMs: acotarVentana(Math.max(estado.ventanaMs, minimo)) };
}
