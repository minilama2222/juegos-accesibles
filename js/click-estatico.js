// Click estático: el objetivo no se mueve hasta el acierto y, entre aciertos,
// se recoloca lejos para obligar a recorrer la pantalla. Lógica pura: se prueba
// en node sin navegador.
export const MARGEN_BORDE = 8;
export const RADIOS_DE_DISTANCIA = 3;
const COLUMNAS = 5;
const FILAS = 5;

// Cuánto tiene que alejarse el objetivo nuevo del anterior. Se mide en radios
// para que siga valiendo cuando la ayuda adaptativa agranda el dibujo.
export function distanciaMinima(radio) {
  return radio * RADIOS_DE_DISTANCIA;
}

export function distanciaEntre(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Rejilla de posiciones seguras: siempre dentro de la pantalla con margen.
export function posicionesCandidatas({ ancho, alto, radio, margen = MARGEN_BORDE }) {
  const minX = radio + margen;
  const maxX = ancho - radio - margen;
  const minY = radio + margen;
  const maxY = alto - radio - margen;
  if (maxX < minX || maxY < minY) return [];

  const puntos = [];
  for (let i = 0; i < COLUMNAS; i++) {
    for (let j = 0; j < FILAS; j++) {
      puntos.push({
        x: minX + (i / (COLUMNAS - 1)) * (maxX - minX),
        y: minY + (j / (FILAS - 1)) * (maxY - minY),
      });
    }
  }
  return puntos;
}

// Elige dónde aparece el objetivo. Sin `desde` empieza centrado (fácil); con
// `desde`, solo acepta candidatas a la distancia mínima. Si ninguna cabe, usa
// la más lejana posible: nunca deja el objetivo encima del anterior.
export function elegirPosicionLejos({ ancho, alto, radio, desde = null, margen = MARGEN_BORDE, azar = Math.random }) {
  const centro = { x: ancho / 2, y: alto / 2 };
  const candidatas = posicionesCandidatas({ ancho, alto, radio, margen });
  if (candidatas.length === 0) return centro;
  if (!desde) return centro;

  const minimo = distanciaMinima(radio);
  const lejos = candidatas.filter((p) => distanciaEntre(p, desde) >= minimo);
  if (lejos.length > 0) {
    const azarAcotado = Math.min(0.999999, Math.max(0, Number(azar()) || 0));
    return lejos[Math.floor(azarAcotado * lejos.length)];
  }

  let mejor = candidatas[0];
  for (const p of candidatas) {
    if (distanciaEntre(p, desde) > distanciaEntre(mejor, desde)) mejor = p;
  }
  return mejor;
}

export function estaDentro(objetivo, x, y) {
  if (!objetivo) return false;
  return Math.hypot(x - objetivo.x, y - objetivo.y) <= objetivo.radio;
}
