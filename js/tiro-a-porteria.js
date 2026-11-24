// Tiro a portería: geometría de una portería fija con huecos y asignación de
// un clic a un hueco o a un fallo. Lógica pura: se prueba en node sin navegador.
// La escena solo dibuja y anima; aquí se decide qué significa cada clic.

export const COLUMNAS = 3;
export const FILAS = 2;
export const MARGEN_HUECO = 12;

// La portería vive en la zona central de la pantalla. Deja libre la franja de
// abajo (el balón sale de ahí) y un margen arriba/izquierda/derecha para los
// postes. Todo en píxeles de la escena.
export function geometriaPorteria({ ancho, alto }) {
  const anchoPorteria = ancho * 0.72;
  const altoPorteria = alto * 0.58;
  return {
    x: (ancho - anchoPorteria) / 2,
    y: alto * 0.16,
    ancho: anchoPorteria,
    alto: altoPorteria,
    poste: Math.max(6, Math.min(ancho, alto) * 0.012),
  };
}

function repartir(inicio, util, cantidad) {
  if (cantidad <= 1) return [inicio + util / 2];
  return Array.from({ length: cantidad }, (_, i) => inicio + (i / (cantidad - 1)) * util);
}

// Rejilla de huecos centrada dentro de la portería. `radio` es el radio base:
// la escena lo calcula con el mínimo de 44 px y la ayuda adaptativa lo escala
// después con `escalarHuecos` sin recolocarlos.
export function crearHuecos({ porteria, radio, columnas = COLUMNAS, filas = FILAS, margen = MARGEN_HUECO }) {
  const anchoUtil = porteria.ancho - 2 * (margen + radio);
  const altoUtil = porteria.alto - 2 * (margen + radio);
  if (anchoUtil < 0 || altoUtil < 0 || columnas < 1 || filas < 1) return [];

  const xs = repartir(porteria.x + margen + radio, anchoUtil, columnas);
  const ys = repartir(porteria.y + margen + radio, altoUtil, filas);
  const huecos = [];
  for (const y of ys) {
    for (const x of xs) {
      huecos.push({ id: huecos.length, x, y, radioBase: radio, radio });
    }
  }
  return huecos;
}

// Devuelve el índice del hueco tocado o -1. Si dos se solaparan, gana el más
// cercano al clic; nunca se inventa un acierto entre huecos.
export function asignarHueco(huecos, x, y) {
  if (!Array.isArray(huecos)) return -1;
  let elegido = -1;
  let distancia = Infinity;
  for (let i = 0; i < huecos.length; i++) {
    const h = huecos[i];
    if (!h) continue;
    const d = Math.hypot(x - h.x, y - h.y);
    if (d <= h.radio && d < distancia) {
      elegido = i;
      distancia = d;
    }
  }
  return elegido;
}

// La costura que pide el ticket: dado el clic, ¿gol o fallo?
export function resultadoTiro(huecos, x, y) {
  const hueco = asignarHueco(huecos, x, y);
  return { acierto: hueco >= 0, hueco };
}

// La ayuda nunca puede hacer que dos huecos se pisen: si el radio pedido
// llegara a la mitad de la distancia al centro más cercano, se queda ahí.
function distanciaMinimaEntreCentros(huecos) {
  let minima = Infinity;
  for (let i = 0; i < huecos.length; i++) {
    for (let j = i + 1; j < huecos.length; j++) {
      const d = Math.hypot(huecos[i].x - huecos[j].x, huecos[i].y - huecos[j].y);
      if (d < minima) minima = d;
    }
  }
  return minima;
}

export function escalarHuecos(huecos, factor) {
  const f = Number.isFinite(factor) && factor > 0 ? factor : 1;
  const tope = distanciaMinimaEntreCentros(huecos) / 2;
  return huecos.map((h) => {
    const deseado = h.radioBase * f;
    const radio = Number.isFinite(tope) ? Math.min(deseado, tope) : deseado;
    return { ...h, radio };
  });
}

// Zona vacía a la que va el balón cuando el clic no entra: el propio punto
// pulsado, acotado para que el balón no se salga de la pantalla.
export function destinoFallo({ ancho, alto, x, y, margen = 28 }) {
  const mx = Number.isFinite(x) ? x : ancho / 2;
  const my = Number.isFinite(y) ? y : alto / 2;
  return {
    x: Math.min(ancho - margen, Math.max(margen, mx)),
    y: Math.min(alto - margen, Math.max(margen, my)),
  };
}
