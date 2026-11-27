# Arte del juego: pictogramas ARASAAC y dibujo propio

- Estado: aceptado
- Fecha: 2026-11-27
- Sustituye: `0002-arte-arasaac.md` (que limitaba ARASAAC a los cuatro objetivos).

## Contexto

Tras la serie de puntería, el arte era de dos manos: cuatro objetos reales en ARASAAC y 74
dibujos SVG hechos a mano para todo lo demás (menú, avatares, colección, refuerzos, fondos).
Al mirar la web se vio que el SVG propio **no aguanta su tamaño**: en el menú, un mundo pinta
un pictograma a ~104 px y una herramienta a ~40 px, y los dibujos planos (caras de tres
círculos, huellas de cinco elipses) se leen como manchas. El fondo, además, era un patrón de
huellas repetido que competía con las cartas del juego de parejas.

## Decisión

1. **ARASAAC manda en lo que se nombra.** Objetivos, cartas de parejas, colección de
   pegatinas, avatares y refuerzos que son un objeto (copo, hueso, silbato, rayo) son
   pictogramas de ARASAAC, PNG de 500 px servidos desde `assets/arasaac/`.
2. **El dibujo propio queda para lo que no es un objeto**: iconos de mecánica, punteros,
   controles del menú, el lugar del mundo, gestos (chispa, destello) y fondos.
3. **Cada pieza de ARASAAC se elige mirándola al tamaño real**, no por el primer resultado de
   la búsqueda: un pictograma que se lee bien a 300 px puede ser una mancha a 48 px.
4. **El mismo concepto usa el mismo pictograma** en la carta, el objetivo y la pegatina.
5. **Ningún icono propio se dibuja de un solo color.** En la primera revisión, el pivote
   provisional de la casa (silueta negra, luego verde) se vio como una mancha sobre el fondo.
   Un icono propio se distingue por su contorno: trazo grueso o al menos dos tonos.

## Consecuencias

- **Licencia:** sigue siendo CC BY-NC-SA 4.0 y el proyecto, no comercial. La atribución vive en
  `ATTRIBUTION.md` y se revisa con `npm run arasaac:licencia`.
- Los pictogramas no se modifican: solo se escalan y, para los dibujos claros (hueso, copo), se
  les pone un plato oscuro detrás para que se lean igual sobre cualquier fondo.
- Deprecar un dibujo propio no lo borra del código: `tests/arte.test.js` fija la lista de
  dibujos que **siguen** siendo propios, y un dibujo nuevo sin uso falla el test.
