// Construcción de SVG como cadena, para que el arte se pueda probar sin
// navegador. El lienzo es de 120×120: todo el dibujo propio se piensa en esa
// rejilla y se escala al tamaño que pida la pantalla.
export const LIENZO = 120;
export const CENTRO = 60;

export function svg(cuerpo, viewBox = LIENZO) {
  const caja = viewBox === LIENZO ? `0 0 ${LIENZO} ${LIENZO}` : viewBox;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${caja}">${cuerpo}</svg>`;
}

// Data-URI listo para un `src` de `<img>`.
export function dataUri(cadena) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cadena);
}
