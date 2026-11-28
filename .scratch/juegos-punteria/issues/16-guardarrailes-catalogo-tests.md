# 16: Guardarraíles del catálogo en los tests

**What to build:** Que el catálogo no se pueda quedar viejo ni volver a llenarse de duplicados.
Los tests pasan a comprobar la coherencia entre manifiesto, ficheros y usos reales.

**Blocked by:** 14 — Nombres canónicos, variantes y fin de las repeticiones

**Status:** pendiente

- [ ] Añadir `tests/catalogo.test.js` con estas comprobaciones:
  - [ ] Todo id del manifiesto es único.
  - [ ] Toda pieza tiene `id`, `nombre`, `tipo`, `fuente`, `licencia`, `usos`, `tamanos` y
    `estado`; `usos` no está vacío.
  - [ ] No hay dos piezas con la misma `fuente`, salvo que sea una variante declarada y la
    fuente sea realmente distinta (dos ficheros, dos variantes).
  - [ ] Toda pieza propia tiene su `assets/propios/<id>.svg` y todo SVG de esa carpeta tiene
    su ficha. Un fichero huérfano o una ficha sin fichero fallan.
  - [ ] Todo SVG propio empieza por `<svg`, tiene `viewBox="0 0 120 120"`, no contiene
    `<text>`, `<script>`, `<image>`, `href=` ni `url(`.
  - [ ] Toda pieza ARASAAC tiene su PNG en `assets/arasaac/<id>.png`, cabecera PNG y 500×500.
  - [ ] Todo fondo tiene su generador en `js/fondos.js` y su `id` coincide con `fondoArte` de
    algún mundo.
  - [ ] Toda `varianteDe` apunta a una pieza existente y no crea un ciclo.
  - [ ] Ninguna pieza de contenido queda sin uso: si es una reserva, se llama `sin-dibujo` y
    está justificada; no se admiten reservas de contenido.
- [ ] Sustituir la lista cerrada `PROPIOS` de `tests/arte.test.js` por la lectura del
  manifiesto, manteniendo la comprobación de que no se cuelan dibujos nuevos sin ficha.
- [ ] Añadir un test que falle si aparece un `<svg>` inline en `js/` fuera de `js/arte.js` y
  `js/fondos.js` (la flecha de `main.js` ya no debe existir).
- [ ] Añadir un test de que los refuerzos de los cuatro mundos resuelven a una pieza del
  catálogo y no a la reserva.
- [ ] Mantener los tests de navegador existentes; añadir uno que abra `catalogo.html` y
  compruebe que pinta al menos una pieza de cada tipo.
- [ ] `npm run check` y `npm test` en verde.

**Criterio de aceptación:** renombrar una pieza, borrar un SVG o añadir un dibujo sin ficha
rompe un test con un mensaje que dice exactamente qué falta.
