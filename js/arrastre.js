// Arrastre: geometría del reparto (el dibujo a un lado, su zona al otro) y la
// regla de soltado. Lógica pura: se prueba en node sin navegador. La escena solo
// dibuja y arrastra; aquí se decide dónde empieza cada cosa y qué significa
// soltar en un punto.
//
// El arrastre es la excepción declarada a "un solo clic" (spec 0001, Notas):
// pulsar, mantener y desplazar. No cambia ninguna mecánica anterior.

export const MARGEN = 12;
// La zona perdona un 25 % más allá de su borde: soltar cerca no frustra.
export const TOLERANCIA = 0.25;
// La zona es algo mayor que el dibujo para que quepa entero y sea fácil atinar.
export const FACTOR_ZONA = 1.35;
// Un gesto que no se mueve al menos esto (en vmin) es un clic, no un arrastre.
export const UMBRAL_ARRASTRE_VMIN = 3;

function acotar(valor, minimo, maximo) {
  return Math.min(Math.max(valor, minimo), maximo);
}

// Reparte el dibujo y su zona: en pantalla ancha, uno a cada lado; en pantalla
// alta, uno arriba y otro abajo. Ambos caben enteros con margen y queda
// recorrido de sobra entre ellos.
export function elegirReparto({ ancho, alto, radioObjetivo, margen = MARGEN }) {
  const anchoSeguro = Number.isFinite(ancho) && ancho > 0 ? ancho : 1;
  const altoSeguro = Number.isFinite(alto) && alto > 0 ? alto : 1;
  const radio = Number.isFinite(radioObjetivo) && radioObjetivo > 0 ? radioObjetivo : 1;
  const radioZona = radio * FACTOR_ZONA;
  const horizontal = anchoSeguro >= altoSeguro;

  if (horizontal) {
    const xInicio = acotar(anchoSeguro * 0.22, radio + margen, anchoSeguro - radio - margen);
    const xZona = acotar(
      anchoSeguro * 0.78,
      radioZona + margen,
      anchoSeguro - radioZona - margen,
    );
    const y = altoSeguro / 2;
    return {
      inicio: { x: xInicio, y, radio },
      zona: { x: xZona, y, radio: radioZona },
    };
  }

  const yInicio = acotar(altoSeguro * 0.25, radio + margen, altoSeguro - radio - margen);
  const yZona = acotar(
    altoSeguro * 0.75,
    radioZona + margen,
    altoSeguro - radioZona - margen,
  );
  const x = anchoSeguro / 2;
  return {
    inicio: { x, y: yInicio, radio },
    zona: { x, y: yZona, radio: radioZona },
  };
}

// ¿El puntero está sobre la figura? Sirve para agarrar el dibujo.
export function estaDentro(figura, x, y) {
  if (!figura) return false;
  return Math.hypot(x - figura.x, y - figura.y) <= figura.radio;
}

// La regla de soltado: acierta si el punto cae dentro de la zona, con la
// tolerancia acordada. Un fallo nunca resta: la escena solo lo anota suave.
export function resultadoSuelte({ zona, x, y, tolerancia = 0 }) {
  const t = Number.isFinite(tolerancia) && tolerancia > 0 ? tolerancia : 0;
  const distancia = Math.hypot(x - zona.x, y - zona.y);
  return { acierto: distancia <= zona.radio + t, distancia };
}

// Un clic quieto no es un arrastre: si no se ha movido lo suficiente, se
// cancela en silencio y no cuenta como fallo.
export function huboArrastre(desde, hasta, umbral) {
  return Math.hypot(hasta.x - desde.x, hasta.y - desde.y) > umbral;
}
