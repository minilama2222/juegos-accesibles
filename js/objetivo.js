export const MINIMO_PX = 44;

export function calcularRadio({ vmin, minimo, maximo, minimoPx = MINIMO_PX, azar = Math.random }) {
  const base = vmin * (minimo + (maximo - minimo) * azar());
  return Math.max(minimoPx / 2, base);
}
