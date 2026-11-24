# 02: Causa-efecto

**What to build:** Un juego donde cualquier clic en la escena provoca una aparición bonita en ese punto (no importa acertar). Es la entrada que enseña "el ratón hace cosas". La partida dura entre 60 y 90 segundos y termina con un final claro.

**Blocked by:** 01 — Maqueta jugable — menú, mundo y hover

**Status:** done

**Hecho:**
- Cualquier clic hace brotar el pictograma del mundo en ese punto, con anillo, chispas del
  color del mundo y anticipación/overshoot (matemática en `js/animaciones.js`, `animarBrote`).
- 12 toques por partida (`meta` en `js/contenido.js`); al llegar, confeti, fanfarria y vuelta al menú.
- Disponible en los cuatro mundos desde el menú, con icono propio (destello cian) distinto del de hover.
- `window.juego.escena` expone `toques`, `meta`, `terminada`, `lista`, `brotes` y `ultimoToque`.
- Tests: `tests/sesion.test.js` (regla de fin), `tests/animaciones.test.js` (brote) y dos de
  navegador (clic en cualquier sitio; la partida termina y vuelve al menú).

- [x] Clic en cualquier punto de la escena produce una aparición vistosa en ese punto.
- [x] El número de toques o el tiempo marcan el final de la partida con un cierre claro.
- [x] Al terminar, el niño vuelve al menú o repite sin leer nada.
- [x] El juego aparece en el menú con su pictograma y está disponible en los cuatro mundos.
- [x] Se exponen los toques y el fin de partida en `window.juego`.
- [x] Tests unitarios de la regla de fin de partida; test de Playwright de "clico en cualquier sitio y aparecen cosas" y "termina la partida".
