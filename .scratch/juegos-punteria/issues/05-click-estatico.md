# 05: Click estático

**What to build:** Un juego de apuntar y clicar un dibujo grande que no se mueve, que se recoloca lejos entre aciertos para obligar a recorrer la pantalla. Partida corta con final claro.

**Blocked by:** 04 — Ayuda adaptativa y métricas

**Status:** hecho

- [x] El objetivo es fijo hasta el acierto y se recoloca a una distancia mínima entre aciertos.
- [x] El tamaño de partida es grande y la ayuda adaptativa lo modula.
- [x] El clic fuera del objetivo no penaliza de forma dura.
- [x] Disponible en los cuatro mundos desde el menú.
- [x] `window.juego` expone objetivo activo, aciertos y fin de partida.
- [x] Tests unitarios de recolocación y distancia mínima; test de Playwright de "clico el objetivo y avanza".

## Hecho

- **Lógica pura** en `js/click-estatico.js`: `distanciaMinima(radio)` (3 radios),
  `posicionesCandidatas` (rejilla 5×5 con esquinas reales y margen de 8 px),
  `elegirPosicionLejos` (sin referencia empieza centrado; con referencia filtra por distancia
  mínima y, si no cabe, cae a la más lejana) y `estaDentro`.
- **Escena** en `js/escena-click-estatico.js`, enrutada desde `js/escena.js`. El tamaño base se
  sortea una vez por partida (14–22 vmin) y la ayuda adaptativa lo aplica como escala, sin mover
  el centro. Tras cada acierto el objetivo se recoloca lejos y reaparece con `animarAparicion`;
  con movimiento reducido aparece de golpe y sin partículas.
- **Fallo suave**: un clic fuera suma un fallo (con pausa anti-rebote de 350 ms), pide ayuda
  (dos fallos seguidos suben un nivel y agrandan el dibujo) y suena con el tono suave de error.
  No resta aciertos, no mueve el objetivo y no termina la partida.
- **Registro y menú**: `MECANICAS.clickEstatico` pasa a `implementada: true` con meta 8; ya estaba
  en `ORDEN`, así que aparece solo en el menú en los cuatro mundos.
- **API observable** (`window.juego.escena`): `objetivo`, `aciertos`, `fallos`, `ayuda`,
  `terminada`, `meta`, `lista` y `visible`.
- **Tests**: `tests/click-estatico.test.js` (recolocación, distancia mínima, bordes y acierto/fallo)
  y tres casos Playwright en `tests/navegador.test.js` (acierto y recolocación, fallo suave con
  ayuda, y final de partida con vuelta al menú). Actualizados `tests/contenido.test.js` y la
  lista de juegos del menú.
- Suite completa: `node --test tests/*.test.js` → 111 tests en verde.
