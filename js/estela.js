export const VIDA_MS = 300;
export const HUECOS = 24;

export function crearEstela({ vidaMs = VIDA_MS, huecos = HUECOS } = {}) {
  const puntos = [];

  return {
    añadir(x, y, ahora) {
      if (puntos.length > 0 && ahora - puntos[0].t > vidaMs) puntos.shift();
      const ultimo = puntos[puntos.length - 1];
      if (ultimo && Math.hypot(x - ultimo.x, y - ultimo.y) < 1) return;
      puntos.push({ x, y, t: ahora });
      if (puntos.length > huecos) puntos.shift();
    },
    tramos(ahora) {
      while (puntos.length > 0 && ahora - puntos[0].t > vidaMs) puntos.shift();
      if (puntos.length < 2) return [];
      const tramos = [];
      for (let i = 1; i < puntos.length; i++) {
        const a = puntos[i - 1];
        const b = puntos[i];
        const vida = Math.max(0, 1 - (ahora - b.t) / vidaMs);
        if (vida <= 0) continue;
        tramos.push({ x1: Math.round(a.x), y1: Math.round(a.y), x2: Math.round(b.x), y2: Math.round(b.y), vida });
      }
      return tramos;
    },
    vaciar() {
      puntos.length = 0;
    },
    puntos() {
      return puntos.slice();
    },
  };
}
