# 10: Cuatro mundos completos y accesibilidad

**What to build:** Los cuatro mundos quedan terminados visualmente: navidad, animalitos, fútbol y criatura amarilla inspirada (sin IP real). Se respeta `prefers-reduced-motion` y se ofrece pantalla completa; el juego aguanta pulsaciones rápidas repetidas sin romperse.

**Blocked by:** 03 — Refuerzo, sonido y pegatinas

**Status:** hecho

- [x] Los cuatro mundos tienen fondo, paleta, objetivo, refuerzo, puntero y sonidos propios.
- [x] Ningún mundo usa IP real ni assets de terceros con licencia restrictiva.
- [x] `prefers-reduced-motion` reduce confeti y partículas.
- [x] Se ofrece pantalla completa desde el menú; no hay scroll accidental.
- [x] Pulsar repetidamente muy rápido en cualquier juego no rompe la partida ni duplica pegatinas.
- [x] Test de Playwright con `reducedMotion: 'reduce'` de que se reduce la animación y no cambia el resultado del juego.

**Hecho:**
- `js/contenido.js` declara el paquete completo de cada mundo: `fondo`, `acento`, `paleta`,
  `fondoArte`, `objetivo` (pictograma ARASAAC), `refuerzo`, `puntero` y `sonidos` (acierto,
  entrada, error y fanfarria propios). El monstruo amarillo se describe por su aspecto, sin
  marcas ni IP real.
- `js/fondos.js` genera un fondo SVG propio y estático por mundo (nieve y abetos, huellas,
  campo de fútbol, rayos). Es una función pura, sin texto y sin recursos externos.
- El refuerzo de cada mundo es un sello DOM de menos de medio segundo con su dibujo propio
  (`copo`, `huella`, `silbato`, `chispa`); el puntero también cambia de forma por mundo. El
  canvas queda transparente (`background: [0,0,0,0]`) para dejar ver el arte del mundo.
- El confeti usa la paleta del mundo y la fanfarria sus notas; `entrada()` acepta el tono del
  mundo. Todo sonido pasa por los buses y controles ya existentes.
- Pantalla completa desde el menú, el juego y la colección con icono y `aria-label`, sin texto
  visible. `html`/`body` mantienen `overflow: hidden` y `overscroll-behavior: none`.
- `js/partida.js` añade una guarda de cierre única por generación: los avisos repetidos de fin y
  las pulsaciones rápidas de más no entregan dos pegatinas ni montan dos confetis.
- Movimiento reducido: la escena ya no lanza partículas ni sello, y `cantidadConfeti()` deja 40
  piezas en vez de 220. `window.juego.movimiento` expone `reducido` y `confeti` para poder
  comprobarlo sin capturas.
- Tests nuevos: `tests/mundos.test.js`, `tests/partida.test.js`, `tests/pantalla.test.js`, la
  paleta del confeti en `tests/confeti.test.js` y cuatro tests de navegador (pantalla completa,
  paquete visual de los cuatro mundos, clics rápidos sin duplicar pegatinas y
  `reducedMotion: 'reduce'` con el mismo resultado).
