export const APARICION_MS = 420;
export const ACIERTO_MS = 480;

const cubicOut = (t) => 1 - Math.pow(1 - t, 3);
const cubicIn = (t) => t * t * t;
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function conAnticipacion(t, anticipo = 0.18) {
  if (t <= anticipo) {
    const u = t / anticipo;
    return { escala: 0.88 + 0.12 * Math.min(1, u), opacidad: Math.min(1, u * 2), anticipando: true };
  }
  const u = (t - anticipo) / (1 - anticipo);
  const rebote = 1 + 0.28 * Math.sin(u * Math.PI) * (1 - u) ** 0.6;
  return { escala: rebote, opacidad: Math.min(1, u * 2.4) };
}

export function animarAparicion(progreso) {
  const t = Math.max(0, Math.min(1, progreso));
  const { escala, opacidad, anticipando } = conAnticipacion(t);
  if (anticipando) {
    return { escalaX: escala, escalaY: escala, opacidad: 0, giro: -0.18 * (1 - t / 0.18) };
  }
  const estirado = 1 + (escala - 1) * 0.35;
  return {
    escalaX: escala * estirado,
    escalaY: escala / estirado,
    opacidad,
    giro: (1 - cubicOut(t)) * -0.18,
  };
}

export function animarAcierto(progreso) {
  const t = Math.max(0, Math.min(1, progreso));
  const salto = Math.sin(t * Math.PI) * 0.55;
  const aplaste = t < 0.25 ? 1 - 0.25 * (t / 0.25) : 1;
  return {
    escalaX: 1 + salto * 1.1 * aplaste,
    escalaY: 1 + salto * aplaste,
    opacidad: t < 0.7 ? 1 : 1 - suave((t - 0.7) / 0.3),
    giro: salto * 0.15 * (t > 0.5 ? 1 : -1),
  };
}

// Brote de causa-efecto: aparece con anticipación, se sostiene un instante y se
// desvanece subiendo. Es el objeto entero, no un refuerzo: dura algo más que 480 ms.
export const BROTE_MS = 620;

export function animarBrote(progreso) {
  const t = Math.max(0, Math.min(1, progreso));
  const entrada = Math.min(1, t / 0.45);
  const a = animarAparicion(entrada);
  const salida = t <= 0.55 ? 0 : (t - 0.55) / 0.45;
  const desvanecido = suave(salida);
  return {
    escalaX: a.escalaX * (1 + 0.1 * desvanecido),
    escalaY: a.escalaY * (1 + 0.1 * desvanecido),
    opacidad: a.opacidad * (1 - desvanecido),
    subida: desvanecido, // 0→1: cuánto ha empezado a irse hacia arriba
    giro: a.giro * (1 - desvanecido),
  };
}

export function progreso(transcurrido, duracion) {
  if (duracion <= 0) return 1;
  return Math.max(0, Math.min(1, transcurrido / duracion));
}

// Tiro a portería: el balón sale rápido, frena al llegar (slow out) y dibuja
// un arco. La altura vuelve a 0 al final; la escena decide cuánto mide el arco.
export function animarTiro(progreso) {
  const t = Math.max(0, Math.min(1, progreso));
  const salida = t <= 0.75 ? 0 : (t - 0.75) / 0.25;
  return {
    avance: cubicOut(t),
    altura: t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI),
    giro: t * Math.PI * 2,
    escala: 1 + 0.14 * Math.sin(t * Math.PI),
    opacidad: 1 - suave(salida),
  };
}

export { cubicIn, cubicOut, suave };
