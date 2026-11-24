export const COLORES = ['#ffd54f', '#e53935', '#4fc3f7', '#aed581', '#f06292', '#ffffff'];

export function crearConfeti({ ancho, alto, cantidad = 160, azar = Math.random, colores = COLORES }) {
  const piezas = [];
  const paleta = Array.isArray(colores) && colores.length > 0 ? colores : COLORES;
  for (let i = 0; i < cantidad; i++) {
    piezas.push({
      x: azar() * ancho,
      y: -azar() * alto * 0.6,
      vx: (azar() - 0.5) * 260,
      vy: 220 + azar() * 420,
      giro: azar() * Math.PI * 2,
      velGiro: (azar() - 0.5) * 14,
      ancho: 8 + azar() * 12,
      alto: 5 + azar() * 8,
      color: paleta[Math.floor(azar() * paleta.length)],
      vaiven: azar() * Math.PI * 2,
    });
  }
  return piezas;
}

export function avanzarConfeti(piezas, dtSegundos) {
  for (const p of piezas) {
    p.vaiven += dtSegundos * 3;
    p.vy += 520 * dtSegundos;
    if (p.vy > 900) p.vy = 900;
    p.x += (p.vx + Math.sin(p.vaiven) * 70) * dtSegundos;
    p.y += p.vy * dtSegundos;
    p.giro += p.velGiro * dtSegundos;
  }
  return piezas;
}

export function quedanVisibles(piezas, alto) {
  return piezas.some((p) => p.y < alto + 40);
}
