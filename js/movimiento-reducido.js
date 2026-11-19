// Interruptor único de movimiento reducido (ADR 0001, regla 9).
// Kaplay, GSAP, el confeti y el CSS consultan aquí; nadie improvisa su propio criterio.

const CONSULTA = '(prefers-reduced-motion: reduce)';

// Cuánto se recorta cada efecto cuando el sistema pide menos movimiento.
export const FACTOR_APARICION = 0.5; // el refuerzo se acorta, no desaparece
export const CONFETI_REDUCIDO = 40; // piezas, frente a las 220 normales
export const CONFETI_NORMAL = 220;

export function prefiereMenosMovimiento(consulta = globalThis.matchMedia) {
  try {
    return !!(consulta && consulta(CONSULTA).matches);
  } catch {
    return false;
  }
}

// Escucha el cambio en vivo (el sistema puede cambiar mientras la página está abierta).
// Devuelve una función para desuscribirse. Si no hay soporte, no hace nada.
export function alCambiarPreferencia(oyente, consulta = globalThis.matchMedia) {
  if (typeof oyente !== 'function') return () => {};
  let mql = null;
  try {
    mql = consulta && consulta(CONSULTA);
  } catch {
    return () => {};
  }
  if (!mql || typeof mql.addEventListener !== 'function') return () => {};
  const manejador = (evento) => oyente(!!evento.matches);
  mql.addEventListener('change', manejador);
  return () => mql.removeEventListener('change', manejador);
}

export function cantidadConfeti(menos = prefiereMenosMovimiento()) {
  return menos ? CONFETI_REDUCIDO : CONFETI_NORMAL;
}
