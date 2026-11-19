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

export function progreso(transcurrido, duracion) {
  if (duracion <= 0) return 1;
  return Math.max(0, Math.min(1, transcurrido / duracion));
}

export { cubicIn, cubicOut, suave };
