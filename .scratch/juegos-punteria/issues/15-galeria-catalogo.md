# 15: Galería `catalogo.html` para revisar el arte a tamaño real

**What to build:** Una página estática de desarrollo que pinte todas las piezas del catálogo a
los tamaños reales del juego y sobre los fondos reales, para poder decidir qué rediseñar sin
abrir ficheros locales.

**Blocked by:** 14 — Nombres canónicos, variantes y fin de las repeticiones

**Status:** pendiente

- [ ] Crear `catalogo.html`, `js/catalogo.js` y el CSS necesario. Sin build: se sirve tal cual
  desde GitHub Pages.
- [ ] La página lee `PIEZAS` de `js/arte.js`; no mantiene una segunda lista de piezas.
- [ ] Agrupar por tipo: propias, ARASAAC, fondos. Dentro de cada grupo, ordenar por id.
- [ ] Cada pieza se pinta a 40, 100 y 300 px (y el fondo a 1600×900 escalado) sobre:
  - fondo claro,
  - fondo oscuro,
  - los cuatro fondos de mundo.
- [ ] Mostrar la ficha de cada pieza: id, nombre, tipo, fuente, licencia, usos, tamaños,
  estado, nota y `varianteDe` si la tiene.
- [ ] Enlazar cada pieza con su fichero real (`assets/propios/<id>.svg` o
  `assets/arasaac/<id>.png`) para poder abrirlo en una pestaña.
- [ ] Avisar en la propia página si hay dos fichas con la misma fuente, una pieza sin fichero o
  un fichero sin ficha. El aviso es informativo; el test del ticket 16 es el que bloquea.
- [ ] No enlazar la página desde el menú del niño ni desde la colección. Lleva
  `<meta name="robots" content="noindex">` y un enlace de vuelta al juego solo para el adulto.
- [ ] No cargar nada de red: ARASAAC y los SVG propios salen del repo.
- [ ] Comprobar la página en GitHub Pages con el servidor estático del repo.

**Criterio de aceptación:** abriendo `https://minilama2222.github.io/juegos-accesibles/catalogo.html`
se ven todas las piezas a los tres tamaños, sobre los cuatro mundos, con su ficha y sus avisos,
sin abrir ningún fichero local ni arrancar un servidor propio.
